#!/usr/bin/env python3
"""Create or update an admin user in the database.

Usage (preferred, runs inside the backend container):
  python scripts/create_admin.py --email admin@example.com --password 'StrongPa$$w0rd!'

If run outside the container, ensure PYTHONPATH includes the project `backend` package and env vars match.
"""
import argparse
import asyncio
from uuid import uuid4

from app.core.hash import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User


async def create_admin(email: str, password: str):
    hashed = hash_password(password)
    username = email.split('@')[0]

    async with AsyncSessionLocal() as session:
        # check existing
        existing = await session.execute(
            "SELECT id FROM users WHERE email = :email",
            {"email": email},
        )
        row = existing.first()
        if row:
            user_id = row[0]
            print(f"User with email {email} exists (id={user_id}), updating password and role to admin...")
            await session.execute(
                "UPDATE users SET password_hash = :ph, role = :role, is_active = true WHERE id = :id",
                {"ph": hashed, "role": "admin", "id": user_id},
            )
        else:
            user_id = str(uuid4())
            print(f"Creating new admin user {email} with id {user_id}")
            await session.execute(
                "INSERT INTO users (id, email, username, password_hash, full_name, role, is_active) VALUES (:id, :email, :username, :ph, :full, :role, true)",
                {"id": user_id, "email": email, "username": username, "ph": hashed, "full": "Admin User", "role": "admin"},
            )
        await session.commit()
    print("Done.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True, help="Admin email")
    parser.add_argument("--password", required=True, help="Admin password (strong)")
    args = parser.parse_args()
    asyncio.run(create_admin(args.email, args.password))


if __name__ == "__main__":
    main()
