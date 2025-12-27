"""Authentication endpoints (login, me)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from uuid import uuid4
from app.db.session import get_session
from app.models import User, Team
from app.schemas.auth import LoginRequest, LoginResponse, UserMeResponse, RegisterRequest
from app.core.hash import verify_password, hash_password
from app.core.security import create_access_token
from app.dependencies.rbac import get_current_user
from app.core.audit import log_audit
from app.models.enums import RoleEnum

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_user_team_id(session: AsyncSession, user: User) -> str | None:
    """Fetch team ID for a manager."""
    if (user.role or "").lower() == RoleEnum.TEAM_MANAGER.value:
        result = await session.execute(select(Team).where(Team.manager_id == user.id))
        team = result.scalars().first()
        return team.id if team else None
    return None


@router.post("/register", response_model=UserMeResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Register a new user.
    Open registration for now to support the frontend invite flow.
    """
    # Check if user exists
    result = await session.execute(select(User).where(User.username == payload.username))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create user
    user_id = str(uuid4())
    user = User(
        id=user_id,
        email=f"{payload.username}@example.com",  # Placeholder email as frontend doesn't send it
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
        full_name=payload.username,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    # Audit log
    await log_audit(
        session=session,
        user_id=user.id,
        action="register",
        entity_type="user",
        entity_id=user.id,
        details=f"role={user.role}",
    )

    team_id = await get_user_team_id(session, user)

    return UserMeResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        team_id=team_id,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Login with email and password.
    Returns JWT access_token and user info.
    """
    # Find user by email
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )
    
    # Verify password
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create access token
    access_token = create_access_token(subject=str(user.id))
    
    # Audit log
    await log_audit(
        session=session,
        user_id=user.id,
        action="login",
        entity_type="user",
        entity_id=user.id,
        details=f"email={user.email}",
    )
    
    team_id = await get_user_team_id(session, user)

    return LoginResponse(
        access_token=access_token,
        user={
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "team_id": team_id,
        },
    )


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Get current authenticated user.
    Requires valid Bearer token.
    """
    team_id = await get_user_team_id(session, current_user)

    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        team_id=team_id,
    )
