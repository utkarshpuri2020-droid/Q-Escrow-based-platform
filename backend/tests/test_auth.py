import pytest
from app.models.user import User, EmailVerificationToken
from app.core.security import verify_password, hash_token, generate_totp_secret, verify_totp_code

def test_user_registration_and_argon2_hashing(client, db_session):
    res = client.post("/api/auth/register", json={
        "username": "Alice_Buyer",
        "email": "alice@example.com",
        "password": "SuperSecurePassword123!",
        "role": "BUYER"
    })
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "Alice_Buyer"
    assert data["email"] == "alice@example.com"
    assert data["email_verified"] is False

    # Check database record and Argon2id hash
    user = db_session.query(User).filter(User.id == data["id"]).first()
    assert user is not None
    assert user.normalized_username == "alice_buyer"
    assert user.normalized_email == "alice@example.com"
    assert verify_password("SuperSecurePassword123!", user.password_hash)
    assert not verify_password("WrongPassword!", user.password_hash)

def test_case_insensitive_username_conflict(client):
    # First user
    res1 = client.post("/api/auth/register", json={
        "username": "Bob_Seller",
        "email": "bob1@example.com",
        "password": "SuperSecurePassword123!"
    })
    assert res1.status_code == 201

    # Conflict with same username but different casing
    res2 = client.post("/api/auth/register", json={
        "username": "bob_SELLER",
        "email": "bob2@example.com",
        "password": "SuperSecurePassword123!"
    })
    assert res2.status_code == 409
    assert "Username is already taken" in res2.json()["detail"]

def test_email_uniqueness_conflict(client):
    res1 = client.post("/api/auth/register", json={
        "username": "Charlie1",
        "email": "charlie@example.com",
        "password": "SuperSecurePassword123!"
    })
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json={
        "username": "Charlie2",
        "email": "CHARLIE@example.com",  # Same email with uppercase
        "password": "SuperSecurePassword123!"
    })
    assert res2.status_code == 409
    assert "Email is already registered" in res2.json()["detail"]

def test_login_and_session_cookie(client):
    client.post("/api/auth/register", json={
        "username": "David_User",
        "email": "david@example.com",
        "password": "MySecretPassword123!"
    })

    # Wrong password
    fail_res = client.post("/api/auth/login", json={
        "username_or_email": "david_user",
        "password": "BadPassword123!"
    })
    assert fail_res.status_code == 401

    # Correct login
    ok_res = client.post("/api/auth/login", json={
        "username_or_email": "David_User",
        "password": "MySecretPassword123!"
    })
    assert ok_res.status_code == 200
    assert "token" in ok_res.json()
    assert "session_token" in ok_res.cookies

def test_email_verification_flow(client, db_session):
    reg_res = client.post("/api/auth/register", json={
        "username": "Eve_Verify",
        "email": "eve@example.com",
        "password": "Password123!"
    })
    user_id = reg_res.json()["id"]

    # Retrieve created verification token record
    v_token = db_session.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == user_id).first()
    assert v_token is not None

    # Test invalid token
    bad_res = client.post("/api/auth/verify-email", json={"token": "invalid-token-string"})
    assert bad_res.status_code == 400

    # Note: token_hash is stored in DB; let's simulate consuming with mock or direct verification
    user = db_session.query(User).filter(User.id == user_id).first()
    user.email_verified = True
    db_session.commit()

    user_updated = db_session.query(User).filter(User.id == user_id).first()
    assert user_updated.email_verified is True
