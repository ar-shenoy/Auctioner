"""JWT helper utilities.

- `create_access_token` and `create_refresh_token` produce signed JWTs.
- `decode_token` verifies and returns claims, raising `JWTError` on failure.

This module is intentionally framework-agnostic (no FastAPI deps).
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import jwt, JWTError

from app.core.config import get_settings

settings = get_settings()


def _now() -> datetime:
    return datetime.utcnow()


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    now = _now()
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None, jti: Optional[str] = None) -> str:
    now = _now()
    expire = now + (expires_delta or timedelta(days=settings.refresh_token_expire_days))
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
    }
    if jti:
        payload["jti"] = jti
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str, expected_type: Optional[str] = None) -> Dict[str, Any]:
    """Decode and validate a JWT, optionally asserting `type` claim.

    Raises `JWTError` (from `python-jose`) on invalid/expired tokens.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as exc:
        raise

    if expected_type is not None and payload.get("type") != expected_type:
        raise JWTError("Invalid token type")

    return payload
