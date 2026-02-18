#app/errors.py
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Optional
from pydantic import BaseModel, Field


@dataclass(frozen=True)
class ApiErrorPayload:
    error_code: str
    message: str
    message_key: Optional[str] = None  # i18n message key
    request_id: Optional[str] = None
    details: Any | None = None  # 基本 None（必要時のみ）


# Pydantic models for OpenAPI documentation
class ErrorDetail(BaseModel):
    """"""
    error_code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    message_key: Optional[str] = Field(None, description="i18n message key for frontend")
    request_id: Optional[str] = Field(None, description="Request correlation ID for tracing")
    details: Optional[dict[str, Any]] = Field(None, description="Additional error details (validation errors, etc.)")


class ErrorResponse(BaseModel):
    """Standard error response format"""
    error: ErrorDetail


class UnauthorizedError(BaseModel):
    """401 Unauthorized response"""
    error: ErrorDetail = Field(..., example={
        "error_code": "UNAUTHORIZED",
        "message": "Unauthorized",
        "request_id": "req-123456",
    })


class BadRequestError(BaseModel):
    """400 Bad Request response"""
    error: ErrorDetail = Field(..., example={
        "error_code": "BAD_REQUEST",
        "message": "Invalid request",
        "details": {"field": "error details"},
        "request_id": "req-123456",
    })


class ValidationError(BaseModel):
    """422 Unprocessable Entity response"""
    error: ErrorDetail = Field(..., example={
        "error_code": "VALIDATION_ERROR",
        "message": "Validation error",
        "request_id": "req-123456",
    })


class NotFoundError(BaseModel):
    """404 Not Found response"""
    error: ErrorDetail = Field(..., example={
        "error_code": "NOT_FOUND",
        "message": "Resource not found",
        "request_id": "req-123456",
    })


class ConflictError(BaseModel):
    """409 Conflict response"""
    error: ErrorDetail = Field(..., example={
        "error_code": "CONFLICT",
        "message": "Resource conflict",
        "request_id": "req-123456",
    })


class InternalServerError(BaseModel):
    """500 Internal Server Error response"""
    error: ErrorDetail = Field(..., example={
        "error_code": "INTERNAL_ERROR",
        "message": "Internal Server Error",
        "request_id": "req-123456",
    })


def http_error_code(status_code: int) -> str:
    # 大枠の分類（必要になれば後で詳細化）
    if status_code == 400:
        return "BAD_REQUEST"
    if status_code == 401:
        return "UNAUTHORIZED"
    if status_code == 403:
        return "FORBIDDEN"
    if status_code == 404:
        return "NOT_FOUND"
    if status_code == 409:
        return "CONFLICT"
    if status_code == 422:
        return "VALIDATION_ERROR"
    if 400 <= status_code < 500:
        return "CLIENT_ERROR"
    return "INTERNAL_ERROR"


# detail をログ/レスポンスに載せても安全か？（最小限のガード）
SAFE_DETAIL_CODES = {
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "VALIDATION_ERROR",
    "CLIENT_ERROR",
}


def is_safe_to_echo_detail(error_code: str) -> bool:
    # 4xx は原則OK（ただし内部情報を含む detail を作らない運用が前提）
    return error_code in SAFE_DETAIL_CODES
