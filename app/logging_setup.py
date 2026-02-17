# app/logging_setup.py
from __future__ import annotations

import json
import logging
import os
import sys
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        base: Dict[str, Any] = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S%z", time.localtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }

        for k in (
            "event",
            "request_id",
            "method",
            "path",
            "status",
            "duration_ms",
            "user_id",
            "username",
            "word_id",
            "rating",
            "err_type",
            "error_code",
            "detail",
            "request_body",
        ):
            if hasattr(record, k):
                v = getattr(record, k)

                # detail が大きくなるのを防ぐ（運用で十分なサイズに）
                if k in ("detail", "request_body"):
                    s = None
                    try:
                        s = json.dumps(v, ensure_ascii=False)
                    except Exception:
                        s = str(v)
                    # 4KB に丸める（必要なら調整）
                    if len(s) > 4096:
                        s = s[:4096] + "...(truncated)"
                    base[k] = s
                else:
                    base[k] = v

        if record.exc_info:
            base["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(base, ensure_ascii=False)


def _make_rotating_file_handler(path: Path, level: int) -> RotatingFileHandler:
    max_bytes = int(os.getenv("VOCAB_LOG_MAX_BYTES", str(10 * 1024 * 1024)))  # 10MB
    backup_count = int(os.getenv("VOCAB_LOG_BACKUP_COUNT", "10"))
    h = RotatingFileHandler(path, maxBytes=max_bytes, backupCount=backup_count, encoding="utf-8")
    h.setLevel(level)
    h.setFormatter(JsonFormatter())
    return h


def _make_stdout_handler(level: int) -> logging.Handler:
    h = logging.StreamHandler(sys.stdout)
    h.setLevel(level)
    h.setFormatter(JsonFormatter())
    return h


def setup_logging(*, data_dir: Path) -> None:
    """
    - root logger: app.log + stdout
    - app.audit logger: audit.log + stdout（必要なら stdout は外せる）
    - uvicorn loggers: root に流す（app.log に入る）
    """
    level_name = os.getenv("VOCAB_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    log_dir = data_dir / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    app_log_path = log_dir / "app.log"
    audit_log_path = log_dir / "audit.log"

    # root: アプリ全般
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(_make_stdout_handler(level))
    root.addHandler(_make_rotating_file_handler(app_log_path, level))

    # audit: 監査専用（root に二重で流さないため propagate=False）
    audit = logging.getLogger("app.audit")
    audit.setLevel(level)
    audit.handlers.clear()
    audit.propagate = False
    audit.addHandler(_make_stdout_handler(level))
    audit.addHandler(_make_rotating_file_handler(audit_log_path, level))

    # uvicorn.error は root に流す（app.logへ）
    for name in ("uvicorn", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.handlers.clear()
        lg.propagate = True

    # uvicorn.access は "消す"（app.http のみ残す）
    access = logging.getLogger("uvicorn.access")
    access.handlers.clear()
    access.propagate = False
    access.disabled = True 