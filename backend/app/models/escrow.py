import uuid
from datetime import datetime
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class EscrowStatus(str, enum.Enum):
    CREATED = "CREATED"
    AWAITING_SELLER = "AWAITING_SELLER"
    AWAITING_FUNDING = "AWAITING_FUNDING"
    LOCKED = "LOCKED"
    IN_PROGRESS = "IN_PROGRESS"
    DELIVERY_SUBMITTED = "DELIVERY_SUBMITTED"
    AWAITING_BUYER_CONFIRMATION = "AWAITING_BUYER_CONFIRMATION"
    RELEASE_PENDING = "RELEASE_PENDING"
    RELEASED = "RELEASED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"
    DISPUTED = "DISPUTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class VerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"
    PENDING = "PENDING"
    NONE = "NONE"

class EscrowTransaction(Base):
    __tablename__ = "escrow_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    terms = Column(Text, nullable=False)
    terms_hash = Column(String(64), nullable=False)  # SHA-256 of canonical terms
    amount = Column(BigInteger, nullable=False)  # minor units (cents / satoshis / wei)
    currency = Column(String(10), default="USD", nullable=False)
    
    buyer_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    seller_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    status = Column(String(32), default=EscrowStatus.CREATED.value, nullable=False, index=True)
    release_conditions = Column(Text, nullable=True)
    
    blockchain_tx_hash = Column(String(66), nullable=True)
    onchain_escrow_id = Column(String(66), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    funded_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_id])
    seller = relationship("User", foreign_keys=[seller_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    history = relationship("EscrowStateHistory", back_populates="escrow", cascade="all, delete-orphan", order_by="EscrowStateHistory.timestamp")
    evidence = relationship("TransactionEvidence", back_populates="escrow", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="escrow", cascade="all, delete-orphan")

class EscrowStateHistory(Base):
    __tablename__ = "escrow_state_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    escrow_id = Column(String(36), ForeignKey("escrow_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_state = Column(String(32), nullable=True)
    new_state = Column(String(32), nullable=False)
    event_type = Column(String(50), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    transaction_data_hash = Column(String(64), nullable=False)  # SHA-256 canonical hash of current state
    previous_state_hash = Column(String(64), nullable=True)    # SHA-256 linking to predecessor
    
    signature = Column(Text, nullable=True)                     # ML-DSA signature
    signing_algorithm = Column(String(20), nullable=True)      # e.g., ML-DSA-65
    signing_key_id = Column(String(36), ForeignKey("cryptographic_keys.id", ondelete="SET NULL"), nullable=True)
    verification_status = Column(String(20), default=VerificationStatus.NONE.value, nullable=False)
    metadata_json = Column(Text, nullable=True)

    escrow = relationship("EscrowTransaction", back_populates="history")
    actor = relationship("User", foreign_keys=[actor_id])
    signing_key = relationship("CryptographicKey")

class TransactionEvidence(Base):
    __tablename__ = "transaction_evidence"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    escrow_id = Column(String(36), ForeignKey("escrow_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_by = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    mime_type = Column(String(100), nullable=True)
    content_hash = Column(String(64), nullable=False)  # SHA-256 of file content or evidence text
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)

    escrow = relationship("EscrowTransaction", back_populates="evidence")
    submitter = relationship("User", foreign_keys=[submitted_by])
