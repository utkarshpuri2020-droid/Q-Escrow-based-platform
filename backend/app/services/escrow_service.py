import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.escrow import EscrowTransaction, EscrowStateHistory, EscrowStatus, VerificationStatus
from app.models.user import User
from app.models.crypto import CryptographicKey
from app.models.notification import Notification
from app.services.crypto_service import CryptoService
from app.services.blockchain_service import blockchain_service
from app.services.audit_service import AuditService

VALID_TRANSITIONS = {
    EscrowStatus.CREATED.value: [EscrowStatus.AWAITING_SELLER.value, EscrowStatus.AWAITING_FUNDING.value, EscrowStatus.CANCELLED.value],
    EscrowStatus.AWAITING_SELLER.value: [EscrowStatus.AWAITING_FUNDING.value, EscrowStatus.CANCELLED.value, EscrowStatus.EXPIRED.value],
    EscrowStatus.AWAITING_FUNDING.value: [EscrowStatus.LOCKED.value, EscrowStatus.CANCELLED.value, EscrowStatus.EXPIRED.value],
    EscrowStatus.LOCKED.value: [EscrowStatus.IN_PROGRESS.value, EscrowStatus.DELIVERY_SUBMITTED.value, EscrowStatus.DISPUTED.value, EscrowStatus.REFUND_PENDING.value],
    EscrowStatus.IN_PROGRESS.value: [EscrowStatus.DELIVERY_SUBMITTED.value, EscrowStatus.DISPUTED.value, EscrowStatus.REFUND_PENDING.value],
    EscrowStatus.DELIVERY_SUBMITTED.value: [EscrowStatus.AWAITING_BUYER_CONFIRMATION.value, EscrowStatus.RELEASE_PENDING.value, EscrowStatus.DISPUTED.value],
    EscrowStatus.AWAITING_BUYER_CONFIRMATION.value: [EscrowStatus.RELEASE_PENDING.value, EscrowStatus.RELEASED.value, EscrowStatus.DISPUTED.value, EscrowStatus.REFUND_PENDING.value],
    EscrowStatus.RELEASE_PENDING.value: [EscrowStatus.RELEASED.value, EscrowStatus.DISPUTED.value],
    EscrowStatus.REFUND_PENDING.value: [EscrowStatus.REFUNDED.value, EscrowStatus.DISPUTED.value],
    EscrowStatus.DISPUTED.value: [EscrowStatus.RELEASED.value, EscrowStatus.REFUNDED.value],
    EscrowStatus.RELEASED.value: [],
    EscrowStatus.REFUNDED.value: [],
    EscrowStatus.EXPIRED.value: [EscrowStatus.REFUNDED.value],
    EscrowStatus.CANCELLED.value: [],
}

