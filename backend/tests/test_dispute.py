import pytest
from app.models.user import User
from app.models.escrow import EscrowTransaction, EscrowStatus
from app.models.dispute import Dispute, DisputeStatus
from app.services.escrow_service import EscrowService
from app.core.security import hash_password
from datetime import datetime, timedelta

@pytest.fixture
def dispute_fixture(db_session):
    buyer = User(
        username="d_buyer",
        normalized_username="d_buyer",
        email="dbuyer@example.com",
        normalized_email="dbuyer@example.com",
        password_hash=hash_password("Pass12345!"),
        role="BUYER"
    )
    seller = User(
        username="d_seller",
        normalized_username="d_seller",
        email="dseller@example.com",
        normalized_email="dseller@example.com",
        password_hash=hash_password("Pass12345!"),
        role="SELLER"
    )
    reviewer = User(
        username="d_arbiter",
        normalized_username="d_arbiter",
        email="arbiter@example.com",
        normalized_email="arbiter@example.com",
        password_hash=hash_password("Pass12345!"),
        role="REVIEWER"
    )
    db_session.add_all([buyer, seller, reviewer])
    db_session.commit()

    escrow = EscrowService.create_escrow(
        db=db_session,
        buyer_id=buyer.id,
        seller_id=seller.id,
        title="Dispute item test",
        terms="Milestone terms",
        amount=20000,
        currency="USD",
        deadline=datetime.utcnow() + timedelta(days=5)
    )
    # Move to locked
    escrow.status = EscrowStatus.LOCKED.value
    db_session.commit()
    return buyer, seller, reviewer, escrow

def test_dispute_creation_and_refund_resolution(client, db_session, dispute_fixture):
    buyer, seller, reviewer, escrow = dispute_fixture

    # 1. Open dispute
    dispute = Dispute(
        escrow_id=escrow.id,
        opened_by=buyer.id,
        reason="Defective service",
        description="Seller delivered non-functional source code",
        status=DisputeStatus.OPEN.value
    )
    db_session.add(dispute)
    escrow.status = EscrowStatus.DISPUTED.value
    db_session.commit()

    assert escrow.status == EscrowStatus.DISPUTED.value

    # 2. Arbiter rules RefundBuyer
    EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.REFUNDED.value,
        actor=reviewer,
        event_type="DISPUTE_RESOLVED_REFUND"
    )
    dispute.status = DisputeStatus.RESOLVED_REFUND.value
    dispute.ruling = "REFUND_BUYER"
    dispute.assigned_reviewer_id = reviewer.id
    db_session.commit()

    assert escrow.status == EscrowStatus.REFUNDED.value
    assert escrow.closed_at is not None

def test_cannot_dispute_already_released_escrow(db_session, dispute_fixture):
    buyer, seller, reviewer, escrow = dispute_fixture
    escrow.status = EscrowStatus.RELEASED.value
    db_session.commit()

    # Attempt transition to disputed from released must fail
    with pytest.raises(Exception):
        EscrowService.transition_state(
            db=db_session,
            escrow=escrow,
            target_state=EscrowStatus.DISPUTED.value,
            actor=buyer,
            event_type="DISPUTE_OPENED"
        )
