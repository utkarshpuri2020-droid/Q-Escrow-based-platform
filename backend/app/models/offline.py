import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Index
from app.db.session import Base

class OfflineDraftRecord(Base):
    __tablename__ = "offline_draft_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    local_draft_id = Column(String(100), nullable=False)
    user_id = Column(String(36), nullable=False, index=True)
    action_type = Column(String(50), nullable=False)
    payload_json = Column(Text, nullable=False)
    signature = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, SYNCED, REJECTED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    synced_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_offline_draft_user_draft", "user_id", "local_draft_id"),
    )
