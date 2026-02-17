# app/settings.py
from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

CookieSameSite = Literal["lax", "strict", "none"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="VOCAB_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    data_dir: Path = Field(default=Path(__file__).resolve().parents[1] / "data")

    # Cookie settings for refresh token (HttpOnly cookie)
    cookie_secure: bool = False
    cookie_samesite: CookieSameSite = "lax"  # "lax" | "strict" | "none"

    @field_validator("cookie_samesite", mode="before")
    @classmethod
    def _normalize_cookie_samesite(cls, v):
        # Allow env values like "Lax", "STRICT", etc.
        if v is None:
            return "lax"
        if isinstance(v, str):
            vv = v.strip().lower()
            if vv in ("lax", "strict", "none"):
                return vv
        raise ValueError("VOCAB_COOKIE_SAMESITE must be one of: lax, strict, none")

    session_ttl_seconds: int = 60 * 60 * 24
    password_pepper: str = ""

    # JWT settings
    jwt_secret_key: str = Field(default="development-secret-key-change-in-production")
    jwt_algorithm: str = "HS256"
    access_token_ttl_minutes: int = 15

    # Refresh token settings
    refresh_token_salt: str = Field(default="development-refresh-salt-change-in-production")
    refresh_token_ttl_days: int = 30


settings = Settings()
