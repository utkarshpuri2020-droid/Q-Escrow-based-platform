import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User, UserSecurity, UserSession, EmailVerificationToken, PasswordResetToken
from app.schemas.user import (
    UserRegisterRequest, UserLoginRequest, UserResponse,
    MFAEnableResponse, MFAVerifyRequest, ChangePasswordRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest
)
from app.core.security import (
    normalize_username, normalize_email, hash_password, verify_password,
    generate_secure_token, hash_token, generate_totp_secret, get_totp_uri,
    get_totp_qr_base64, verify_totp_code, generate_backup_codes, verify_and_consume_backup_code
)
from app.core.config import settings
from app.core.rate_limit import rate_limiter
from app.services.audit_service import AuditService
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    rate_limiter.check_rate_limit(request, "register", settings.RATE_LIMIT_REGISTER_PER_MINUTE)
    
    try:
        norm_username = normalize_username(data.username)
        norm_email = normalize_email(data.email)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Check case-insensitive uniqueness
    if db.query(User).filter(User.normalized_username == norm_username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already taken")
    if db.query(User).filter(User.normalized_email == norm_email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    pwd_hash = hash_password(data.password)
    user_role = data.role.upper() if data.role and data.role.upper() in ["BUYER", "SELLER", "REVIEWER", "ADMIN"] else "BUYER"

    user = User(
        username=data.username.strip(),
        normalized_username=norm_username,
        email=data.email.strip(),
        normalized_email=norm_email,
        password_hash=pwd_hash,
        role=user_role,
        email_verified=False
    )
    db.add(user)
    db.flush()

    # User security metadata
    security = UserSecurity(
        user_id=user.id,
        mfa_enabled=False
    )
    db.add(security)

    # Verification token
    raw_token = generate_secure_token()
    v_token = EmailVerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(v_token)

    AuditService.log_event(
        db=db,
        action="USER_REGISTRATION",
        resource_type="USER",
        resource_id=user.id,
        actor_id=user.id,
        actor_username=user.username,
        ip_address=request.client.host if request.client else None,
        details={"email": norm_email, "role": user_role, "verification_token_dev": raw_token}
    )

    db.commit()
    db.refresh(user)
    return user

@router.post("/login")
def login(
    data: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    rate_limiter.check_rate_limit(request, "login", settings.RATE_LIMIT_LOGIN_PER_MINUTE)

    login_identifier = data.username_or_email.strip().lower()
    user = db.query(User).filter(
        (User.normalized_username == login_identifier) | (User.normalized_email == login_identifier)
    ).first()

    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    if not user:
        AuditService.log_event(
            db=db,
            action="LOGIN_FAILED",
            resource_type="USER",
            outcome="FAILURE",
            ip_address=ip,
            details={"identifier": login_identifier, "reason": "user_not_found"}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username/email or password")

    security = user.security
    if security and security.locked_until and security.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account locked due to consecutive failed attempts. Try again after {security.locked_until.isoformat()}"
        )

    if not verify_password(data.password, user.password_hash):
        if security:
            security.failed_login_attempts += 1
            if security.failed_login_attempts >= 5:
                security.locked_until = datetime.utcnow() + timedelta(minutes=15)
            db.commit()

        AuditService.log_event(
            db=db,
            action="LOGIN_FAILED",
            resource_type="USER",
            resource_id=user.id,
            actor_username=user.username,
            outcome="FAILURE",
            ip_address=ip,
            details={"reason": "invalid_password"}
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username/email or password")

    # If MFA is enabled on account, require either TOTP or Backup code
    if security and security.mfa_enabled:
        mfa_ok = False
        if data.totp_code and verify_totp_code(security.mfa_secret, data.totp_code.strip()):
            mfa_ok = True
        elif data.backup_code and security.recovery_codes_hash:
            hashes = json.loads(security.recovery_codes_hash)
            success, remaining = verify_and_consume_backup_code(data.backup_code, hashes)
            if success:
                mfa_ok = True
                security.recovery_codes_hash = json.dumps(remaining)
                db.commit()

        if not mfa_ok:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="MFA code required or invalid"
            )

    # Login successful: reset failed attempts
    if security:
        security.failed_login_attempts = 0
        security.locked_until = None

    user.last_login_at = datetime.utcnow()

    # Create session
    raw_session_token = generate_secure_token(32)
    session_hash = hash_token(raw_session_token)
    expires = datetime.utcnow() + timedelta(minutes=settings.SESSION_EXPIRE_MINUTES)

    session = UserSession(
        session_token_hash=session_hash,
        user_id=user.id,
        expires_at=expires,
        ip_address=ip,
        user_agent=ua[:250] if ua else None
    )
    db.add(session)

    AuditService.log_event(
        db=db,
        action="LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=user.id,
        actor_id=user.id,
        actor_username=user.username,
        ip_address=ip,
        user_agent=ua
    )

    db.commit()

    # Set HttpOnly SameSite cookie
    response.set_cookie(
        key="session_token",
        value=raw_session_token,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,
        max_age=settings.SESSION_EXPIRE_MINUTES * 60
    )

    return {
        "message": "Login successful",
        "token": raw_session_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "email_verified": user.email_verified
        }
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
    elif "session_token" in request.cookies:
        token = request.cookies.get("session_token")

    if token:
        token_hash = hash_token(token)
        session = db.query(UserSession).filter(UserSession.session_token_hash == token_hash).first()
        if session:
            session.revoked_at = datetime.utcnow()
            db.commit()

    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}

@router.post("/logout-all")
def logout_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.revoked_at.is_(None)
    ).all()
    now = datetime.utcnow()
    for s in sessions:
        s.revoked_at = now
    db.commit()
    return {"message": f"Successfully revoked {len(sessions)} active sessions"}

@router.post("/verify-email")
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    t_hash = hash_token(data.token.strip())
    record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token_hash == t_hash,
        EmailVerificationToken.used_at.is_(None),
        EmailVerificationToken.expires_at > datetime.utcnow()
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification token")

    record.used_at = datetime.utcnow()
    user = db.query(User).filter(User.id == record.user_id).first()
    if user:
        user.email_verified = True
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    rate_limiter.check_rate_limit(request, "forgot_password", 3)
    norm_email = normalize_email(data.email)
    user = db.query(User).filter(User.normalized_email == norm_email).first()

    # Avoid account enumeration: always return generic message
    if user:
        raw_token = generate_secure_token()
        reset_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(raw_token),
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(reset_entry)
        AuditService.log_event(
            db=db,
            action="PASSWORD_RESET_REQUESTED",
            resource_type="USER",
            resource_id=user.id,
            actor_username=user.username,
            details={"email": norm_email, "reset_token_dev": raw_token}
        )
        db.commit()

    return {"message": "If an account exists with this email, password reset instructions have been sent."}

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    t_hash = hash_token(data.token.strip())
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == t_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    record.used_at = datetime.utcnow()
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    if user.security:
        user.security.password_changed_at = datetime.utcnow()

    # Invalidate all prior sessions on password reset
    db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked_at.is_(None)
    ).update({"revoked_at": datetime.utcnow()})

    db.commit()
    return {"message": "Password reset successfully. Please log in with your new credentials."}

@router.get("/mfa/setup", response_model=MFAEnableResponse)
def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, current_user.username)
    qr_b64 = get_totp_qr_base64(uri)
    return {
        "secret": secret,
        "provisioning_uri": uri,
        "qr_code_base64": qr_b64
    }

@router.post("/mfa/enable")
def enable_mfa(
    data: MFAVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_totp_code(data.secret, data.totp_code.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

    plain_codes, hashed_codes = generate_backup_codes(8)
    sec = current_user.security
    if not sec:
        sec = UserSecurity(user_id=current_user.id)
        db.add(sec)

    sec.mfa_enabled = True
    sec.mfa_secret = data.secret
    sec.recovery_codes_hash = json.dumps(hashed_codes)
    db.commit()

    return {
        "message": "Two-factor authentication enabled successfully",
        "backup_codes": plain_codes,
        "note": "Save these recovery codes in a secure offline location. They can be used to recover access if you lose your authenticator."
    }
