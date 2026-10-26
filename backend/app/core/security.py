import re
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import pyotp
import qrcode
import io
import base64
from app.core.config import settings

# Argon2id password hasher with secure parameters
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16
)

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\.]{3,30}$")
EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,10}$")

def normalize_username(username: str) -> str:
    """Trim and lowercase username for consistent uniqueness checks."""
    if not username:
        raise ValueError("Username cannot be empty")
    cleaned = username.strip()
    if not USERNAME_REGEX.match(cleaned):
        raise ValueError("Username must be 3-30 characters containing only letters, numbers, hyphens, underscores, or periods")
    return cleaned.lower()

def normalize_email(email: str) -> str:
    """Trim and lowercase email for consistent uniqueness checks."""
    if not email:
        raise ValueError("Email cannot be empty")
    cleaned = email.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Invalid email format")
    return cleaned

def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if len(password) > 128:
        raise ValueError("Password must not exceed 128 characters")
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError):
        return False

def generate_secure_token(nbytes: int = 32) -> str:
    """Generate cryptographically secure URL-safe random token."""
    return secrets.token_urlsafe(nbytes)

def hash_token(token: str) -> str:
    """Generate SHA-256 hash of a session/reset/verification token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def generate_totp_secret() -> str:
    """Generate random base32 secret for TOTP."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, username: str) -> str:
    """Generate provisioning URI for authenticator apps."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name="Q-Escrow")

def get_totp_qr_base64(provisioning_uri: str) -> str:
    """Generate Base64 encoded PNG QR code for TOTP provisioning."""
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

def verify_totp_code(secret: str, code: str) -> bool:
    """Verify user-provided 6-digit TOTP code with 1-step window tolerance."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_backup_codes(count: int = 8) -> Tuple[List[str], List[str]]:
    """
    Generate recovery codes.
    Returns: (plain_codes, hashed_codes)
    """
    plain_codes = [secrets.token_hex(4).upper() for _ in range(count)]
    hashed_codes = [hashlib.sha256(c.encode("utf-8")).hexdigest() for c in plain_codes]
    return plain_codes, hashed_codes

def verify_and_consume_backup_code(code: str, hashed_codes: List[str]) -> Tuple[bool, List[str]]:
    """
    Verify backup code against list of hashes, remove consumed code if valid.
    """
    target_hash = hashlib.sha256(code.strip().upper().encode("utf-8")).hexdigest()
    if target_hash in hashed_codes:
        new_list = [h for h in hashed_codes if h != target_hash]
        return True, new_list
    return False, hashed_codes
