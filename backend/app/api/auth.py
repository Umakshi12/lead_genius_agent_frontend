import os
import time
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

router = APIRouter()

# Simple password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In‑memory user store for demo – in production replace with DB
FAKE_USERS_DB = {
    "alice@example.com": {
        "username": "alice@example.com",
        "full_name": "Alice Demo",
        "hashed_password": pwd_context.hash("secret123"),
        "tenant_id": "11111111-1111-1111-1111-111111111111",
        "disabled": False,
    },
    "bob@example.com": {
        "username": "bob@example.com",
        "full_name": "Bob Demo",
        "hashed_password": pwd_context.hash("password456"),
        "tenant_id": "22222222-2222-2222-2222-222222222222",
        "disabled": False,
    },
}

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user(username: str) -> Optional[dict]:
    return FAKE_USERS_DB.get(username)

def authenticate_user(username: str, password: str) -> Optional[dict]:
    user = get_user(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/token", summary="OAuth2 password flow – returns JWT")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Validate username/password and return a JWT containing the tenant_id.
    The token payload looks like:
    {
        "sub": "alice@example.com",
        "tenant_id": "1111...",
        "exp": <timestamp>,
        "iat": <timestamp>
    }
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token({"sub": user["username"], "tenant_id": user["tenant_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Dependency that can be used by other routers to get current user
async def get_current_user(token: str = Depends(OAuth2PasswordRequestForm)):
    # This placeholder is not used directly – other routers will rely on the
    # TenantMiddleware to set request.state.tenant_id. Keeping the function
    # here for future expansion.
    raise NotImplementedError
