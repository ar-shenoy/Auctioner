"""
FastAPI main application entry point.
Initializes the app with core middleware, error handlers, logging, and routes.
"""

import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import RequestLoggingMiddleware, setup_logging
from app.core.errors import register_error_handlers
from app.db.session import init_db, close_db, engine
from app.models import (
    User,
    RegistrationToken,
    Team,
    Player,
    Auction,
    Bid,
    Match,
    MatchEvent,
)
from app.api.v1 import admin as admin_api
from app.api.v1 import auth as auth_api
from app.api.v1 import teams as teams_api
from app.api.v1 import players as players_api
from app.api.v1 import auctions as auctions_api
from app.api.v1 import matches as matches_api
from app.websocket.endpoints import websocket_auction_endpoint, websocket_match_endpoint


logger = logging.getLogger(__name__)
settings = get_settings()


def validate_config() -> None:
    """Validate critical configuration at startup. Fail fast if invalid."""
    errors = []
    
    # Check SECRET_KEY
    if not settings.secret_key:
        errors.append("SECRET_KEY is not configured. Set the SECRET_KEY environment variable.")
    
    # Check DATABASE_URL
    if not settings.database_url:
        errors.append("DATABASE_URL is not configured. Set the DATABASE_URL environment variable.")
    
    if errors:
        for error in errors:
            logger.error(error)
        sys.exit(1)
    
    logger.info("✓ Configuration validation passed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage app lifecycle: startup and shutdown events.
    """
    # Startup
    validate_config()
    await init_db()
    logger.info("✓ Database initialized")
    
    yield
    
    # Shutdown
    await close_db()
    logger.info("✓ Database connections closed")


# Setup logging first
setup_logging()

# Create FastAPI app instance
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS middleware - MUST be added before error handlers to handle preflight
# Origins loaded from CORS_ORIGINS environment variable
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_origins_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info(f"✓ CORS enabled for origins: {settings.cors_origins}")
if settings.cors_origins_regex:
    logger.info(f"✓ CORS regex enabled: {settings.cors_origins_regex}")

# Register centralized error handlers BEFORE adding middleware
register_error_handlers(app)

# Add logging middleware (after error handlers for proper error logging)
app.add_middleware(RequestLoggingMiddleware)


# ==================== Health & Readiness Endpoints ====================

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Liveness probe: Service is running.
    Returns 200 OK if service is up (no heavy checks).
    """
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """
    Readiness probe: Service is ready to serve requests.
    Checks:
    - Database connectivity
    """
    try:
        # Test database connectivity with a simple query
        async with engine.begin() as conn:
            await conn.exec_driver_sql("SELECT 1")
        
        return {
            "status": "ready",
            "service": settings.app_name,
            "version": settings.app_version,
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}", exc_info=e)
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": settings.app_name,
                "version": settings.app_version,
                "reason": "Database connectivity failed",
            },
        )


@app.get("/", tags=["Root"])
async def root():
    """API root endpoint."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "docs_url": "/docs",
        "version": settings.app_version,
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )


# Include admin API routes
app.include_router(auth_api.router, prefix="/api/v1")
app.include_router(admin_api.router, prefix="/api/v1")
app.include_router(teams_api.router, prefix="/api/v1")
app.include_router(players_api.router, prefix="/api/v1")
app.include_router(auctions_api.router, prefix="/api/v1")
app.include_router(matches_api.router, prefix="/api/v1")

# ==================== WebSocket Routes ====================

@app.websocket("/ws/auctions/{auction_id}")
async def ws_auction_endpoint(websocket, auction_id: str):
    """WebSocket endpoint for auction real-time updates. Read-only, JWT-protected.
    
    Client must pass JWT token as query parameter: ?token=<jwt_token>
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
    await websocket_auction_endpoint(websocket, auction_id, token)


@app.websocket("/ws/matches/{match_id}")
async def ws_match_endpoint(websocket, match_id: str):
    """WebSocket endpoint for match real-time updates. Read-only, JWT-protected.
    
    Client must pass JWT token as query parameter: ?token=<jwt_token>
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
    await websocket_match_endpoint(websocket, match_id, token)

