# app/routers/io.py
from __future__ import annotations
from fastapi import APIRouter, Depends, Query, HTTPException
from ..deps import require_auth
from ..models import AppData, AppDataForImport
from .. import storage
from ..services import export_appdata, import_appdata

router = APIRouter(prefix="/io", tags=["io"])

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
async def export_api(u: dict = Depends(require_auth)):
    """Export user's all vocabulary and memory data"""
    async with storage.user_lock(u["userId"]):
        return export_appdata(u["userId"])

@router.post(
    "/import",
    summary="Import vocabulary data",
    description="Import vocabulary data from a exported JSON file or manually-created JSON file. Supports 'merge' (add new items) or 'overwrite' (replace all data) modes. Optional fields like ID and timestamps will be auto-generated if missing.",
    responses={
        200: {"description": "Data imported successfully"},
        400: {"description": "Invalid schema version or data format"},
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    }
)
async def import_api(
    app: AppDataForImport,
    mode: str = Query(
        default="merge",
        pattern="^(overwrite|merge)$",
        description="Import mode: 'merge' adds new items, 'overwrite' replaces all data"
    ),
    u: dict = Depends(require_auth),
):
    """Import vocabulary data (merge or overwrite). Supports both exported data and manually-created files."""
    async with storage.user_lock(u["userId"]):
        if app.schemaVersion != 1:
            raise HTTPException(status_code=400, detail="Unsupported schemaVersion")
        import_appdata(u["userId"], app, mode)
        return {"ok": True}
