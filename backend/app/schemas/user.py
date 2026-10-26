from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = "BUYER"  # BUYER, SELLER, REVIEWER

class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str
    totp_code: Optional[str] = None
    backup_code: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    email_verified: bool
    account_status: str
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserSecurityResponse(BaseModel):
    mfa_enabled: bool
    password_changed_at: datetime
    active_sessions_count: int

class MFAEnableResponse(BaseModel):
    secret: str
    provisioning_uri: str
    qr_code_base64: str

class MFAVerifyRequest(BaseModel):
    secret: str
    totp_code: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

class VerifyEmailRequest(BaseModel):
    token: str
