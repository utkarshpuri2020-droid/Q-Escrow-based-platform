import pytest
from app.services.crypto_service import CryptoService

def test_deterministic_canonical_serialization():
    payload1 = {"escrow_id": "123", "amount": 100, "currency": "USD", "terms": "Terms A"}
    payload2 = {"currency": "USD", "terms": "Terms A", "amount": 100, "escrow_id": "123"}

    str1 = CryptoService.canonical_serialize(payload1)
    str2 = CryptoService.canonical_serialize(payload2)

    assert str1 == str2
    assert str1 == '{"amount":100,"currency":"USD","escrow_id":"123","terms":"Terms A"}'
    assert CryptoService.sha256_str(str1) == CryptoService.sha256_str(str2)

def test_sha256_state_hash_calculation_and_tamper_detection():
    canonical_str, h1 = CryptoService.calculate_state_hash(
        escrow_id="escrow-abc",
        current_state="LOCKED",
        previous_state="AWAITING_FUNDING",
        event_type="BUYER_LOCKED_FUNDS",
        timestamp_iso="2026-10-26T12:00:00Z",
        amount=50000,
        currency="USD",
        terms_hash="a1b2c3d4",
        previous_state_hash="prev-hash-001"
    )

    # Re-calculate hash
    assert CryptoService.sha256_str(canonical_str) == h1

    # Tamper with amount or terms
    tampered_str, h_tampered = CryptoService.calculate_state_hash(
        escrow_id="escrow-abc",
        current_state="LOCKED",
        previous_state="AWAITING_FUNDING",
        event_type="BUYER_LOCKED_FUNDS",
        timestamp_iso="2026-10-26T12:00:00Z",
        amount=99999,  # Altered!
        currency="USD",
        terms_hash="a1b2c3d4",
        previous_state_hash="prev-hash-001"
    )
    assert h1 != h_tampered

def test_mldsa_keygen_and_signature_verification_all_param_sets():
    for param_set in ["ML-DSA-44", "ML-DSA-65", "ML-DSA-87"]:
        pk_hex, sk_hex, fp = CryptoService.generate_mldsa_keypair(param_set)
        assert len(pk_hex) > 0
        assert len(sk_hex) > 0
        assert len(fp) == 64  # SHA-256 fingerprint

        message = f"Q-Escrow state authentication token for {param_set}".encode("utf-8")
        sig_hex = CryptoService.sign_message(sk_hex, message, param_set)
        assert len(sig_hex) > 0

        # Valid signature verification
        is_valid = CryptoService.verify_signature(pk_hex, message, sig_hex, param_set)
        assert is_valid is True

        # Tampered message must fail verification
        tampered_msg = message + b"!"
        is_tampered_valid = CryptoService.verify_signature(pk_hex, tampered_msg, sig_hex, param_set)
        assert is_tampered_valid is False

        # Wrong public key must fail verification
        other_pk, other_sk, _ = CryptoService.generate_mldsa_keypair(param_set)
        is_wrong_pk_valid = CryptoService.verify_signature(other_pk, message, sig_hex, param_set)
        assert is_wrong_pk_valid is False

def test_crypto_verification_engine_report():
    pk, sk, _ = CryptoService.generate_mldsa_keypair("ML-DSA-65")
    canon, h = CryptoService.calculate_state_hash(
        escrow_id="test-report",
        current_state="LOCKED",
        previous_state="CREATED",
        event_type="FUNDED",
        timestamp_iso="2026-10-26T14:00:00Z",
        amount=1000,
        currency="USD",
        terms_hash="terms-hash-123"
    )

    sig = CryptoService.sign_message(sk, canon.encode("utf-8"), "ML-DSA-65")
    res = CryptoService.verify_escrow_transition(
        canonical_payload=canon,
        expected_state_hash=h,
        signature_hex=sig,
        public_key_hex=pk,
        parameter_set="ML-DSA-65"
    )

    assert res["status"] == "VERIFIED"
    assert res["hash_matches"] is True
    assert res["signature_verified"] is True

    # Modified payload check
    res_bad = CryptoService.verify_escrow_transition(
        canonical_payload=canon + " ",
        expected_state_hash=h,
        signature_hex=sig,
        public_key_hex=pk,
        parameter_set="ML-DSA-65"
    )
    assert res_bad["status"] == "FAILED"
    assert res_bad["hash_matches"] is False
