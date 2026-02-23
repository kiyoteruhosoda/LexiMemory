# app/routers/auth.py
"""
Authentication endpoints using JWT access + refresh token rotation.
"""

from __future__ import annotations
import logging
from typing import cast, Literal
from fastapi import APIRouter, HTTPException, Response, status, Depends, Cookie, Request
from ..models import RegisterRequest, LoginRequest, MeResponse
from ..services import register_user, delete_user
from ..deps import require_auth, get_request_lang
from ..i18n import get_message
from ..settings import settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)
audit_logger = logging.getLogger("app.audit")

# Global auth service (set by main.py)
_auth_service = None

def set_auth_service(auth_service):
    """Set auth service for this router"""
    global _auth_service
    _auth_service = auth_service


REFRESH_COOKIE_NAME = "refresh_token"


@router.post(
    "/register",
    summary="Register a new user",
    description="Create a new user account with username and password. No authentication required.",
    responses={
        200: {
            "description": "User registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "userId": "550e8400-e29b-41d4-a716-446655440000",
                        "username": "john_doe"
                    }
                }
            }
        },
        400: {"description": "User already exists or invalid input"},
    }
)
async def register(req: RegisterRequest, request: Request):
    """Register a new user (no authentication required)"""
    lang = get_request_lang(request)
    request_id = getattr(request.state, "request_id", None)
    
    try:
        u = register_user(req.username, req.password)
        
        # Audit log
        audit_logger.info(
            "User registered",
            extra={
                "event": "user.register",
                "user_id": u["userId"],
                "username": u["username"],
                "request_id": request_id,
                "result": "success"
            }
        )
        
        return {"ok": True, "userId": u["userId"], "username": u["username"]}
    except ValueError:
        # Audit log for failure
        audit_logger.warning(
            "User registration failed",
            extra={
                "event": "user.register",
                "username": req.username,
                "request_id": request_id,
                "result": "failure",
                "error_code": "USER_EXISTS"
            }
        )
        
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


@router.post(
    "/login",
    summary="Login user",
    description="Authenticate with username and password. Returns JWT access token in body and refresh token in HttpOnly cookie.",
    responses={
        200: {
            "description": "Login successful",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "Bearer",
                        "expires_in": 3600
                    }
                }
            }
        },
        401: {"description": "Invalid credentials"},
    }
)
async def login(req: LoginRequest, response: Response, request: Request):
    """
    Login with username and password.
    Returns access token in body, refresh token in HttpOnly cookie.
    """
    lang = get_request_lang(request)
    request_id = getattr(request.state, "request_id", None)
    
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    result = await _auth_service.login(req.username, req.password)
    if not result:
        # Audit log for failure
        audit_logger.warning(
            "User login failed",
            extra={
                "event": "user.login",
                "username": req.username,
                "request_id": request_id,
                "result": "failure",
                "error_code": "AUTH_INVALID"
            }
        )
        
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
    
    # Get user info for audit log
    from ..services import find_user_by_username
    user = find_user_by_username(req.username)
    
    if user:
        # Audit log for success
        audit_logger.info(
            "User logged in",
            extra={
                "event": "user.login",
                "user_id": user["userId"],
                "username": req.username,
                "request_id": request_id,
                "result": "success"
            }
        )
    
    # Set refresh token in HttpOnly cookie with security settings:
    # - HttpOnly: JavaScript cannot access (XSS protection)
    # - Secure: HTTPS only (enable in production via VOCAB_COOKIE_SECURE=true)
    # - SameSite=Lax: CSRF protection (cookie not sent on cross-site requests)
    # - Path=/api/auth/refresh: Cookie only sent to refresh endpoint
    # - max_age=30 days: Browser keeps login state for 30 days
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=cast(Literal["lax", "strict", "none"], settings.cookie_samesite),
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


@router.post(
    "/refresh",
    summary="Refresh access token",
    description="Use refresh token (from HttpOnly cookie) to obtain a new access token. Implements token rotation.",
    responses={
        200: {
            "description": "Token refreshed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "token_type": "Bearer",
                        "expires_in": 3600
                    }
                }
            }
        },
        401: {"description": "Refresh token missing or invalid"},
    }
)
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
            samesite=cast(Literal["lax", "strict", "none"], settings.cookie_samesite),
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


