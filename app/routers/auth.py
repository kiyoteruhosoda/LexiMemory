# app/routers/auth.py
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Response, status, Depends
from ..models import RegisterRequest, LoginRequest, MeResponse
from ..services import register_user, authenticate
from ..sessions import session_store
from ..deps import require_user, SESSION_COOKIE_NAME
from ..settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(req: RegisterRequest):
    try:
        u = register_user(req.username, req.password)
        return {"ok": True, "userId": u["userId"], "username": u["username"]}
    except ValueError:
        raise HTTPException(status_code=400, detail="Username already exists")

@router.post("/login")
async def login(req: LoginRequest, res: Response):
    u = authenticate(req.username, req.password)
    if not u:
        # ユーザー存在有無を隠す
        raise HTTPException(status_code=401, detail="Invalid credentials")

    sid = session_store.create(u["userId"])
    res.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=sid,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
        max_age=settings.session_ttl_seconds,
    )
    return {"ok": True}

@router.post("/logout")
async def logout(res: Response, u: dict = Depends(require_user)):
    # cookie消す（sid自体も削除したい場合は Cookie 値が必要）
    res.delete_cookie(SESSION_COOKIE_NAME, path="/")
    return {"ok": True}

@router.get("/me", response_model=MeResponse)
async def me(u: dict = Depends(require_user)):
    return MeResponse(userId=u["userId"], username=u["username"])
