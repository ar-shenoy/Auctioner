"""
Application configuration management.
Loads settings from environment variables with sensible defaults.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App settings
    app_name: str = "AUCTIONER"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Database settings
    database_url: str = Field(
        default="postgresql+asyncpg://admin:admin@postgres:5432/cricket_db",
        alias="DATABASE_URL"
    )
    
    # Server settings
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    
    # JWT settings (placeholder for PHASE 3)
    secret_key: str = Field(
        default="dev-secret-key-change-in-production",
        alias="SECRET_KEY"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # CORS settings - read from environment, parse comma-separated string
    cors_origins_str: str = Field(
        default="*",
        alias="CORS_ORIGINS"
    )
    
    # CORS Regex - for Vercel preview deployments
    cors_origins_regex: str | None = Field(
        default=None,
        alias="CORS_ORIGINS_REGEX"
    )

    @property
    def cors_origins(self) -> list:
        """Parse CORS_ORIGINS from comma-separated string."""
        if isinstance(self.cors_origins_str, list):
            return self.cors_origins_str

        # Robust parsing: handle JSON-like strings (e.g., '["http://a.com"]') or comma-separated
        cleaned = self.cors_origins_str.strip(" []'\"")
        return [
            origin.strip(" \"'")
            for origin in cleaned.split(',')
            if origin.strip(" \"'")
        ]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
