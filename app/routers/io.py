# app/routers/io.py
from __future__ import annotations
from fastapi import APIRouter, Depends, Query, HTTPException
from ..deps import require_auth
from ..models import AppData
from .. import storage
from ..services import export_appdata, import_appdata

router = APIRouter(prefix="/io", tags=["io"])

@router.get("/export", response_model=AppData)
async def export_api(u: dict = Depends(require_auth)):
    async with storage.user_lock(u["userId"]):
        return export_appdata(u["userId"])

@router.post("/import")
async def import_api(
    app: AppData,
    mode: str = Query(default="merge", pattern="^(overwrite|merge)$"),
    u: dict = Depends(require_auth),
):
    async with storage.user_lock(u["userId"]):
        if app.schemaVersion != 1:
            raise HTTPException(status_code=400, detail="Unsupported schemaVersion")
        import_appdata(u["userId"], app, mode)
        return {"ok": True}
