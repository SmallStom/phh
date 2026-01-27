from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
from app.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    salt = hashed_password[:32]
    stored_hash = hashed_password[32:]
    computed_hash = hashlib.sha256((plain_password + salt).encode()).hexdigest()
    return computed_hash == stored_hash


def get_password_hash(password: str) -> str:
    import secrets
    salt = secrets.token_hex(16)
    hash_value = hashlib.sha256((password + salt).encode()).hexdigest()
    return salt + hash_value


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
