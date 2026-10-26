import json
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        actor_username: Optional[str] = None,
        outcome: str = "SUCCESS",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Records an append-only audit log entry.
        Never logs passwords, secret keys, or authentication tokens.
        """
        # Scrub sensitive keys if accidentally included
        scrubbed_details = {}
        if details:
            for k, v in details.items():
                if any(s in k.lower() for s in ["password", "secret", "private_key", "token", "backup_code"]):
                    scrubbed_details[k] = "[REDACTED]"
                else:
                    scrubbed_details[k] = v

        entry = AuditLog(
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            actor_id=str(actor_id) if actor_id else None,
            actor_username=actor_username,
            outcome=outcome,
            ip_address=ip_address,
            user_agent=user_agent[:250] if user_agent else None,
            details=json.dumps(scrubbed_details, default=str) if scrubbed_details else None
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
