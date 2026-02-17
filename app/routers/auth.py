# app/routers/auth.py
"""
Authentication endpoints using JWT access + refresh token rotation.
"""

from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException, Response, status, Depends, Cookie, Request
from ..models import RegisterRequest, LoginRequest, MeResponse
from ..services import register_user, delete_user
from ..deps import require_auth, get_request_lang
from ..i18n import get_message
from ..settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

# Global auth service (set by main.py)
_auth_service = None

def set_auth_service(auth_service):
    """Set auth service for this router"""
    global _auth_service
    _auth_service = auth_service


REFRESH_COOKIE_NAME = "refresh_token"


@router.post("/register")
async def register(req: RegisterRequest, request: Request):
    """Register a new user (no authentication required)"""
    lang = get_request_lang(request)
    
    try:
        u = register_user(req.username, req.password)
        return {"ok": True, "userId": u["userId"], "username": u["username"]}
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "error_code": "USER_EXISTS",
                    "message": get_message("user.already_exists", lang),
                    "message_key": "user.already_exists"
                }
            }
        )


@router.post("/login")
async def login(req: LoginRequest, response: Response, request: Request):
    """
    Login with username and password.
    Returns access token in body, refresh token in HttpOnly cookie.
    """
    lang = get_request_lang(request)
    
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    result = await _auth_service.login(req.username, req.password)
    if not result:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "error_code": "AUTH_INVALID",
                    "message": get_message("auth.invalid", lang),
                    "message_key": "auth.invalid"
                }
            }
        )
    
    access_token, refresh_token, access_expires_at = result
    
    # Set refresh token in HttpOnly cookie
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/api/auth/refresh",  # Only send to refresh endpoint
        max_age=30 * 24 * 60 * 60,  # 30 days
    )
    
    # Return access token in body
    expires_in = int((access_expires_at.timestamp() - 
                      __import__('datetime').datetime.now(__import__('datetime').timezone.utc).timestamp()))
    
    return {
        "ok": True,
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": expires_in
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    request: Request,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
):
    """
    Refresh access token using refresh token.
    Implements token rotation: old refresh token is invalidated, new one is issued.
    """
    lang = get_request_lang(request)
    
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "error_code": "REFRESH_MISSING",
                    "message": get_message("auth.refresh_invalid", lang),
                    "message_key": "auth.refresh_invalid"
                }
            }
        )
    
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    try:
        result = await _auth_service.refresh(refresh_token)
        if not result:
            raise HTTPException(
                status_code=401,
                detail={
                    "error": {
                        "error_code": "REFRESH_INVALID",
                        "message": get_message("auth.refresh_invalid", lang),
                        "message_key": "auth.refresh_invalid"
                    }
                }
            )
        
        access_token, new_refresh_token, access_expires_at = result
        
        # Set new refresh token in cookie (rotation)
        response.set_cookie(
            key=REFRESH_COOKIE_NAME,
            value=new_refresh_token,
            httponly=True,
            secure=settings.cookie_secure,
            samesite=settings.cookie_samesite,
            path="/api/auth/refresh",
            max_age=30 * 24 * 60 * 60,  # 30 days
        )
        
        # Return new access token
        expires_in = int((access_expires_at.timestamp() - 
                          __import__('datetime').datetime.now(__import__('datetime').timezone.utc).timestamp()))
        
        return {
            "ok": True,
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": expires_in
        }
        
    except Exception as e:
        # Handle replay attack
        if str(e) == "REFRESH_REUSED":
            logger.error("Refresh token replay detected")
            # Clear cookie
            response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth/refresh")
            raise HTTPException(
                status_code=401,
                detail={
                    "error": {
                        "error_code": "REFRESH_REUSED",
                        "message": get_message("auth.refresh_reused", lang),
                        "message_key": "auth.refresh_reused"
                    }
                }
            )
        raise


@router.post("/logout")
async def logout(
    response: Response,
    user: dict = Depends(require_auth),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
):
    """
    Logout by revoking refresh token and clearing cookie.
    """
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    # Revoke refresh token
    if refresh_token:
        await _auth_service.logout(refresh_token)
    
    # Clear cookie
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth/refresh")
    
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
async def me(user: dict = Depends(require_auth)):
    """Get current user info (requires access token)"""
    return MeResponse(userId=user["userId"], username=user["username"])


@router.delete("/me")
async def delete_me(
    response: Response,
    request: Request,
    user: dict = Depends(require_auth),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
):
    """
    Delete current user account (requires authentication).
    This will delete all user data including words and memory.
    """
    lang = get_request_lang(request)
    
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    user_id = user["userId"]
    
    # Revoke refresh token
    if refresh_token:
        await _auth_service.logout(refresh_token)
    
    # Clear cookie
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth/refresh")
    
    # Delete user and all associated data
    try:
        delete_user(user_id)
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "error_code": "DELETE_FAILED",
                    "message": get_message("user.delete_failed", lang),
                    "message_key": "user.delete_failed"
                }
            }
        )
    
    return {"ok": True}
