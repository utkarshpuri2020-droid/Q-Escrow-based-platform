from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class KeyRegisterRequest(BaseModel):
    algorithm: str = Field("ML-DSA-65", description="ML-DSA-44, ML-DSA-65, or ML-DSA-87")
    public_key_hex: str
    label: Optional[str] = "Default PQC Key"

class KeyRevokeRequest(BaseModel):
    key_id: str
    reason: Optional[str] = None

class KeyResponse(BaseModel):
    id: str
    algorithm: str
    public_key_hex: str
    key_fingerprint: str
    key_version: int
    status: str
    label: Optional[str]
    created_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VerifyTransactionRequest(BaseModel):
    escrow_id: str
    history_id: Optional[str] = None

class VerificationReportItem(BaseModel):
    history_id: str
    event_type: str
    state: str
    timestamp: datetime
    stored_hash: str
    calculated_hash: str
    hash_matched: bool
    previous_hash: Optional[str]
    chain_link_valid: bool
    has_signature: bool
    signature_algorithm: Optional[str]
    signature_verified: bool
    public_key_fingerprint: Optional[str]

class VerifyTransactionResponse(BaseModel):
    escrow_id: str
    overall_integrity_verified: bool
    signatures_verified: bool
    blockchain_tx_hash: Optional[str]
    blockchain_status: Dict[str, Any]
    chain_length: int
    items: List[VerificationReportItem]
