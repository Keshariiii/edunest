"""
Authentication utilities — JWT token management and password hashing.
"""
import os
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import jwt, JWTError
import bcrypt

# ── Password hashing ───────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    # bcrypt requires bytes
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


# ── JWT tokens ─────────────────────────────────────────────────────────────────
# Secret key — generated once per server start; in production use an env var.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60          # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS = 7             # 1 week
REMEMBER_ME_REFRESH_DAYS = 30             # 30 days if "Remember me" is checked


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, remember_me: bool = False) -> tuple[str, datetime]:
    to_encode = data.copy()
    days = REMEMBER_ME_REFRESH_DAYS if remember_me else REFRESH_TOKEN_EXPIRE_DAYS
    expire = datetime.utcnow() + timedelta(days=days)
    to_encode.update({"exp": expire, "type": "refresh"})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire


def decode_token(token: str) -> Optional[dict]:
    """Decodes a JWT token. Returns the payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def generate_reset_token() -> str:
    """Generate a URL-safe random token for password resets."""
    return secrets.token_urlsafe(32)
