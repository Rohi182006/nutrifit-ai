from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, revoke_token
)
from app.models.entities import User, ClientProfile, UserRole
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserResponse
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter_by(email=user_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Validate role
    role = user_data.role if user_data.role in [UserRole.CLIENT.value, UserRole.COACH.value, UserRole.ADMIN.value] else UserRole.CLIENT.value

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=role,
        is_active=True
    )
    db.add(user)
    db.flush()

    if role == UserRole.CLIENT.value:
        profile = ClientProfile(user_id=user.id, preferred_language="English")
        db.add(profile)

    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "has_completed_onboarding": False
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(email=login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role})

    has_completed_onboarding = False
    if user.role == UserRole.CLIENT.value:
        has_completed_onboarding = bool(user.client_preferences is not None)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "has_completed_onboarding": has_completed_onboarding
        }
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token_endpoint(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Rotating refresh token exchange (Section 27 & 37)."""
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type for refresh endpoint"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter_by(id=int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Invalidate old refresh token (rotation)
    revoke_token(data.refresh_token)

    # Issue new token pair
    new_access_token = create_access_token({"sub": str(user.id), "role": user.role})
    new_refresh_token = create_refresh_token({"sub": str(user.id), "role": user.role})

    has_completed_onboarding = bool(user.client_preferences is not None) if user.role == UserRole.CLIENT.value else True

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "has_completed_onboarding": has_completed_onboarding
        }
    }

@router.post("/logout")
def logout(data: RefreshTokenRequest):
    """Explicit token revocation upon logout (Section 37)."""
    revoke_token(data.refresh_token)
    return {"message": "Successfully logged out and session invalidated."}

@router.get("/me")
def get_current_user_profile(user: User = Depends(get_current_user)):
    has_completed_onboarding = False
    if user.role == UserRole.CLIENT.value:
        has_completed_onboarding = bool(user.client_preferences is not None)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "has_completed_onboarding": has_completed_onboarding
    }
