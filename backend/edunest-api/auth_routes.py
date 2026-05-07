"""
Authentication API routes for EduNest.
Handles registration, login, logout, password reset, and profile retrieval.
"""
import re
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session
from email_validator import validate_email, EmailNotValidError

from database import get_db
from models import User, PasswordResetToken, RefreshToken, FailedLoginAttempt
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_token, generate_reset_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ── Rate-limit constants ────────────────────────────────────────────────────────
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


# ── Request / Response schemas ─────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    username: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v):
        try:
            info = validate_email(v, check_deliverability=True)
            return info.normalized
        except EmailNotValidError as e:
            raise ValueError(str(e))

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Username must be at least 2 characters")
        if len(v.strip()) > 50:
            raise ValueError("Username must be under 50 characters")
        return v.strip()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', v):
            raise ValueError("Password must contain at least one digit")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', v):
            raise ValueError("Password must contain at least one digit")
        return v


# ── Helper: extract current user from token ─────────────────────────────────────
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or deactivated")
    return user


# ── POST /api/auth/register ─────────────────────────────────────────────────────
@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate email
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens immediately so user is logged in after registration
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str, refresh_exp = create_refresh_token({"sub": str(user.id)})

    # Store refresh token in DB
    db.add(RefreshToken(token=refresh_token_str, user_id=user.id, expires_at=refresh_exp))
    db.commit()

    return {
        "message": "Registration successful",
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }


# ── POST /api/auth/login ────────────────────────────────────────────────────────
@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Check lockout
    attempt = db.query(FailedLoginAttempt).filter(FailedLoginAttempt.email == req.email).first()
    if attempt and attempt.count >= MAX_FAILED_ATTEMPTS:
        lockout_until = attempt.last_attempt + timedelta(minutes=LOCKOUT_MINUTES)
        if datetime.utcnow() < lockout_until:
            mins_left = int((lockout_until - datetime.utcnow()).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Account locked due to too many failed attempts. Try again in {mins_left} minutes."
            )
        else:
            # Reset after lockout period
            db.delete(attempt)
            db.commit()
            attempt = None

    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        # Track failed attempt
        if attempt:
            attempt.count += 1
            attempt.last_attempt = datetime.utcnow()
        else:
            db.add(FailedLoginAttempt(email=req.email, count=1, last_attempt=datetime.utcnow()))
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Clear failed attempts on success
    if attempt:
        db.delete(attempt)
        db.commit()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str, refresh_exp = create_refresh_token({"sub": str(user.id)}, remember_me=req.remember_me)

    # Store refresh token
    db.add(RefreshToken(token=refresh_token_str, user_id=user.id, expires_at=refresh_exp))
    db.commit()

    return {
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }


# ── POST /api/auth/logout ───────────────────────────────────────────────────────
@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        payload = decode_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                # Remove all refresh tokens for this user
                db.query(RefreshToken).filter(RefreshToken.user_id == int(user_id)).delete()
                db.commit()
    return {"message": "Logged out successfully"}


# ── POST /api/auth/forgot-password ──────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Don't reveal whether email exists — always return success
        return {"message": "If the email is registered, a reset link has been sent."}

    # Generate reset token
    token = generate_reset_token()
    expires = datetime.utcnow() + timedelta(hours=1)
    db.add(PasswordResetToken(token=token, user_id=user.id, expires_at=expires))
    db.commit()

    # In production, send an email with this token.
    # For now, log it to console for dev/testing.
    print(f"[PASSWORD RESET] Token for {user.email}: {token}")

    return {"message": "If the email is registered, a reset link has been sent."}


# ── POST /api/auth/reset-password ───────────────────────────────────────────────
@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token == req.token).first()
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()

    # Delete the used token
    db.delete(record)
    db.commit()

    return {"message": "Password has been reset successfully"}


# ── User profile routes ─────────────────────────────────────────────────────────
user_router = APIRouter(prefix="/api/users", tags=["users"])


@user_router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None


@user_router.put("/me")
def update_profile(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.username:
        if len(req.username.strip()) < 2:
            raise HTTPException(status_code=400, detail="Username must be at least 2 characters")
        user.username = req.username.strip()
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return {
        "message": "Profile updated",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        },
    }


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', v):
            raise ValueError("Password must contain at least one digit")
        return v


@user_router.put("/me/password")
def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password changed successfully"}


class DeleteAccountRequest(BaseModel):
    password: str


@user_router.delete("/me")
def delete_account(
    req: DeleteAccountRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password. Account deletion failed.")
    
    # Delete all associated refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id).delete()
    
    # Delete the user
    db.delete(user)
    db.commit()
    return {"message": "Account successfully deleted"}

