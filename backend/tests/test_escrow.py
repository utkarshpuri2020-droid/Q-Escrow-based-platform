import pytest
from app.models.user import User
from app.models.escrow import EscrowTransaction, EscrowStateHistory, EscrowStatus
from app.services.escrow_service import EscrowService
from app.core.security import hash_password
from datetime import datetime, timedelta

@pytest.fixture
def test_users(db_session):
    buyer = User(
        username="buyer_bob",
        normalized_username="buyer_bob",
        email="buyer@example.com",
        normalized_email="buyer@example.com",
        password_hash=hash_password("Pass12345!"),
        role="BUYER"
    )
    seller = User(
        username="seller_sam",
        normalized_username="seller_sam",
        email="seller@example.com",
        normalized_email="seller@example.com",
        password_hash=hash_password("Pass12345!"),
        role="SELLER"
    )
    db_session.add_all([buyer, seller])
    db_session.commit()
    return buyer, seller

def test_full_escrow_lifecycle(db_session, test_users):
    buyer, seller = test_users
    deadline = datetime.utcnow() + timedelta(days=7)

    # 1. Create escrow
    escrow = EscrowService.create_escrow(
        db=db_session,
        buyer_id=buyer.id,
        seller_id=seller.id,
        title="Web Development Milestone 1",
        description="Landing page delivery",
        terms="Milestone 1 terms and specifications",
        amount=50000,
        currency="USD",
        deadline=deadline
    )
    assert escrow.status == EscrowStatus.AWAITING_SELLER.value
    assert escrow.terms_hash is not None

    # Check state history entry
    hist1 = db_session.query(EscrowStateHistory).filter(EscrowStateHistory.escrow_id == escrow.id).first()
    assert hist1 is not None
    assert hist1.new_state == EscrowStatus.CREATED.value

    # 2. Seller accepts terms -> AWAITING_FUNDING
    escrow = EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.AWAITING_FUNDING.value,
        actor=seller,
        event_type="SELLER_ACCEPTED_TERMS"
    )
    assert escrow.status == EscrowStatus.AWAITING_FUNDING.value

    # 3. Buyer locks funds -> LOCKED
    escrow = EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.LOCKED.value,
        actor=buyer,
        event_type="BUYER_LOCKED_FUNDS"
    )
    assert escrow.status == EscrowStatus.LOCKED.value
    assert escrow.funded_at is not None

    # 4. Seller begins work -> IN_PROGRESS
    escrow = EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.IN_PROGRESS.value,
        actor=seller,
        event_type="SELLER_COMMENCED_WORK"
    )
    assert escrow.status == EscrowStatus.IN_PROGRESS.value

    # 5. Seller submits delivery -> DELIVERY_SUBMITTED
    escrow = EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.DELIVERY_SUBMITTED.value,
        actor=seller,
        event_type="SELLER_SUBMITTED_DELIVERY"
    )
    assert escrow.status == EscrowStatus.DELIVERY_SUBMITTED.value
    assert escrow.delivered_at is not None

    # 6. Buyer confirms delivery -> RELEASE_PENDING
    escrow = EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.RELEASE_PENDING.value,
        actor=buyer,
        event_type="BUYER_CONFIRMED_DELIVERY"
    )
    assert escrow.status == EscrowStatus.RELEASE_PENDING.value

    # 7. Release payout -> RELEASED
    escrow = EscrowService.transition_state(
        db=db_session,
        escrow=escrow,
        target_state=EscrowStatus.RELEASED.value,
        actor=buyer,
        event_type="ESCROW_FUNDS_RELEASED"
    )
    assert escrow.status == EscrowStatus.RELEASED.value
    assert escrow.closed_at is not None

    # 8. Prevent double release
    with pytest.raises(Exception):
        EscrowService.transition_state(
            db=db_session,
            escrow=escrow,
            target_state=EscrowStatus.RELEASED.value,
            actor=buyer,
            event_type="ESCROW_FUNDS_RELEASED"
        )

    # 9. Verify state history chain linkage
    hist_list = db_session.query(EscrowStateHistory).filter(
        EscrowStateHistory.escrow_id == escrow.id
    ).order_by(EscrowStateHistory.timestamp.asc()).all()

    assert len(hist_list) == 7
    for i in range(1, len(hist_list)):
        # Every subsequent state's previous_state_hash matches prior state's transaction_data_hash
        assert hist_list[i].previous_state_hash == hist_list[i - 1].transaction_data_hash

def test_unauthorized_party_cannot_release(db_session, test_users):
    buyer, seller = test_users
    deadline = datetime.utcnow() + timedelta(days=7)

    escrow = EscrowService.create_escrow(
        db=db_session,
        buyer_id=buyer.id,
        seller_id=seller.id,
        title="Unauthorized test",
        terms="Sample terms",
        amount=10000,
        currency="USD",
        deadline=deadline
    )

    # Move to locked
    escrow.status = EscrowStatus.LOCKED.value
    db_session.commit()

    # Seller tries to release funds to himself directly -> must be rejected
    with pytest.raises(Exception):
        EscrowService.transition_state(
            db=db_session,
            escrow=escrow,
            target_state=EscrowStatus.RELEASED.value,
            actor=seller,
            event_type="UNAUTHORIZED_RELEASE"
        )
