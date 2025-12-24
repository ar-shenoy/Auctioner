import asyncio
import sys
sys.path.insert(0, '/app')

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.hash import hash_password
from app.models import User
from app.db.session import engine

async def create_admin():
    async with AsyncSession(engine) as session:
        # Check if admin exists
        result = await session.execute(select(User).where(User.email == "admin@auctioner.com"))
        if result.scalars().first():
            print("Admin already exists")
            return
        
        # Create admin with properly hashed password
        admin = User(
            id="00000000-0000-0000-0000-000000000001",
            email="admin@auctioner.com",
            username="admin",
            password_hash=hash_password("Admin123!"),
            full_name="Initial Admin",
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("Admin user created")

asyncio.run(create_admin())
