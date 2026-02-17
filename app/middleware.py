from __future__ import annotations

import logging
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

http_logger = logging.getLogger("app.http")

# ログに出したくないパス（認証系など）
_NO_BODY_PATH_PREFIXES = ("/auth",)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        # Skip logging for health check endpoint
        if request.url.path == "/healthz":
            return await call_next(request)

        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        response: Response | None = None
        try:
            response = await call_next(request)
            return response
        finally:
            duration_ms = int((time.perf_counter() - start) * 1000)
            status = response.status_code if response is not None else 500

            body_text = None
            # RequestBodyCaptureMiddleware が埋めたものを拾う
            if request.method in ("POST", "PUT", "PATCH"):
                if not request.url.path.startswith(_NO_BODY_PATH_PREFIXES):
                    body_text = getattr(request.state, "request_body_text", None)

            http_logger.info(
                "http_request",
                extra={
                    "event": "http_request",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": status,
                    "duration_ms": duration_ms,
                    "request_body": body_text,  # ← 追加
                },
            )
