from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class EscrowCreateRequest(BaseModel):
    seller_username: str
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    terms: str = Field(..., min_length=10)
    amount: int = Field(..., gt=0, description="Amount in minor currency units, e.g. cents")
    currency: str = Field("USD", max_length=10)
    duration_days: int = Field(7, ge=1, le=90)
    signature: Optional[str] = None
    signing_key_id: Optional[str] = None

class EscrowTransitionRequest(BaseModel):
    action: str  # ACCEPT, FUND, SUBMIT_DELIVERY, CONFIRM_DELIVERY, RELEASE, REFUND, CANCEL
    signature: Optional[str] = None
    signing_key_id: Optional[str] = None
    evidence_id: Optional[str] = None

class EscrowHistoryResponse(BaseModel):
    id: str
    previous_state: Optional[str]
    new_state: str
    event_type: str
    actor_id: Optional[str]
    timestamp: datetime
    transaction_data_hash: str
    previous_state_hash: Optional[str]
    signature: Optional[str]
    signing_algorithm: Optional[str]
    verification_status: str

    class Config:
        from_attributes = True

class EscrowResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    amount: int
    currency: str
    status: str
    buyer_id: str
    seller_id: str
    reviewer_id: Optional[str]
    terms_hash: str
    blockchain_tx_hash: Optional[str]
    deadline: datetime
    created_at: datetime
    funded_at: Optional[datetime]
    delivered_at: Optional[datetime]
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True

class EscrowDetailResponse(EscrowResponse):
    terms: str
    buyer_username: Optional[str] = None
    seller_username: Optional[str] = None
    history: List[EscrowHistoryResponse] = []

class EvidenceResponse(BaseModel):
    id: str
    escrow_id: str
    submitted_by: str
    title: str
    description: Optional[str]
    file_name: Optional[str]
    content_hash: str
    created_at: datetime

    class Config:
        from_attributes = True
