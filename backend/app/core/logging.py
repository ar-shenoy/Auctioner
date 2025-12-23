"""Request logging middleware with request_id tracking.

Every request is assigned a unique request_id (UUID). Logs include:
- request_id
- method
- path
- status_code
- duration_ms

Request ID is included in response headers for tracing.
"""

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Context variable to store request_id per async context
REQUEST_ID_HEADER = "X-Request-ID"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all HTTP requests and responses with timing and request ID."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request, log timing, and add request_id to response."""
        # Generate or extract request_id
        request_id = request.headers.get(REQUEST_ID_HEADER, str(uuid.uuid4()))

        # Store in request state for access in handlers
        request.state.request_id = request_id

        # Log request start
        logger.info(
            f"{request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query": str(request.url.query) or None,
            },
        )

        # Measure duration
        start_time = time.time()

        try:
            response = await call_next(request)
            duration_ms = int((time.time() - start_time) * 1000)

            # Log response
            logger.info(
                f"{request.method} {request.url.path} {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": duration_ms,
                },
            )

            # Add request_id to response headers
            response.headers[REQUEST_ID_HEADER] = request_id

            return response

        except Exception as exc:
            duration_ms = int((time.time() - start_time) * 1000)

            # Log exception
            logger.error(
                f"Request error: {type(exc).__name__}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "exception_type": type(exc).__name__,
                },
                exc_info=exc,
            )

            raise


def setup_logging() -> None:
    """Configure structured logging for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Optionally suppress noisy loggers
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("alembic").setLevel(logging.WARNING)
