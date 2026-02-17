# app/sessions.py
from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets
from typing import Dict, Optional
from .settings import settings

UTC = timezone.utc

@dataclass
class Session:
    userId: str
    expiresAt: datetime

class SessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, Session] = {}

    def create(self, userId: str) -> str:
        sid = secrets.token_urlsafe(32)
        expires = datetime.now(UTC) + timedelta(seconds=settings.session_ttl_seconds)
        self._sessions[sid] = Session(userId=userId, expiresAt=expires)
        return sid

    def get_user_id(self, sid: str) -> Optional[str]:
        s = self._sessions.get(sid)
        if not s:
            return None
        if datetime.now(UTC) >= s.expiresAt:
            self._sessions.pop(sid, None)
            return None
        return s.userId

    def delete(self, sid: str) -> None:
        self._sessions.pop(sid, None)

session_store = SessionStore()
