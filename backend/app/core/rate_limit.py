"""Simple in-memory rate limiter for protecting endpoints.

Tracks requests per (client_ip, endpoint) tuple.
Returns HTTP 429 when limit exceeded within the window.
"""

import time
from collections import defaultdict
from typing import Dict, Tuple

from fastapi import Request, status
from fastapi.responses import JSONResponse


class RateLimiter:
    """In-memory rate limiter using sliding window per IP and endpoint."""

    def __init__(self, requests_per_minute: int = 60):
        """Initialize limiter.
        
        Args:
            requests_per_minute: Max requests per minute per IP per endpoint.
        """
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        # Track: {(ip, endpoint): [(timestamp, timestamp, ...)]
        self.requests: Dict[Tuple[str, str], list] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, respecting X-Forwarded-For."""
        if forwarded := request.headers.get("X-Forwarded-For"):
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def is_allowed(self, request: Request, endpoint: str) -> bool:
        """Check if request is allowed under rate limit.
        
        Args:
            request: FastAPI Request object.
            endpoint: Endpoint identifier (e.g., "auth:login", "auction:bid").
        
        Returns:
            True if allowed, False if rate limit exceeded.
        """
        client_ip = self._get_client_ip(request)
        key = (client_ip, endpoint)
        now = time.time()

        # Remove old requests outside the window
        self.requests[key] = [req_time for req_time in self.requests[key] if now - req_time < self.window_seconds]

        # Check if under limit
        if len(self.requests[key]) < self.requests_per_minute:
            self.requests[key].append(now)
            return True

        return False

    async def enforce(self, request: Request, endpoint: str) -> bool:
        """Enforce rate limit, return True if allowed.
        
        Args:
            request: FastAPI Request object.
            endpoint: Endpoint identifier.
        
        Returns:
            True if within limit, False if exceeded.
        """
        return self.is_allowed(request, endpoint)


def rate_limit_response() -> JSONResponse:
    """Return standard 429 rate limit response."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please try again later.",
            }
        },
    )


# Global instances for different limits
auth_limiter = RateLimiter(requests_per_minute=10)  # 10 login attempts per minute
bid_limiter = RateLimiter(requests_per_minute=30)   # 30 bids per minute
