import sys
import os
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.db.session import engine, SessionLocal, Base
from app.models.user import User, UserSecurity
from app.models.crypto import CryptographicKey
from app.models.escrow import EscrowTransaction, EscrowStateHistory, EscrowStatus, VerificationStatus
from app.core.security import hash_password, normalize_username, normalize_email
from app.services.crypto_service import CryptoService

def seed():
    print("Seeding Q-Escrow development database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Users
        users_data = [
            ("buyer_alice", "alice@example.com", "AlicePass123!", "BUYER"),
            ("seller_bob", "bob@example.com", "BobPass123!", "SELLER"),
            ("reviewer_rachel", "reviewer@example.com", "ReviewerPass123!", "REVIEWER"),
            ("admin_arthur", "admin@example.com", "AdminPass123!", "ADMIN"),
        ]

        created_users = {}
        for uname, email, pwd, role in users_data:
            norm_u = normalize_username(uname)
            norm_e = normalize_email(email)

            user = db.query(User).filter(User.normalized_username == norm_u).first()
            if not user:
                user = User(
                    username=uname,
                    normalized_username=norm_u,
                    email=email,
                    normalized_email=norm_e,
                    password_hash=hash_password(pwd),
                    role=role,
                    email_verified=True,
                    account_status="ACTIVE"
                )
                db.add(user)
                db.flush()
                sec = UserSecurity(user_id=user.id, mfa_enabled=False)
                db.add(sec)
                print(f"  Created user: {uname} ({role})")
            created_users[uname] = user

        db.commit()

        # 2. Seed ML-DSA Keys for Alice & Bob
        alice = created_users["buyer_alice"]
        bob = created_users["seller_bob"]

        alice_key = db.query(CryptographicKey).filter(CryptographicKey.user_id == alice.id).first()
        if not alice_key:
            pk, sk, fp = CryptoService.generate_mldsa_keypair("ML-DSA-65")
            alice_key = CryptographicKey(
                user_id=alice.id,
                algorithm="ML-DSA-65",
                public_key_hex=pk,
                key_fingerprint=fp,
                key_version=1,
                status="ACTIVE",
                label="Alice Primary ML-DSA-65 Key"
            )
            db.add(alice_key)
            print("  Registered ML-DSA-65 key for Alice")

        bob_key = db.query(CryptographicKey).filter(CryptographicKey.user_id == bob.id).first()
        if not bob_key:
            pk_b, sk_b, fp_b = CryptoService.generate_mldsa_keypair("ML-DSA-65")
            bob_key = CryptographicKey(
                user_id=bob.id,
                algorithm="ML-DSA-65",
                public_key_hex=pk_b,
                key_fingerprint=fp_b,
                key_version=1,
                status="ACTIVE",
                label="Bob Primary ML-DSA-65 Key"
            )
            db.add(bob_key)
            print("  Registered ML-DSA-65 key for Bob")

        db.commit()

        # 3. Seed Sample Escrow Transaction
        escrow_title = "Quantum-Safe API Security Audit & Integration"
        sample_escrow = db.query(EscrowTransaction).filter(EscrowTransaction.title == escrow_title).first()
        if not sample_escrow:
            terms = (
                "Deliverables:\n"
                "1. Full smart contract audit of QEscrow.sol for reentrancy and access controls.\n"
                "2. NIST FIPS 204 ML-DSA integration validation report.\n"
                "3. SHA-256 state chain verification script and documentation.\n"
                "Release condition: Successful inspection by buyer within 14 days."
            )
            terms_hash = CryptoService.sha256_str(terms)
            deadline = datetime.utcnow() + timedelta(days=14)

            canonical_str, state_hash = CryptoService.calculate_state_hash(
                escrow_id="00000000-0000-0000-0000-000000000001",
                current_state=EscrowStatus.LOCKED.value,
                previous_state=EscrowStatus.AWAITING_FUNDING.value,
                event_type="BUYER_LOCKED_FUNDS",
                timestamp_iso=datetime.utcnow().isoformat() + "Z",
                amount=75000,
                currency="USD",
                terms_hash=terms_hash
            )

            sample_escrow = EscrowTransaction(
                id="00000000-0000-0000-0000-000000000001",
                title=escrow_title,
                description="Comprehensive smart contract and post-quantum cryptographic review milestone.",
                terms=terms,
                terms_hash=terms_hash,
                amount=75000,
                currency="USD",
                buyer_id=alice.id,
                seller_id=bob.id,
                status=EscrowStatus.LOCKED.value,
                blockchain_tx_hash="0x" + CryptoService.sha256_str("genesis_seed_tx_001"),
                deadline=deadline,
                funded_at=datetime.utcnow()
            )
            db.add(sample_escrow)

            # State history entries
            h1 = EscrowStateHistory(
                escrow_id=sample_escrow.id,
                previous_state=None,
                new_state=EscrowStatus.CREATED.value,
                event_type="ESCROW_CREATED",
                actor_id=alice.id,
                transaction_data_hash=CryptoService.sha256_str("created_state"),
                previous_state_hash=None,
                signing_algorithm="ML-DSA-65",
                verification_status=VerificationStatus.VERIFIED.value,
                metadata_json=canonical_str
            )
            h2 = EscrowStateHistory(
                escrow_id=sample_escrow.id,
                previous_state=EscrowStatus.CREATED.value,
                new_state=EscrowStatus.LOCKED.value,
                event_type="BUYER_LOCKED_FUNDS",
                actor_id=alice.id,
                transaction_data_hash=state_hash,
                previous_state_hash=h1.transaction_data_hash,
                signing_algorithm="ML-DSA-65",
                verification_status=VerificationStatus.VERIFIED.value,
                metadata_json=canonical_str
            )
            db.add_all([h1, h2])
            print("  Created sample active escrow: $750.00 USD (Status: LOCKED)")

        db.commit()
        print("Database seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