class EscrowService:
    @classmethod
    def create_escrow(
        cls,
        db: Session,
        buyer_id: str,
        seller_id: str,
        title: str,
        description: Optional[str] = "",
        terms: str = "",
        amount: int = 0,
        currency: str = "USD",
        deadline: datetime = None,
        reviewer_id: Optional[str] = None,
        signature: Optional[str] = None,
        signing_key_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> EscrowTransaction:
        if buyer_id == seller_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Buyer and seller cannot be the same user")
        if amount <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be positive")

        terms_hash = CryptoService.sha256_str(terms.strip())
        escrow_id = str(uuid.uuid4())
        now_iso = datetime.utcnow().isoformat() + "Z"

        # Calculate initial state hash
        canonical_str, state_hash = CryptoService.calculate_state_hash(
            escrow_id=escrow_id,
            current_state=EscrowStatus.CREATED.value,
            previous_state=None,
            event_type="ESCROW_CREATED",
            timestamp_iso=now_iso,
            amount=amount,
            currency=currency,
            terms_hash=terms_hash,
            previous_state_hash=None
        )

        # Verification of ML-DSA signature if provided
        v_status = VerificationStatus.NONE.value
        signing_algo = None
        if signature and signing_key_id:
            key = db.query(CryptographicKey).filter(CryptographicKey.id == signing_key_id, CryptographicKey.user_id == buyer_id).first()
            if key and key.status == "ACTIVE":
                signing_algo = key.algorithm
                if CryptoService.verify_signature(key.public_key_hex, canonical_str.encode("utf-8"), signature, key.algorithm):
                    v_status = VerificationStatus.VERIFIED.value
                else:
                    v_status = VerificationStatus.FAILED.value

        escrow = EscrowTransaction(
            id=escrow_id,
            title=title,
            description=description,
            terms=terms,
            terms_hash=terms_hash,
            amount=amount,
            currency=currency,
            buyer_id=buyer_id,
            seller_id=seller_id,
            reviewer_id=reviewer_id,
            status=EscrowStatus.AWAITING_SELLER.value,  # Prompt seller to review
            deadline=deadline
        )
        db.add(escrow)

        history_entry = EscrowStateHistory(
            escrow_id=escrow_id,
            previous_state=None,
            new_state=EscrowStatus.CREATED.value,
            event_type="ESCROW_CREATED",
            actor_id=buyer_id,
            transaction_data_hash=state_hash,
            previous_state_hash=None,
            signature=signature,
            signing_algorithm=signing_algo,
            signing_key_id=signing_key_id,
            verification_status=v_status,
            metadata_json=canonical_str
        )
        db.add(history_entry)

        # In-app notification to seller
        seller_notif = Notification(
            user_id=seller_id,
            notification_type="ESCROW_INVITATION",
            title="New Escrow Agreement Proposed",
            message=f"You have been invited to an escrow agreement: '{title}' for {amount / 100:.2f} {currency}.",
            link=f"/escrows/{escrow_id}"
        )
        db.add(seller_notif)

        # Audit log
        AuditService.log_event(
            db=db,
            action="ESCROW_CREATED",
            resource_type="ESCROW",
            resource_id=escrow_id,
            actor_id=buyer_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"title": title, "amount": amount, "currency": currency, "terms_hash": terms_hash}
        )

        db.commit()
        db.refresh(escrow)
        return escrow

    @classmethod
    def transition_state(
        cls,
        db: Session,
        escrow: EscrowTransaction,
        target_state: str,
        actor: User,
        event_type: str,
        signature: Optional[str] = None,
        signing_key_id: Optional[str] = None,
        evidence_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> EscrowTransaction:
        current_state = escrow.status
        allowed = VALID_TRANSITIONS.get(current_state, [])
        if target_state not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal transition: Cannot transition from {current_state} to {target_state}"
            )

        # Authorization checks per transition
        if target_state == EscrowStatus.AWAITING_FUNDING.value and actor.id != escrow.seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only seller can accept terms")
        elif target_state == EscrowStatus.LOCKED.value and actor.id != escrow.buyer_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only buyer can fund escrow")
        elif target_state == EscrowStatus.DELIVERY_SUBMITTED.value and actor.id != escrow.seller_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only seller can submit delivery")
        elif target_state in [EscrowStatus.RELEASE_PENDING.value, EscrowStatus.RELEASED.value] and current_state != EscrowStatus.DISPUTED.value:
            if actor.id != escrow.buyer_id and actor.role != "ADMIN":
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only buyer or admin can release funds")

        # Get latest state history record for hash-linking
        latest_history = db.query(EscrowStateHistory).filter(
            EscrowStateHistory.escrow_id == escrow.id
        ).order_by(EscrowStateHistory.timestamp.desc()).first()

        prev_hash = latest_history.transaction_data_hash if latest_history else None
        now_iso = datetime.utcnow().isoformat() + "Z"

        canonical_str, state_hash = CryptoService.calculate_state_hash(
            escrow_id=escrow.id,
            current_state=target_state,
            previous_state=current_state,
            event_type=event_type,
            timestamp_iso=now_iso,
            amount=escrow.amount,
            currency=escrow.currency,
            terms_hash=escrow.terms_hash,
            previous_state_hash=prev_hash
        )

        v_status = VerificationStatus.NONE.value
        signing_algo = None
        if signature and signing_key_id:
            key = db.query(CryptographicKey).filter(
                CryptographicKey.id == signing_key_id,
                CryptographicKey.user_id == actor.id
            ).first()
            if key and key.status == "ACTIVE":
                signing_algo = key.algorithm
                if CryptoService.verify_signature(key.public_key_hex, canonical_str.encode("utf-8"), signature, key.algorithm):
                    v_status = VerificationStatus.VERIFIED.value
                else:
                    v_status = VerificationStatus.FAILED.value

        # Update escrow state
        escrow.status = target_state
        if target_state == EscrowStatus.LOCKED.value:
            escrow.funded_at = datetime.utcnow()
        elif target_state == EscrowStatus.DELIVERY_SUBMITTED.value:
            escrow.delivered_at = datetime.utcnow()
        elif target_state in [EscrowStatus.RELEASED.value, EscrowStatus.REFUNDED.value, EscrowStatus.CANCELLED.value]:
            escrow.closed_at = datetime.utcnow()

        # Submit or record blockchain event
        onchain_res = blockchain_service.record_onchain_event(
            event_name=event_type,
            escrow_id=escrow.id,
            actor_address=actor.id,
            terms_hash=escrow.terms_hash,
            amount=escrow.amount
        )
        escrow.blockchain_tx_hash = onchain_res.get("blockchain_tx_hash")

        history_entry = EscrowStateHistory(
            escrow_id=escrow.id,
            previous_state=current_state,
            new_state=target_state,
            event_type=event_type,
            actor_id=actor.id,
            transaction_data_hash=state_hash,
            previous_state_hash=prev_hash,
            signature=signature,
            signing_algorithm=signing_algo,
            signing_key_id=signing_key_id,
            verification_status=v_status,
            metadata_json=canonical_str
        )
        db.add(history_entry)

        # Notification recipient is the other party
        recipient_id = escrow.buyer_id if actor.id == escrow.seller_id else escrow.seller_id
        notif = Notification(
            user_id=recipient_id,
            notification_type=event_type,
            title=f"Escrow Update: {target_state}",
            message=f"Escrow '{escrow.title}' has changed state to {target_state}.",
            link=f"/escrows/{escrow.id}"
        )
        db.add(notif)

        AuditService.log_event(
            db=db,
            action=f"ESCROW_TRANSITION_{event_type}",
            resource_type="ESCROW",
            resource_id=escrow.id,
            actor_id=actor.id,
            actor_username=actor.username,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"previous_state": current_state, "new_state": target_state, "state_hash": state_hash, "blockchain_tx": escrow.blockchain_tx_hash}
        )

        db.commit()
        db.refresh(escrow)
        return escrow
