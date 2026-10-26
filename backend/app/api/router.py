from fastapi import APIRouter
from app.api.endpoints import (
    auth, users, escrows, crypto, disputes,
    blockchain, audit, notifications, offline, admin
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(escrows.router)
api_router.include_router(crypto.router)
api_router.include_router(disputes.router)
api_router.include_router(blockchain.router)
api_router.include_router(audit.router)
api_router.include_router(notifications.router)
api_router.include_router(offline.router)
api_router.include_router(admin.router)
