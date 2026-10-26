from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserSession
from app.schemas.user import UserResponse, ChangePasswordRequest
from app.core.security import hash_password, verify_password
from app.api.deps import get_current_user
from app.services.audit_service import AuditService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/sessions")
def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.revoked_at.is_(None),
        UserSession.expires_at > datetime.utcnow()
    ).all()
    return [
        {
            "id": s.id,
            "created_at": s.created_at,
            "expires_at": s.expires_at,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent
        }
        for s in sessions
    ]

@router.delete("/me/sessions/{session_id}")
def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    session.revoked_at = datetime.utcnow()
    db.commit()
    return {"message": "Session revoked"}

@router.post("/me/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect")

    current_user.password_hash = hash_password(data.new_password)
    if current_user.security:
        current_user.security.password_changed_at = datetime.utcnow()

    AuditService.log_event(
        db=db,
        action="PASSWORD_CHANGED",
        resource_type="USER",
        resource_id=current_user.id,
        actor_id=current_user.id,
        actor_username=current_user.username
    )
    db.commit()
    return {"message": "Password updated successfully"}
