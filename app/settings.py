# app/settings.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="VOCAB_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # Ignore extra fields in .env (e.g., frontend config)
    )

    data_dir: Path = Field(default=Path(__file__).resolve().parents[1] / "data")
    cookie_secure: bool = False
    cookie_samesite: str = "lax"
    session_ttl_seconds: int = 60 * 60 * 24
    password_pepper: str = ""

settings = Settings()
