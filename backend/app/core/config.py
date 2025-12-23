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
    app_name: str = "Cricket Management Platform"
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
    
    # CORS settings
    cors_origins: list = Field(default=["http://localhost:5173"], alias="CORS_ORIGINS")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
