"""Centralized error handling for consistent JSON error responses.

All exceptions are caught and returned as structured JSON with:
- error.code: machine-readable error type
- error.message: human-readable message
- error.details: optional additional context

Stack traces never leak to clients; logged server-side only.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception for API errors."""

    def __init__(self, code: str, message: str, status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class ValidationAPIError(APIError):
    """Validation error."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class AuthenticationError(APIError):
    """Authentication failed."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            code="AUTHENTICATION_ERROR",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationError(APIError):
    """User not authorized to perform action."""

    def __init__(self, message: str = "Not authorized"):
        super().__init__(
            code="AUTHORIZATION_ERROR",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
        )


class NotFoundError(APIError):
    """Resource not found."""

    def __init__(self, resource: str):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictError(APIError):
    """Resource conflict."""

    def __init__(self, message: str):
        super().__init__(
            code="CONFLICT",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
        )


class BusinessLogicError(APIError):
    """Business rule violation."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            code="BUSINESS_LOGIC_ERROR",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


def _error_response(code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Build consistent error response JSON."""
    response = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    if details:
        response["error"]["details"] = details
    return response


async def handle_api_error(request: Request, exc: APIError) -> JSONResponse:
    """Handle APIError exceptions."""
    logger.warning(
        f"API Error: {exc.code} - {exc.message}",
        extra={
            "code": exc.code,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
        },
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_response(exc.code, exc.message, exc.details),
    )


async def handle_validation_error(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    # Extract field errors
    errors = {}
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])
        if field:
            errors[field] = error["msg"]

    logger.warning(
        "Validation error",
        extra={
            "errors": errors,
            "path": request.url.path,
            "method": request.method,
        },
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_response(
            "VALIDATION_ERROR",
            "Request validation failed",
            {"fields": errors},
        ),
    )


async def handle_generic_exception(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions (never exposed to client)."""
    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "exception_type": type(exc).__name__,
        },
        exc_info=exc,
    )

    # Never expose internal error details to client
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_error_response(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred. Please try again later.",
        ),
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all error handlers with the FastAPI app."""
    app.add_exception_handler(APIError, handle_api_error)
    app.add_exception_handler(ValidationError, handle_validation_error)
    app.add_exception_handler(Exception, handle_generic_exception)
