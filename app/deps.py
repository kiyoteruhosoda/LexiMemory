# app/deps.py
from __future__ import annotations
from fastapi import Cookie, HTTPException, status
from typing import Optional
from .sessions import session_store
from .services import find_user_by_id

SESSION_COOKIE_NAME = "vocab_session"

def require_user(session_id: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE_NAME)) -> dict:
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    userId = session_store.get_user_id(session_id)
    if not userId:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    u = find_user_by_id(userId)
    if not u or u.get("disabled"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return u
