# app/routers/logs.py

import logging
from fastapi import APIRouter
from app.models import ClientLogBatch

router = APIRouter(prefix="/logs", tags=["logs"])
logger = logging.getLogger(__name__)

@router.post(
    "/client",
    summary="Receive client-side logs",
    description="Accept and aggregate client-side logs for centralized logging and monitoring. No authentication required.",
    responses={
        200: {
            "description": "Logs received successfully",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "received": 5
                    }
                }
            }
        },
        422: {"description": "Validation error"},
    }
)
async def receive_client_logs(
    batch: ClientLogBatch,
):
    """
    Receive frontend logs and write them to the server-side logger.
    
    This endpoint allows the client-side logger to send buffered logs
    to the backend for centralized logging and monitoring.
    """
    # Batch-level extra fields (shared by all entries)
    batch_extra = batch.extra or {}
    
    for entry in batch.logs:
        level_name = entry.level.upper()
        log_level = getattr(logging, level_name, logging.INFO)
        
        # Build structured log message
        log_msg = f"[CLIENT] {entry.message}"
        extra_fields = {
            "timestamp": entry.timestamp,
            "userId": entry.userId,
        }
        
        # Add batch-level extra fields
        if batch_extra:
            extra_fields.update(batch_extra)
        
        # Log to server logger with appropriate level
        logger.log(log_level, log_msg, extra=extra_fields)
    
    return {"ok": True, "received": len(batch.logs)}
