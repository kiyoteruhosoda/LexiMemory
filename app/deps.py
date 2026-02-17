# app/deps.py
from __future__ import annotations
from fastapi import Cookie, HTTPException, Header, status, Request
from typing import Optional
from .services import find_user_by_id
from .i18n import get_message

# Global auth service instance (will be set by main.py)
_auth_service = None


def set_auth_service(auth_service):
    """Set global auth service instance"""
    global _auth_service
    _auth_service = auth_service


def get_request_lang(request: Request) -> str:
    """
    Get preferred language from request.
    Checks Accept-Language header, defaults to 'ja'.
    """
    accept_lang = request.headers.get("Accept-Language", "ja")
    # Simple parsing: just take first language code
    if accept_lang:
        lang = accept_lang.split(",")[0].split("-")[0].strip().lower()
        if lang in ("ja", "en"):
            return lang
    return "ja"


async def require_auth(
    request: Request,
    authorization: Optional[str] = Header(default=None)
) -> dict:
    """
    Require Bearer token authentication.
    
    Args:
        request: FastAPI request
        authorization: Authorization header
        
    Returns:
        User dict
        
    Raises:
        HTTPException: 401 if not authenticated
    """
    lang = get_request_lang(request)
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "error_code": "AUTH_REQUIRED",
                    "message": get_message("auth.unauthorized", lang),
                    "message_key": "auth.unauthorized"
                }
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Parse Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "error_code": "AUTH_INVALID",
                    "message": get_message("auth.invalid", lang),
                    "message_key": "auth.invalid"
                }
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = parts[1]
    
    # Verify token
    if not _auth_service:
        raise HTTPException(status_code=500, detail="Auth service not initialized")
    
    user_id = await _auth_service.verify_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "error_code": "AUTH_EXPIRED",
                    "message": get_message("auth.expired", lang),
                    "message_key": "auth.expired"
                }
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Load user
    user = find_user_by_id(user_id)
    if not user or user.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": {
                    "error_code": "USER_DISABLED",
                    "message": get_message("user.disabled", lang),
                    "message_key": "user.disabled"
                }
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return user
