import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base

class CryptographicKey(Base):
    __tablename__ = "cryptographic_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    algorithm = Column(String(20), default="ML-DSA-65", nullable=False)  # ML-DSA-44, ML-DSA-65, ML-DSA-87
    public_key_hex = Column(Text, nullable=False)
    key_fingerprint = Column(String(64), nullable=False, index=True)  # SHA-256 hex digest of public key
    key_version = Column(Integer, default=1, nullable=False)
    status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, REVOKED, EXPIRED
    label = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="keys")
