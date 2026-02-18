# app/routers/io.py
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from ..deps import require_auth
from ..models import AppData, AppDataForImport
from .. import storage
from ..services import export_appdata, import_appdata

router = APIRouter(prefix="/io", tags=["io"])
logger = logging.getLogger("app.routers.io")
audit_logger = logging.getLogger("app.audit")

@router.get(
    "/export",
    response_model=AppData,
    summary="Export all vocabulary data",
    description="Export all words and memory states in JSON format for backup or migration.",
    responses={
        200: {
            "description": "Data exported successfully",
        },
        401: {"description": "Unauthorized"},
    }
)
async def export_api(request: Request, u: dict = Depends(require_auth)):
    """Export user's all vocabulary and memory data"""
    request_id = getattr(request.state, "request_id", None)
    
    async with storage.user_lock(u["userId"]):
        result = export_appdata(u["userId"])
        
        # Audit log
        audit_logger.info(
            "Data exported",
            extra={
                "event": "data.export",
                "user_id": u["userId"],
                "username": u["username"],
                "request_id": request_id,
                "word_count": len(result.words),
                "result": "success"
            }
        )
        
        return result

@router.post(
    "/import",
    summary="Import vocabulary data",
    description="Import vocabulary data from a exported JSON file or manually-created JSON file. Supports 'merge' (add new items) or 'overwrite' (replace all data) modes. Optional fields like ID and timestamps will be auto-generated if missing.",
    responses={
        200: {"description": "Data imported successfully"},
        400: {"description": "Invalid data format or validation error"},
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    }
)
async def import_api(
    app: AppDataForImport,
    request: Request,
    mode: str = Query(
        default="merge",
        pattern="^(overwrite|merge)$",
        description="Import mode: 'merge' adds new items, 'overwrite' replaces all data"
    ),
    u: dict = Depends(require_auth),
):
    """Import vocabulary data (merge or overwrite). Supports both exported data and manually-created files."""
    from ..services import validate_import_data
    request_id = getattr(request.state, "request_id", None)
    
    logger.debug(f"import_api: mode={mode}, app={app}, userId={u['userId']}")
    
    # Validate import data
    validation_result = validate_import_data(app)
    
    if not validation_result["valid"]:
        logger.warning(
            f"Import validation failed for userId={u['userId']}: "
            f"{len(validation_result['errors'])} errors"
        )
        
        # Audit log for validation failure
        audit_logger.warning(
            "Data import validation failed",
            extra={
                "event": f"data.import.{mode}",
                "user_id": u["userId"],
                "username": u["username"],
                "request_id": request_id,
                "error_count": len(validation_result["errors"]),
                "result": "validation_failure"
            }
        )
        
        # Format error message
        error_messages = validation_result["errors"][:5]  # First 5 errors
        if len(validation_result["errors"]) > 5:
            error_messages.append(f"... and {len(validation_result['errors']) - 5} more errors")
        
        error_details = {
            "error_code": "IMPORT_VALIDATION_ERROR",
            "message": "インポートファイルに問題があります",
            "message_key": "import.validation_error",
            "details": {
                "errors": error_messages,
                "error_count": len(validation_result["errors"]),
                "summary": validation_result["details"]
            }
        }
        
        raise HTTPException(
            status_code=400,
            detail=str(error_details)
        )
    
    # Log warnings
    if validation_result["warnings"]:
        logger.info(
            f"Import warnings for userId={u['userId']}: "
            f"{', '.join(validation_result['warnings'][:3])}"
        )
    
    async with storage.user_lock(u["userId"]):
        if app.schemaVersion != 1:
            logger.error(f"Invalid schemaVersion: {app.schemaVersion}")
            raise HTTPException(status_code=400, detail="Unsupported schemaVersion")
        logger.debug(f"Calling import_appdata with {len(app.words)} words")
        import_appdata(u["userId"], app, mode)
        logger.info(f"Import completed successfully for userId={u['userId']}")
        
        # Audit log for success
        audit_logger.info(
            f"Data imported in {mode} mode",
            extra={
                "event": f"data.import.{mode}",
                "user_id": u["userId"],
                "username": u["username"],
                "request_id": request_id,
                "word_count": len(app.words),
                "mode": mode,
                "result": "success"
            }
        )
        
        return {"ok": True}
