from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:

    @staticmethod
    def hash_password(password: str) -> str:
        trimmed = password[:72]
        return pwd_context.hash(trimmed)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        trimmed = plain_password[:72]
        return pwd_context.verify(trimmed, hashed_password)

    @staticmethod
    def create_access_token(data: dict, expires_minutes: int = 60) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
        to_encode.update({"exp": expire})

        token = jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return token

    @staticmethod
    def decode_token(token: str) -> Optional[dict]:
        try:
            decoded = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return decoded
        except JWTError:
            return None
