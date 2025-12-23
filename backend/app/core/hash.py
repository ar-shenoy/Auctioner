"""Password hashing utilities using passlib (bcrypt).

This file provides a small, well-tested wrapper around `passlib` for
hashing and verifying passwords. It's used by the authentication layer
(Phase 3) but contains no API or business logic.
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plaintext password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)
