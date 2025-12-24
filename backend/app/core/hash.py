"""Password hashing utilities using bcrypt directly.

This file provides a wrapper around bcrypt for hashing and verifying passwords.
It's used by the authentication layer but contains no API or business logic.
"""

import bcrypt


def hash_password(password: str) -> str:
    """Hash a plaintext password."""
    # Truncate to 72 bytes (bcrypt limit) and hash
    password_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against the stored hash."""
    # Truncate to 72 bytes (bcrypt limit)
    password_bytes = plain_password[:72].encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
