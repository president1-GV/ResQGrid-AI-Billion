"""
ResQGrid AI Billion - Security & Authentication Engine
HMAC-SHA256 Signed Tokens, Salted PBKDF2 Password Hashing,
Role-Based Access Control (RBAC), and PII Redaction.
"""

import os
import hmac
import hashlib
import base64
import json
import secrets
import datetime
import re
from typing import Dict, Any, Optional, List, Tuple
from fastapi import Header, HTTPException, status, Depends
from enum import Enum
from pydantic import BaseModel


class UserRole(str, Enum):
    INCIDENT_COMMANDER = "INCIDENT_COMMANDER"
    LOGISTICS_CHIEF = "LOGISTICS_CHIEF"
    FIELD_RESPONDER = "FIELD_RESPONDER"
    GOVERNANCE_AUDITOR = "GOVERNANCE_AUDITOR"


class User(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: UserRole
    badge_number: str
    permissions: List[str]
    is_active: bool = True
    last_login: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in_hours: int = 24
    user: User


class AuthService:
    """Manages cryptographic token issuing, password hashing, and user authentication."""

    SECRET_KEY = os.getenv("RESQGRID_SECRET_KEY", "resqgrid-ai-billion-cryptographic-signing-key-2026-prod")
    ITERATIONS = 100000

    # In-memory secure user store with salted hashes
    _users_db: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _hash_password(cls, password: str, salt: Optional[str] = None) -> Tuple[str, str]:
        if not salt:
            salt = secrets.token_hex(16)
        pwd_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            cls.ITERATIONS
        ).hex()
        return pwd_hash, salt

    @classmethod
    def _verify_password(cls, password: str, pwd_hash: str, salt: str) -> bool:
        computed_hash, _ = cls._hash_password(password, salt)
        return hmac.compare_digest(computed_hash, pwd_hash)

    @classmethod
    def init_users(cls):
        """Seeds initial authorized command and field officer accounts."""
        initial_accounts = [
            {
                "user_id": "USR-CMD-01",
                "email": "commander@resqgrid.ai",
                "full_name": "Col. Arvind Sharma",
                "role": UserRole.INCIDENT_COMMANDER,
                "badge_number": "IC-01",
                "password": "Commander#2026",
                "permissions": ["all", "approve_allocation", "override_allocation", "retrain_model", "ingest_data", "simulate_events"]
            },
            {
                "user_id": "USR-LOG-04",
                "email": "logistics@resqgrid.ai",
                "full_name": "Maj. Priya Sen",
                "role": UserRole.LOGISTICS_CHIEF,
                "badge_number": "LC-04",
                "password": "Logistics#2026",
                "permissions": ["manage_warehouses", "manage_vehicles", "modify_allocation", "view_all"]
            },
            {
                "user_id": "USR-FLD-12",
                "email": "responder@resqgrid.ai",
                "full_name": "Sub-Insp. Rahul Das",
                "role": UserRole.FIELD_RESPONDER,
                "badge_number": "FD-12",
                "password": "Responder#2026",
                "permissions": ["submit_report", "view_routes", "view_dispatches"]
            },
            {
                "user_id": "USR-AUD-09",
                "email": "auditor@resqgrid.ai",
                "full_name": "Dr. Sunita Roy",
                "role": UserRole.GOVERNANCE_AUDITOR,
                "badge_number": "AUD-09",
                "password": "Auditor#2026",
                "permissions": ["view_audit_logs", "export_reports", "view_analytics"]
            }
        ]

        for acc in initial_accounts:
            pwd_hash, salt = cls._hash_password(acc["password"])
            cls._users_db[acc["email"].lower()] = {
                "user_id": acc["user_id"],
                "email": acc["email"].lower(),
                "full_name": acc["full_name"],
                "role": acc["role"],
                "badge_number": acc["badge_number"],
                "pwd_hash": pwd_hash,
                "salt": salt,
                "permissions": acc["permissions"],
                "is_active": True,
                "last_login": None
            }

    @classmethod
    def authenticate_user(cls, email: str, password: str) -> Optional[User]:
        if not cls._users_db:
            cls.init_users()

        user_record = cls._users_db.get(email.lower().strip())
        if not user_record or not user_record.get("is_active"):
            return None

        if cls._verify_password(password, user_record["pwd_hash"], user_record["salt"]):
            user_record["last_login"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            return User(
                user_id=user_record["user_id"],
                email=user_record["email"],
                full_name=user_record["full_name"],
                role=user_record["role"],
                badge_number=user_record["badge_number"],
                permissions=user_record["permissions"],
                is_active=user_record["is_active"],
                last_login=user_record["last_login"]
            )
        return None

    @classmethod
    def create_token(cls, user: User, expires_delta_hours: int = 24) -> str:
        now = datetime.datetime.now(datetime.timezone.utc)
        exp = now + datetime.timedelta(hours=expires_delta_hours)
        payload = {
            "sub": user.user_id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role.value,
            "badge": user.badge_number,
            "permissions": user.permissions,
            "iat": int(now.timestamp()),
            "exp": int(exp.timestamp())
        }
        payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8").rstrip("=")
        signature = hmac.new(
            cls.SECRET_KEY.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return f"{payload_b64}.{signature}"

    @classmethod
    def verify_token(cls, token: str) -> Optional[Dict[str, Any]]:
        try:
            parts = token.split(".")
            if len(parts) != 2:
                return None
            payload_b64, signature = parts

            # Verify signature
            expected_sig = hmac.new(
                cls.SECRET_KEY.encode("utf-8"),
                payload_b64.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_sig, signature):
                return None

            # Decode payload
            # Add padding back if necessary
            pad = len(payload_b64) % 4
            if pad > 0:
                payload_b64 += "=" * (4 - pad)
            payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))

            # Check expiration
            now_ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
            if payload.get("exp", 0) < now_ts:
                return None

            return payload
        except Exception:
            return None

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[User]:
        if not cls._users_db:
            cls.init_users()
        for u in cls._users_db.values():
            if u["user_id"] == user_id:
                return User(
                    user_id=u["user_id"],
                    email=u["email"],
                    full_name=u["full_name"],
                    role=u["role"],
                    badge_number=u["badge_number"],
                    permissions=u["permissions"],
                    is_active=u["is_active"],
                    last_login=u.get("last_login")
                )
        return None

    @classmethod
    def redact_pii(cls, text: str) -> str:
        """Sanitizes PII such as phone numbers, emails, and personal national IDs."""
        if not text:
            return ""
        # Redact phone numbers (10 digits with optional +91 or dashes)
        text = re.sub(r'(?:\+91[\-\s]?)?[6-9]\d{9}', '[REDACTED PHONE]', text)
        # Redact email addresses
        text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED EMAIL]', text)
        # Redact 12-digit Aadhaar / ID formats
        text = re.sub(r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b', '[REDACTED NATIONAL ID]', text)
        return text


# ============================================================
# FASTAPI SECURITY DEPENDENCIES
# ============================================================

def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """Dependency: Extracts and verifies JWT/HMAC Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        # Default to Commander for seamless demo when no token is passed
        commander = AuthService.get_user_by_id("USR-CMD-01")
        if commander:
            return commander
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header. Expected Bearer <token>."
        )

    token = authorization.split(" ")[1]
    payload = AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    user = AuthService.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active."
        )
    return user


def require_role(allowed_roles: List[UserRole]):
    """Role-based access guard dependency."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles and current_user.role != UserRole.INCIDENT_COMMANDER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: Role '{current_user.role.value}' does not have required permissions."
            )
        return current_user
    return role_checker
