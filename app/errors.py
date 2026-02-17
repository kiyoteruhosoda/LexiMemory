#app/errors.py
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional


@dataclass(frozen=True)
class ApiErrorPayload:
    error_code: str
    message: str
    request_id: Optional[str] = None
    details: Any | None = None  # 基本 None（必要時のみ）


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