@router.post(
    "/logout",
    summary="Logout user",
    description="Revoke refresh token and clear authentication cookies.",
    responses={
        200: {"description": "Logout successful"},
        401: {"description": "Unauthorized"},
    }
)
async def logout(
    response: Response,
    request: Request,
    user: dict = Depends(require_auth),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)
):
    """
    Logout by revoking refresh token and clearing cookie.
    """
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    request_id = getattr(request.state, "request_id", None)
    
    # Revoke refresh token
    if refresh_token:
        await _auth_service.logout(refresh_token)
    
    # Clear cookie
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth/refresh")
    
    # Audit log
    audit_logger.info(
        "User logged out",
        extra={
            "event": "user.logout",
            "user_id": user["userId"],
            "username": user["username"],
            "request_id": request_id,
            "result": "success"
        }
    )
    
    return {"ok": True}


@router.get(
    "/me",
    response_model=MeResponse,
    summary="Get current user",
    description="Retrieve information about the authenticated user.",
    responses={
        200: {
            "description": "Current user info",
            "content": {
                "application/json": {
                    "example": {
                        "userId": "550e8400-e29b-41d4-a716-446655440000",
                        "username": "john_doe"
                    }
                }
            }
        },
        401: {"description": "Unauthorized"},
    }
)
async def me(user: dict = Depends(require_auth)):
    """Get current user info (requires access token)"""
    return MeResponse(userId=user["userId"], username=user["username"])


@router.get(
    "/status",
    summary="Check authentication status",
    description="Check if the current request has a valid access token and/or refresh token. Always returns 200, never 401.",
    responses={
        200: {
            "description": "Authentication status",
            "content": {
                "application/json": {
                    "examples": {
                        "authenticated": {
                            "summary": "User is authenticated",
                            "value": {"ok": True, "authenticated": True, "canRefresh": True, "userId": "123", "username": "john"}
                        },
                        "can_refresh": {
                            "summary": "Can restore session via refresh token",
                            "value": {"ok": True, "authenticated": False, "canRefresh": True}
                        },
                        "guest": {
                            "summary": "Guest user - no tokens",
                            "value": {"ok": True, "authenticated": False, "canRefresh": False}
                        }
                    }
                }
            }
        },
    }
)
async def auth_status(request: Request, refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE_NAME)):
    """
    Check authentication status without requiring auth.
    Returns:
    - authenticated=true with user info if valid access token exists
    - canRefresh=true if refresh token exists (even if access token is invalid/missing)
    - authenticated=false, canRefresh=false if no tokens exist
    Never returns 401.
    """
    has_refresh_token = False
    
    # Check if refresh token exists
    if refresh_token and _auth_service:
        try:
            # Verify refresh token is valid
            payload = _auth_service.jwt_provider.verify_refresh_token(refresh_token)
            if payload:
                has_refresh_token = True
        except Exception:
            pass
    
    try:
        # Try to get Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return {"ok": True, "authenticated": False, "canRefresh": has_refresh_token}
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        # Use the global auth service to verify the token
        if not _auth_service:
            return {"ok": True, "authenticated": False, "canRefresh": has_refresh_token}
        
        payload = _auth_service.jwt_provider.verify_access_token(token)
        if not payload:
            return {"ok": True, "authenticated": False, "canRefresh": has_refresh_token}
        
        return {
            "ok": True,
            "authenticated": True,
            "canRefresh": has_refresh_token,
            "userId": payload.get("userId"),
            "username": payload.get("username")
        }
    except Exception:
        # Any error means not authenticated
        return {"ok": True, "authenticated": False, "canRefresh": has_refresh_token}


@router.delete(
    "/me",
    summary="Delete user account",
    description="Permanently delete the current user account and all associated data (words, memory states). This action cannot be undone.",
    responses={
        200: {"description": "Account deleted successfully"},
        401: {"description": "Unauthorized"},
        500: {"description": "Failed to delete account"},
    }
)
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
    request_id = getattr(request.state, "request_id", None)
    
    # Revoke refresh token
    if refresh_token:
        await _auth_service.logout(refresh_token)
    
    # Clear cookie
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth/refresh")
    
    # Delete user and all associated data
    try:
        delete_user(user_id)
        
        # Audit log for success
        audit_logger.info(
            "User account deleted",
            extra={
                "event": "user.delete",
                "user_id": user_id,
                "username": user["username"],
                "request_id": request_id,
                "result": "success"
            }
        )
    except Exception as e:
        logger.error(f"Failed to delete user {user_id}: {e}", exc_info=True)
        
        # Audit log for failure
        audit_logger.error(
            "User account deletion failed",
            extra={
                "event": "user.delete",
                "user_id": user_id,
                "username": user["username"],
                "request_id": request_id,
                "result": "failure",
                "error_code": "DELETE_FAILED"
            }
        )
        
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
