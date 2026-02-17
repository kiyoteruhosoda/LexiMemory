# app/middleware_bodylog.py
from __future__ import annotations

import os
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.http")


class RequestBodyCaptureMiddleware(BaseHTTPMiddleware):
    """
    request.body() を先読みして request.state.request_body_text に保存する。
    Starlette/FastAPI は body() を内部でキャッシュするため、先読みしても後続の処理が壊れにくい。
    """

    async def dispatch(self, request: Request, call_next: Callable):
        enabled = os.getenv("VOCAB_LOG_REQUEST_BODY", "0") == "1"
        if enabled:
            if request.method in ("POST", "PUT"):
                try:
                    raw = await request.body()
                    # バイナリ等は想定しない（JSON前提）
                    text = raw.decode("utf-8", errors="replace")

                    # サイズ制限（ログ肥大化防止）
                    limit = int(os.getenv("VOCAB_LOG_REQUEST_BODY_MAX", "4096"))
                    if len(text) > limit:
                        text = text[:limit] + "...(truncated)"

                    request.state.request_body_text = text
                except Exception:
                    # bodyログは補助なので失敗しても落とさない
                    request.state.request_body_text = None

        response: Response = await call_next(request)
        return response
