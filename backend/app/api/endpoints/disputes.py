from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.escrow import EscrowTransaction, EscrowStatus
from app.models.dispute import Dispute, DisputeStatus
from app.schemas.dispute import DisputeCreateRequest, DisputeResolveRequest, DisputeResponse
from app.services.escrow_service import EscrowService
from app.services.audit_service import AuditService
from app.api.deps import get_current_user, require_reviewer_or_admin

router = APIRouter(prefix="/disputes", tags=["Disputes"])

@router.post("/", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def open_dispute(
    data: DisputeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == data.escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow transaction not found")

    if current_user.id not in [escrow.buyer_id, escrow.seller_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only escrow participants can open a dispute")

    if escrow.status in [EscrowStatus.RELEASED.value, EscrowStatus.REFUNDED.value, EscrowStatus.CANCELLED.value]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot dispute completed or cancelled escrow")

    dispute = Dispute(
        escrow_id=data.escrow_id,
        opened_by=current_user.id,
        reason=data.reason,
        description=data.description,
        status=DisputeStatus.OPEN.value
    )
    db.add(dispute)

    # Transition escrow to DISPUTED
    EscrowService.transition_state(
        db=db,
        escrow=escrow,
        target_state=EscrowStatus.DISPUTED.value,
        actor=current_user,
        event_type="DISPUTE_OPENED"
    )

    AuditService.log_event(
        db=db,
        action="DISPUTE_OPENED",
        resource_type="DISPUTE",
        resource_id=dispute.id,
        actor_id=current_user.id,
        actor_username=current_user.username,
        details={"escrow_id": escrow.id, "reason": data.reason}
    )

    db.commit()
    db.refresh(dispute)
    return dispute

@router.get("/", response_model=List[DisputeResponse])
def list_disputes(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Dispute)
    if current_user.role not in ["ADMIN", "REVIEWER"]:
        # Only show disputes for user's escrows
        user_escrow_ids = db.query(EscrowTransaction.id).filter(
            (EscrowTransaction.buyer_id == current_user.id) | (EscrowTransaction.seller_id == current_user.id)
        ).subquery()
        query = query.filter(Dispute.escrow_id.in_(user_escrow_ids))

    if status_filter:
        query = query.filter(Dispute.status == status_filter.upper())

    return query.order_by(Dispute.created_at.desc()).all()

@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(
    dispute_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")
    return dispute

@router.post("/{dispute_id}/resolve", response_model=DisputeResponse)
def resolve_dispute(
    dispute_id: str,
    data: DisputeResolveRequest,
    current_user: User = Depends(require_reviewer_or_admin),
    db: Session = Depends(get_db)
):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")

    if dispute.status != DisputeStatus.OPEN.value and dispute.status != DisputeStatus.UNDER_REVIEW.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Dispute is already resolved")

    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == dispute.escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow not found")

    ruling = data.ruling.upper()
    target_state = EscrowStatus.RELEASED.value
    event_type = "DISPUTE_RESOLVED_RELEASE"

    if ruling == "REFUND_BUYER":
        target_state = EscrowStatus.REFUNDED.value
        event_type = "DISPUTE_RESOLVED_REFUND"
        dispute.status = DisputeStatus.RESOLVED_REFUND.value
    elif ruling == "RELEASE_SELLER":
        target_state = EscrowStatus.RELEASED.value
        event_type = "DISPUTE_RESOLVED_RELEASE"
        dispute.status = DisputeStatus.RESOLVED_RELEASE.value
    elif ruling == "SPLIT_FUNDS":
        target_state = EscrowStatus.RELEASED.value
        event_type = "DISPUTE_RESOLVED_SPLIT"
        dispute.status = DisputeStatus.RESOLVED_SPLIT.value
        dispute.buyer_split_amount = data.buyer_split_amount or (escrow.amount // 2)
        dispute.seller_split_amount = data.seller_split_amount or (escrow.amount - dispute.buyer_split_amount)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ruling must be REFUND_BUYER, RELEASE_SELLER, or SPLIT_FUNDS")

    dispute.assigned_reviewer_id = current_user.id
    dispute.ruling = ruling
    dispute.resolution_notes = data.resolution_notes
    dispute.resolved_at = datetime.utcnow()

    # Trigger final state transition on escrow
    EscrowService.transition_state(
        db=db,
        escrow=escrow,
        target_state=target_state,
        actor=current_user,
        event_type=event_type
    )

    AuditService.log_event(
        db=db,
        action="DISPUTE_RESOLVED",
        resource_type="DISPUTE",
        resource_id=dispute.id,
        actor_id=current_user.id,
        actor_username=current_user.username,
        details={"ruling": ruling, "notes": data.resolution_notes}
    )

    db.commit()
    db.refresh(dispute)
    return dispute
