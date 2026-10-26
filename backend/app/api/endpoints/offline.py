import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.offline import OfflineDraftRecord
from app.models.escrow import EscrowTransaction, EscrowStatus
from app.services.escrow_service import EscrowService
from app.services.audit_service import AuditService
from app.api.deps import get_current_user

router = APIRouter(prefix="/offline", tags=["Offline Synchronization"])

class OfflineEventSyncItem(BaseModel):
    local_draft_id: str
    action_type: str  # CREATE_ESCROW or TRANSITION
    payload: Dict[str, Any]
    signature: str = None
    signing_key_id: str = None

class OfflineSyncBatchRequest(BaseModel):
    events: List[OfflineEventSyncItem]

@router.post("/sync")
def sync_offline_events(
    data: OfflineSyncBatchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronizes locally queued offline draft events.
    Revalidates server-side permissions, signatures, deadlines, and state ordering.
    """
    results = []

    for item in data.events:
        # Check idempotency / duplicates
        existing = db.query(OfflineDraftRecord).filter(
            OfflineDraftRecord.user_id == current_user.id,
            OfflineDraftRecord.local_draft_id == item.local_draft_id
        ).first()

        if existing and existing.status == "SYNCED":
            results.append({
                "local_draft_id": item.local_draft_id,
                "status": "ALREADY_SYNCED",
                "message": "Event was previously synchronized."
            })
            continue

        draft_rec = existing or OfflineDraftRecord(
            local_draft_id=item.local_draft_id,
            user_id=current_user.id,
            action_type=item.action_type,
            payload_json=json.dumps(item.payload),
            signature=item.signature,
            status="PENDING"
        )
        if not existing:
            db.add(draft_rec)

        try:
            if item.action_type == "CREATE_ESCROW":
                seller_username = item.payload.get("seller_username")
                seller = db.query(User).filter(User.normalized_username == seller_username.strip().lower()).first()
                if not seller:
                    raise ValueError(f"Seller '{seller_username}' does not exist")

                deadline_days = int(item.payload.get("duration_days", 7))
                created_escrow = EscrowService.create_escrow(
                    db=db,
                    buyer_id=current_user.id,
                    seller_id=seller.id,
                    title=item.payload.get("title"),
                    description=item.payload.get("description", ""),
                    terms=item.payload.get("terms"),
                    amount=int(item.payload.get("amount")),
                    currency=item.payload.get("currency", "USD"),
                    deadline=datetime.utcnow() + timedelta(days=deadline_days),
                    signature=item.signature,
                    signing_key_id=item.signing_key_id
                )
                draft_rec.status = "SYNCED"
                draft_rec.synced_at = datetime.utcnow()
                results.append({
                    "local_draft_id": item.local_draft_id,
                    "status": "SUCCESS",
                    "escrow_id": created_escrow.id
                })

            elif item.action_type == "TRANSITION":
                escrow_id = item.payload.get("escrow_id")
                action = item.payload.get("action")
                escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == escrow_id).first()
                if not escrow:
                    raise ValueError("Target escrow transaction does not exist")

                action_map = {
                    "ACCEPT": (EscrowStatus.AWAITING_FUNDING.value, "SELLER_ACCEPTED_TERMS"),
                    "FUND": (EscrowStatus.LOCKED.value, "BUYER_LOCKED_FUNDS"),
                    "START": (EscrowStatus.IN_PROGRESS.value, "SELLER_COMMENCED_WORK"),
                    "SUBMIT_DELIVERY": (EscrowStatus.DELIVERY_SUBMITTED.value, "SELLER_SUBMITTED_DELIVERY"),
                    "CONFIRM_DELIVERY": (EscrowStatus.RELEASE_PENDING.value, "BUYER_CONFIRMED_DELIVERY"),
                    "RELEASE": (EscrowStatus.RELEASED.value, "ESCROW_FUNDS_RELEASED"),
                    "REFUND": (EscrowStatus.REFUND_PENDING.value, "BUYER_REQUESTED_REFUND"),
                    "CANCEL": (EscrowStatus.CANCELLED.value, "ESCROW_CANCELLED")
                }
                if action not in action_map:
                    raise ValueError(f"Invalid transition action: {action}")

                target_state, event_type = action_map[action]
                EscrowService.transition_state(
                    db=db,
                    escrow=escrow,
                    target_state=target_state,
                    actor=current_user,
                    event_type=event_type,
                    signature=item.signature,
                    signing_key_id=item.signing_key_id
                )
                draft_rec.status = "SYNCED"
                draft_rec.synced_at = datetime.utcnow()
                results.append({
                    "local_draft_id": item.local_draft_id,
                    "status": "SUCCESS",
                    "escrow_id": escrow_id
                })
            else:
                raise ValueError(f"Unknown offline action type: {item.action_type}")

        except Exception as e:
            draft_rec.status = "REJECTED"
            draft_rec.error_message = str(e)
            results.append({
                "local_draft_id": item.local_draft_id,
                "status": "REJECTED",
                "error": str(e)
            })

    db.commit()
    return {"synchronized_count": len([r for r in results if r["status"] == "SUCCESS"]), "results": results}
