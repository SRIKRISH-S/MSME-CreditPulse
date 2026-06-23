"""Authentication router with DB-backed user register and login functionality."""

import hashlib
import time
import secrets
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.db_models import User
from models.schemas import LoginRequest, LoginResponse, UserRegister, UserOut
from config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    """Hash password using PBKDF2 with SHA256. Returns (password_hash, salt)."""
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt


def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """Verify password matches hash."""
    check_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(check_hash, password_hash)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(request: UserRegister, db: Session = Depends(get_db)):
    """Register a new Relationship Manager account."""
    # Check if username or email already exists
    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another.",
        )

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered.",
        )

    # Hash the password
    pwd_hash, salt = hash_password(request.password)

    new_user = User(
        username=request.username,
        email=request.email,
        password_hash=pwd_hash,
        salt=salt
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate relationship managers against database credentials."""
    # Fallback to demo user if database is empty and credentials match settings
    # This ensures backward compatibility for default admin account
    user = db.query(User).filter(User.username == request.username).first()

    if not user and request.username == settings.DEMO_USER and request.password == settings.DEMO_PASSWORD:
        # Create user automatically in DB to persist
        pwd_hash, salt = hash_password(request.password)
        user = User(
            username=request.username,
            email="admin@creditpulse.idbi.in",
            password_hash=pwd_hash,
            salt=salt
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if user and verify_password(request.password, user.salt, user.password_hash):
        # Generate token
        token_raw = f"{user.username}:{time.time()}:{settings.SECRET_KEY}"
        token = hashlib.sha256(token_raw.encode()).hexdigest()

        return LoginResponse(
            token=token,
            user=user.username,
            message="Login successful. Welcome to CreditPulse.",
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid username or password.",
    )
