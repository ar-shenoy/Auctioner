
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.db.session import engine
from sqlalchemy import text

async def run_migration():
    print("Running manual schema migration...")
    async with engine.begin() as conn:
        # Add new columns if they don't exist
        # We wrap in try-except block or check existence to be safe,
        # but pure SQL ADD COLUMN IF NOT EXISTS is cleaner if postgres supports it (Postgres 9.6+ does).
        # We assume Postgres.

        columns = [
            "ADD COLUMN IF NOT EXISTS date_of_birth DATE",
            "ADD COLUMN IF NOT EXISTS nationality VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS city VARCHAR(100)",
            "ADD COLUMN IF NOT EXISTS batting_style VARCHAR(20)",
            "ADD COLUMN IF NOT EXISTS bowling_style VARCHAR(20)",
            "ADD COLUMN IF NOT EXISTS special_skills TEXT",
            "ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS runs_scored INTEGER DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS wickets_taken INTEGER DEFAULT 0",
            "ADD COLUMN IF NOT EXISTS strike_rate FLOAT DEFAULT 0.0",
            "ADD COLUMN IF NOT EXISTS economy_rate FLOAT DEFAULT 0.0",
            "ADD COLUMN IF NOT EXISTS expected_price INTEGER",
            "ADD COLUMN IF NOT EXISTS availability_seasons VARCHAR(500)",
            "ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)",
            "ADD COLUMN IF NOT EXISTS bio TEXT",
            "ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500)",
            "ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE",
        ]

        for col_sql in columns:
            sql = f"ALTER TABLE players {col_sql};"
            print(f"Executing: {sql}")
            try:
                await conn.execute(text(sql))
            except Exception as e:
                print(f"Error executing {sql}: {e}")
                # We continue, maybe it failed because table doesn't exist yet (will be created by init_db)
                pass

        # Add index for is_approved if possible
        try:
             await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_player_approved ON players (is_approved);"))
        except Exception as e:
             print(f"Index creation error: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(run_migration())
