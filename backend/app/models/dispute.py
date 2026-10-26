import uuid
from datetime import datetime
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class DisputeStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED_REFUND = "RESOLVED_REFUND"
    RESOLVED_RELEASE = "RESOLVED_RELEASE"
    RESOLVED_SPLIT = "RESOLVED_SPLIT"
    CANCELLED = "CANCELLED"

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    escrow_id = Column(String(36), ForeignKey("escrow_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    opened_by = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reason = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(32), default=DisputeStatus.OPEN.value, nullable=False, index=True)
    assigned_reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ruling = Column(String(50), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    buyer_split_amount = Column(BigInteger, default=0, nullable=False)
    seller_split_amount = Column(BigInteger, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    escrow = relationship("EscrowTransaction", back_populates="disputes")
    initiator = relationship("User", foreign_keys=[opened_by])
    reviewer = relationship("User", foreign_keys=[assigned_reviewer_id])
