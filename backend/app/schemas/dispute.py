from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DisputeCreateRequest(BaseModel):
    escrow_id: str
    reason: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)

class DisputeResolveRequest(BaseModel):
    ruling: str  # REFUND_BUYER, RELEASE_SELLER, SPLIT_FUNDS
    resolution_notes: str = Field(..., min_length=5)
    buyer_split_amount: Optional[int] = 0
    seller_split_amount: Optional[int] = 0

class DisputeResponse(BaseModel):
    id: str
    escrow_id: str
    opened_by: str
    reason: str
    description: str
    status: str
    assigned_reviewer_id: Optional[str]
    ruling: Optional[str]
    resolution_notes: Optional[str]
    buyer_split_amount: int
    seller_split_amount: int
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True
