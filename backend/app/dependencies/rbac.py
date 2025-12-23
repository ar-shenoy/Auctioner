"""RBAC dependencies for FastAPI.

This module provides lightweight, async-safe FastAPI dependencies to enforce
role-based access control. Use `get_current_user` from your JWT/auth module
as the primary authentication dependency; the helpers below accept that
`current_user` via `Depends(...)` and enforce permissions.

Rules implemented here:
- Role hierarchy: ADMIN > TEAM_MANAGER > PLAYER
- Admin bypasses all checks
- Team ownership enforced via `Team.manager_id`
- Raises HTTPException with 401 (unauthenticated), 403 (unauthorized), 404 (resource not found)

Do NOT add business logic or DB schema changes in this module.
"""

from typing import Callable, Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_session
from app.models import User, Team

_bearer = HTTPBearer()


def _is_admin(user: User) -> bool:
    return (user.role or "").lower() == "admin"


async def _get_user_by_id(session: AsyncSession, user_id: str) -> Optional[User]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Authenticate request using Bearer token and return `User`.

    Raises HTTP 401 on invalid/expired token or if user is not found/inactive.
    """
    token = credentials.credentials
    try:
        payload = decode_token(token, expected_type="access")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = await _get_user_by_id(session, user_id)
    if not user or not getattr(user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def require_any_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the request is authenticated.

    This expects the caller to inject the real `current_user` dependency (from
    your JWT auth implementation) when used, e.g. `Depends(get_current_user)`.
    If `current_user` is None, a 401 is raised.
    """
    if current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if not getattr(current_user, "is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return current_user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require an admin user. Admin bypasses all checks."""
    user = await require_any_authenticated_user(current_user)
    if _is_admin(user):
        return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")


async def require_team_manager(current_user: User = Depends(get_current_user)) -> User:
    """Require at least a team manager (or admin)."""
    user = await require_any_authenticated_user(current_user)
    if _is_admin(user):
        return user
    if (user.role or "").lower() != "team_manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Team manager privileges required")
    return user


def require_self_or_admin(user_id_param: str) -> Callable[..., Any]:
    """Factory dependency: allow access if `current_user.id == path_param` or admin.

    Usage in a path operation:
        @router.get("/users/{user_id}")
        async def get_user(user_id: str, current_user=Depends(get_current_user),
                           _=Depends(require_self_or_admin("user_id"))):
            ...
    """

    async def _dependency(current_user: User = Depends(get_current_user), **kwargs) -> User:
        user = await require_any_authenticated_user(current_user)
        if _is_admin(user):
            return user
        # Extract the actual path/query parameter value from kwargs
        param_value = kwargs.get(user_id_param)
        if param_value is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if getattr(user, "id", None) != param_value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return user

    return _dependency


def require_team_manager_or_admin(team_id_param: str) -> Callable[..., Any]:
    """Factory dependency: allow access to admins or the manager of the team.

    When used, supply the name of the path/query parameter that holds the
    team id. FastAPI will bind the concrete value at runtime.
    """

    async def _dependency(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session), **kwargs) -> User:
        user = await require_any_authenticated_user(current_user)
        if _is_admin(user):
            return user

        if (user.role or "").lower() != "team_manager":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Team manager or admin required")

        team_id_value = kwargs.get(team_id_param)
        if team_id_value is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        stmt = select(Team).where(Team.id == team_id_value)
        result = await session.execute(stmt)
        team = result.scalars().first()
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        if team.manager_id != getattr(user, "id", None):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not manager of the team")
        return user

    return _dependency
