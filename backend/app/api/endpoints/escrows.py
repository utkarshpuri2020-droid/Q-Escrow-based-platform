from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.escrow import EscrowTransaction, TransactionEvidence, EscrowStatus
from app.schemas.escrow import (
    EscrowCreateRequest, EscrowResponse, EscrowDetailResponse,
    EscrowTransitionRequest, EvidenceResponse
)
from app.services.escrow_service import EscrowService
from app.services.crypto_service import CryptoService
from app.api.deps import get_current_user
import os

router = APIRouter(prefix="/escrows", tags=["Escrows"])

@router.post("/", response_model=EscrowResponse, status_code=status.HTTP_201_CREATED)
def create_escrow(
    data: EscrowCreateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seller = db.query(User).filter(User.normalized_username == data.seller_username.strip().lower()).first()
    if not seller:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seller username not found")

    deadline = datetime.utcnow() + timedelta(days=data.duration_days)
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    escrow = EscrowService.create_escrow(
        db=db,
        buyer_id=current_user.id,
        seller_id=seller.id,
        title=data.title,
        description=data.description or "",
        terms=data.terms,
        amount=data.amount,
        currency=data.currency,
        deadline=deadline,
        signature=data.signature,
        signing_key_id=data.signing_key_id,
        ip_address=ip,
        user_agent=ua
    )
    return escrow

@router.get("/", response_model=List[EscrowResponse])
def list_my_escrows(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(EscrowTransaction).filter(
        (EscrowTransaction.buyer_id == current_user.id) | (EscrowTransaction.seller_id == current_user.id)
    )
    if status_filter:
        query = query.filter(EscrowTransaction.status == status_filter.upper())

    return query.order_by(EscrowTransaction.created_at.desc()).all()

@router.get("/{escrow_id}", response_model=EscrowDetailResponse)
def get_escrow_details(
    escrow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow transaction not found")

    # Access control: user must be buyer, seller, reviewer, or admin
    if current_user.id not in [escrow.buyer_id, escrow.seller_id] and current_user.role not in ["ADMIN", "REVIEWER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this escrow transaction")

    buyer = db.query(User).filter(User.id == escrow.buyer_id).first()
    seller = db.query(User).filter(User.id == escrow.seller_id).first()

    return {
        **escrow.__dict__,
        "buyer_username": buyer.username if buyer else "Unknown",
        "seller_username": seller.username if seller else "Unknown",
        "history": escrow.history
    }

@router.post("/{escrow_id}/transition", response_model=EscrowResponse)
def transition_escrow(
    escrow_id: str,
    data: EscrowTransitionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow transaction not found")

    action_map = {
        "ACCEPT": (EscrowStatus.AWAITING_FUNDING.value, "SELLER_ACCEPTED_TERMS"),
        "FUND": (EscrowStatus.LOCKED.value, "BUYER_LOCKED_FUNDS"),
        "START": (EscrowStatus.IN_PROGRESS.value, "SELLER_COMMENCED_WORK"),
        "SUBMIT_DELIVERY": (EscrowStatus.DELIVERY_SUBMITTED.value, "SELLER_SUBMITTED_DELIVERY"),
        "CONFIRM_DELIVERY": (EscrowStatus.RELEASE_PENDING.value, "BUYER_CONFIRMED_DELIVERY"),
        "RELEASE": (EscrowStatus.RELEASED.value, "ESCROW_FUNDS_RELEASED"),
        "REFUND": (EscrowStatus.REFUND_PENDING.value, "BUYER_REQUESTED_REFUND"),
        "CANCEL": (EscrowStatus.CANCELLED.value, "ESCROW_CANCELLED")
    }

    action_key = data.action.upper()
    if action_key not in action_map:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported action: {data.action}")

    target_state, event_type = action_map[action_key]
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")

    updated = EscrowService.transition_state(
        db=db,
        escrow=escrow,
        target_state=target_state,
        actor=current_user,
        event_type=event_type,
        signature=data.signature,
        signing_key_id=data.signing_key_id,
        evidence_id=data.evidence_id,
        ip_address=ip,
        user_agent=ua
    )
    return updated

@router.post("/{escrow_id}/evidence", response_model=EvidenceResponse)
async def upload_evidence(
    escrow_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow transaction not found")

    if current_user.id not in [escrow.buyer_id, escrow.seller_id]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only escrow participants can submit evidence")

    content_hash = ""
    file_path = None
    file_name = None
    file_size = 0
    mime_type = "text/plain"

    if file:
        file_name = file.filename
        content = await file.read()
        file_size = len(content)
        content_hash = CryptoService.sha256_hash(content)
        mime_type = file.content_type or "application/octet-stream"

        # Save to uploads dir
        os.makedirs("./uploads", exist_ok=True)
        file_path = f"./uploads/{content_hash[:16]}_{file_name}"
        with open(file_path, "wb") as f:
            f.write(content)
    else:
        # Text-only evidence
        text_content = f"{title}\n{description or ''}"
        content_hash = CryptoService.sha256_str(text_content)

    evidence = TransactionEvidence(
        escrow_id=escrow_id,
        submitted_by=current_user.id,
        title=title,
        description=description,
        file_path=file_path,
        file_name=file_name,
        file_size=file_size,
        mime_type=mime_type,
        content_hash=content_hash,
        status="ACTIVE"
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence

@router.get("/{escrow_id}/evidence", response_model=List[EvidenceResponse])
def get_escrow_evidence(
    escrow_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    escrow = db.query(EscrowTransaction).filter(EscrowTransaction.id == escrow_id).first()
    if not escrow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escrow not found")

    if current_user.id not in [escrow.buyer_id, escrow.seller_id] and current_user.role not in ["ADMIN", "REVIEWER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return db.query(TransactionEvidence).filter(
        TransactionEvidence.escrow_id == escrow_id,
        TransactionEvidence.status == "ACTIVE"
    ).all()
