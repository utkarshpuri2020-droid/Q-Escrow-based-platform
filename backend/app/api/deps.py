from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserSession
from app.core.security import hash_token

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    # Check Authorization header (Bearer token) or session_token cookie
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
    elif "session_token" in request.cookies:
        token = request.cookies.get("session_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token_hash = hash_token(token)
    session = db.query(UserSession).filter(
        UserSession.session_token_hash == token_hash,
        UserSession.revoked_at.is_(None),
        UserSession.expires_at > datetime.utcnow()
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended"
        )

    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )
    return current_user

def require_reviewer_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["REVIEWER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Dispute reviewer access required"
        )
    return current_user
