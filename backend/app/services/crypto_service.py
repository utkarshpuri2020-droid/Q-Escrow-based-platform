import hashlib
import json
from typing import Dict, Any, Tuple, Optional
from dilithium_py.ml_dsa import ML_DSA_44, ML_DSA_65, ML_DSA_87

PARAM_SETS = {
    "ML-DSA-44": ML_DSA_44,
    "ML-DSA-65": ML_DSA_65,
    "ML-DSA-87": ML_DSA_87,
}

class CryptoService:
    @staticmethod
    def sha256_hash(data: bytes) -> str:
        """Calculate SHA-256 hex digest of raw bytes."""
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def sha256_str(text: str) -> str:
        """Calculate SHA-256 hex digest of a UTF-8 string."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    @staticmethod
    def canonical_serialize(payload: Dict[str, Any]) -> str:
        """
        Deterministic canonical serialization:
        - Sorted keys
        - Strict separators (',', ':')
        - Escaped characters
        - Ensures identical JSON string across all platforms
        """
        return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

    @classmethod
    def calculate_state_hash(
        cls,
        escrow_id: str,
        current_state: str,
        previous_state: Optional[str],
        event_type: str,
        timestamp_iso: str,
        amount: int,
        currency: str,
        terms_hash: str,
        previous_state_hash: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Generates canonical payload string and SHA-256 state hash.
        Includes previous_state_hash to enforce tamper-evident hash chaining.
        """
        canonical_dict = {
            "amount": amount,
            "currency": currency,
            "current_state": current_state,
            "escrow_id": str(escrow_id),
            "event_type": event_type,
            "previous_state": previous_state or "",
            "previous_state_hash": previous_state_hash or "",
            "terms_hash": terms_hash,
            "timestamp": timestamp_iso,
            "version": "1.0"
        }
        canonical_str = cls.canonical_serialize(canonical_dict)
        state_hash = cls.sha256_str(canonical_str)
        return canonical_str, state_hash

    @classmethod
    def generate_mldsa_keypair(cls, parameter_set: str = "ML-DSA-65") -> Tuple[str, str, str]:
        """
        Generates a NIST FIPS 204 ML-DSA keypair.
        Returns: (public_key_hex, secret_key_hex, public_key_fingerprint)
        """
        algo = PARAM_SETS.get(parameter_set)
        if not algo:
            raise ValueError(f"Unsupported ML-DSA parameter set: {parameter_set}")

        pk_bytes, sk_bytes = algo.keygen()
        pk_hex = pk_bytes.hex()
        sk_hex = sk_bytes.hex()
        fingerprint = cls.sha256_str(pk_hex)
        return pk_hex, sk_hex, fingerprint

    @classmethod
    def sign_message(cls, secret_key_hex: str, message: bytes, parameter_set: str = "ML-DSA-65") -> str:
        """
        Signs a canonical message using NIST FIPS 204 ML-DSA.
        Returns: signature_hex
        """
        algo = PARAM_SETS.get(parameter_set)
        if not algo:
            raise ValueError(f"Unsupported ML-DSA parameter set: {parameter_set}")

        sk_bytes = bytes.fromhex(secret_key_hex)
        sig_bytes = algo.sign(sk_bytes, message)
        return sig_bytes.hex()

    @classmethod
    def verify_signature(
        cls,
        public_key_hex: str,
        message: bytes,
        signature_hex: str,
        parameter_set: str = "ML-DSA-65"
    ) -> bool:
        """
        Verifies an ML-DSA digital signature against message bytes.
        """
        algo = PARAM_SETS.get(parameter_set)
        if not algo:
            return False

        try:
            pk_bytes = bytes.fromhex(public_key_hex)
            sig_bytes = bytes.fromhex(signature_hex)
            return bool(algo.verify(pk_bytes, message, sig_bytes))
        except Exception:
            return False

    @classmethod
    def verify_escrow_transition(
        cls,
        canonical_payload: str,
        expected_state_hash: str,
        signature_hex: Optional[str],
        public_key_hex: Optional[str],
        parameter_set: str = "ML-DSA-65"
    ) -> Dict[str, Any]:
        """
        Performs dual verification:
        1. SHA-256 recalculation matches expected_state_hash
        2. ML-DSA digital signature matches public key
        """
        calculated_hash = cls.sha256_str(canonical_payload)
        hash_valid = (calculated_hash.lower() == expected_state_hash.lower())

        signature_valid = False
        if signature_hex and public_key_hex:
            signature_valid = cls.verify_signature(
                public_key_hex=public_key_hex,
                message=canonical_payload.encode("utf-8"),
                signature_hex=signature_hex,
                parameter_set=parameter_set
            )

        return {
            "calculated_hash": calculated_hash,
            "expected_hash": expected_state_hash,
            "hash_matches": hash_valid,
            "signature_verified": signature_valid,
            "parameter_set": parameter_set,
            "status": "VERIFIED" if (hash_valid and signature_valid) else (
                "HASH_ONLY_VERIFIED" if hash_valid and not signature_hex else "FAILED"
            )
        }
