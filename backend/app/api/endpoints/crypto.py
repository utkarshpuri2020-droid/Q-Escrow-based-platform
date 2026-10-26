from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.crypto import CryptographicKey
from app.models.escrow import EscrowTransaction, EscrowStateHistory
from app.schemas.crypto import (
    KeyRegisterRequest, KeyRevokeRequest, KeyResponse,
    VerifyTransactionRequest, VerifyTransactionResponse, VerificationReportItem
)
from app.services.crypto_service import CryptoService
from app.services.blockchain_service import blockchain_service
from app.services.audit_service import AuditService
from app.api.deps import get_current_user

router = APIRouter(prefix="/crypto", tags=["Cryptography"])

@router.post("/keys/register", response_model=KeyResponse, status_code=status.HTTP_201_CREATED)
def register_public_key(
    data: KeyRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.algorithm not in ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Algorithm must be ML-DSA-44, ML-DSA-65, or ML-DSA-87")

    clean_hex = data.public_key_hex.strip().lower()
    fingerprint = CryptoService.sha256_str(clean_hex)

    # Check key version
    existing_keys_count = db.query(CryptographicKey).filter(
        CryptographicKey.user_id == current_user.id
    ).count()

    key_record = CryptographicKey(
        user_id=current_user.id,
        algorithm=data.algorithm,
        public_key_hex=clean_hex,
        key_fingerprint=fingerprint,
        key_version=existing_keys_count + 1,
        status="ACTIVE",
        label=data.label or f"{data.algorithm} Key v{existing_keys_count + 1}"
    )
    db.add(key_record)

    AuditService.log_event(
        db=db,
        action="PQC_KEY_REGISTERED",
        resource_type="CRYPTO_KEY",
        actor_id=current_user.id,
        actor_username=current_user.username,
        details={"algorithm": data.algorithm, "fingerprint": fingerprint, "version": existing_keys_count + 1}
    )

    db.commit()
    db.refresh(key_record)
    return key_record

@router.get("/keys", response_model=List[KeyResponse])
def get_user_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(CryptographicKey).filter(
        CryptographicKey.user_id == current_user.id
    ).order_by(CryptographicKey.created_at.desc()).all()

@router.post("/keys/{key_id}/revoke", response_model=KeyResponse)
def revoke_key(
    key_id: str,
    data: Optional[KeyRevokeRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    key = db.query(CryptographicKey).filter(
        CryptographicKey.id == key_id,
        CryptographicKey.user_id == current_user.id
    ).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cryptographic key not found")

    key.status = "REVOKED"
    key.revoked_at = datetime.utcnow()

    AuditService.log_event(
        db=db,
        action="PQC_KEY_REVOKED",
        resource_type="CRYPTO_KEY",
        resource_id=key.id,
        actor_id=current_user.id,
        actor_username=current_user.username,
        details={"fingerprint": key.key_fingerprint, "reason": data.reason if data else "Manual revocation"}
    )
    db.commit()
    db.refresh(key)
    return key

@router.post("/generate-dev-keypair")
def generate_dev_keypair(
    algorithm: str = "ML-DSA-65",
    current_user: User = Depends(get_current_user)
):
    """
    Assists in generating a NIST FIPS 204 ML-DSA keypair for signing tests.
    Returns: { algorithm, public_key_hex, secret_key_hex, fingerprint, warning }
    """
    if algorithm not in ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Supported algorithms: ML-DSA-44, ML-DSA-65, ML-DSA-87")

    pk_hex, sk_hex, fp = CryptoService.generate_mldsa_keypair(algorithm)
    return {
        "algorithm": algorithm,
        "public_key_hex": pk_hex,
        "secret_key_hex": sk_hex,
        "fingerprint": fp,
        "warning": "For development only. Keep secret_key_hex strictly on client side in production."
    }

@router.post("/verify-transaction", response_model=VerifyTransactionResponse)
def verify_transaction_cryptography(
    data: VerifyTransactionRequest,
    db: Session = Depends(get_db)
):
    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == data.escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow transaction not found")

    history_records = db.query(EscrowStateHistory).filter(
        EscrowStateHistory.escrow_id == escrow.id
    ).order_by(EscrowStateHistory.timestamp.asc()).all()

    items = []
    overall_integrity = True
    all_signatures_valid = True
    prev_stored_hash = None

    for rec in history_records:
        calc_hash = CryptoService.sha256_str(rec.metadata_json) if rec.metadata_json else rec.transaction_data_hash
        hash_matched = (calc_hash.lower() == rec.transaction_data_hash.lower())
        
        # Chain link verification: does rec.previous_state_hash equal predecessor's transaction_data_hash?
        chain_link_valid = True
        if prev_stored_hash is not None:
            chain_link_valid = (rec.previous_state_hash == prev_stored_hash)
        elif rec.previous_state_hash is not None:
            # First item shouldn't have predecessor unless initialized with one
            chain_link_valid = True

        prev_stored_hash = rec.transaction_data_hash

        sig_verified = False
        fp = None
        has_sig = bool(rec.signature and rec.signing_key_id)
        if has_sig:
            key = db.query(CryptographicKey).filter(CryptographicKey.id == rec.signing_key_id).first()
            if key:
                fp = key.key_fingerprint
                algo = rec.signing_algorithm or key.algorithm
                sig_verified = CryptoService.verify_signature(
                    public_key_hex=key.public_key_hex,
                    message=rec.metadata_json.encode("utf-8") if rec.metadata_json else b"",
                    signature_hex=rec.signature,
                    parameter_set=algo
                )
                if not sig_verified:
                    all_signatures_valid = False
            else:
                all_signatures_valid = False

        if not hash_matched or not chain_link_valid:
            overall_integrity = False

        items.append(VerificationReportItem(
            history_id=rec.id,
            event_type=rec.event_type,
            state=rec.new_state,
            timestamp=rec.timestamp,
            stored_hash=rec.transaction_data_hash,
            calculated_hash=calc_hash,
            hash_matched=hash_matched,
            previous_hash=rec.previous_state_hash,
            chain_link_valid=chain_link_valid,
            has_signature=has_sig,
            signature_algorithm=rec.signing_algorithm,
            signature_verified=sig_verified,
            public_key_fingerprint=fp
        ))

    bc_status = blockchain_service.get_blockchain_status()

    return VerifyTransactionResponse(
        escrow_id=escrow.id,
        overall_integrity_verified=overall_integrity,
        signatures_verified=all_signatures_valid if any(i.has_signature for i in items) else False,
        blockchain_tx_hash=escrow.blockchain_tx_hash,
        blockchain_status=bc_status,
        chain_length=len(items),
        items=items
    )
