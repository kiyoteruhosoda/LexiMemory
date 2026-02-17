# app/routers/logs.py

import logging
from fastapi import APIRouter, Request
from app.models import ClientLogBatch

router = APIRouter(prefix="/logs", tags=["logs"])
logger = logging.getLogger(__name__)

@router.post("/client")
async def receive_client_logs(
    batch: ClientLogBatch,
    request: Request,
):
    """
    Receive frontend logs and write them to the server-side logger.
    
    This endpoint allows the client-side logger to send buffered logs
    to the backend for centralized logging and monitoring.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    for entry in batch.logs:
        level_name = entry.level.upper()
        log_level = getattr(logging, level_name, logging.INFO)
        
        # Build structured log message
        log_msg = f"[CLIENT] {entry.message}"
        extra_fields = {
            "request_id": request_id,
            "timestamp": entry.timestamp,
            "userId": entry.userId,
        }
        
        if entry.extra:
            extra_fields.update(entry.extra)
        
        # Log to server logger with appropriate level
        logger.log(log_level, log_msg, extra=extra_fields)
    
    return {"ok": True, "received": len(batch.logs)}
