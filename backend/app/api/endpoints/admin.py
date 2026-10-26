from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.escrow import EscrowTransaction, EscrowStateHistory, EscrowStatus
from app.models.dispute import Dispute, DisputeStatus
from app.models.audit import AuditLog
from app.api.deps import require_admin
from app.services.blockchain_service import blockchain_service

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/metrics")
def get_admin_metrics(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar()
    active_users = db.query(func.count(User.id)).filter(User.account_status == "ACTIVE").scalar()
    verified_users = db.query(func.count(User.id)).filter(User.email_verified == True).scalar()

    total_escrows = db.query(func.count(EscrowTransaction.id)).scalar()
    
    # Status distribution
    status_counts = {}
    for st in EscrowStatus:
        cnt = db.query(func.count(EscrowTransaction.id)).filter(EscrowTransaction.status == st.value).scalar()
        if cnt > 0:
            status_counts[st.value] = cnt

    open_disputes = db.query(func.count(Dispute.id)).filter(
        Dispute.status.in_([DisputeStatus.OPEN.value, DisputeStatus.UNDER_REVIEW.value])
    ).scalar()

    failed_verifications = db.query(func.count(EscrowStateHistory.id)).filter(
        EscrowStateHistory.verification_status == "FAILED"
    ).scalar()

    suspicious_events = db.query(func.count(AuditLog.id)).filter(
        (AuditLog.outcome == "FAILURE") | (AuditLog.outcome == "BLOCKED")
    ).scalar()

    recent_security_events = db.query(AuditLog).filter(
        AuditLog.action.in_(["LOGIN_FAILED", "PQC_KEY_REVOKED", "DISPUTE_OPENED"])
    ).order_by(AuditLog.timestamp.desc()).limit(10).all()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "verified": verified_users
        },
        "escrows": {
            "total": total_escrows,
            "status_distribution": status_counts
        },
        "disputes": {
            "open": open_disputes
        },
        "security": {
            "failed_verifications": failed_verifications,
            "suspicious_events": suspicious_events,
            "recent_events": [
                {
                    "action": e.action,
                    "actor_username": e.actor_username,
                    "timestamp": e.timestamp,
                    "outcome": e.outcome,
                    "ip_address": e.ip_address
                }
                for e in recent_security_events
            ]
        },
        "blockchain": blockchain_service.get_blockchain_status()
    }
