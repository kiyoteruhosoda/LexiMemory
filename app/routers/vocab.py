# app/routers/vocab.py
"""
Offline-first vocabulary sync router

Provides endpoints for syncing vocabulary data between client and server:
- GET /vocab: Fetch current server version
- PUT /vocab: Normal sync (with conflict detection)
- PUT /vocab?force=true: Force overwrite (LWW)
"""

from __future__ import annotations
import logging
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from ..deps import require_auth
from ..models import (
    VocabServerData,
    VocabSyncRequest,
    VocabForceSyncRequest,
    VocabSyncResponse,
    VocabFile,
)
from .. import storage

router = APIRouter(prefix="/vocab", tags=["vocab"])
logger = logging.getLogger(__name__)
audit_logger = logging.getLogger("app.audit")

# ========== Helper Functions ==========

def _vocab_file_path(userId: str) -> Path:
    """Get path to vocab file for user"""
    return storage.user_dir(userId) / "vocab.json"

def _vocab_meta_path(userId: str) -> Path:
    """Get path to vocab metadata file for user"""
    return storage.user_dir(userId) / "vocab_meta.json"

def _backup_path(userId: str, serverRev: int) -> Path:
    """Get path to backup file"""
    backup_dir = storage.user_dir(userId) / "backups"
    backup_dir.mkdir(exist_ok=True)
    return backup_dir / f"vocab_backup_rev{serverRev}.json"

def _read_vocab_data(userId: str) -> tuple[dict | None, dict]:
    """Read vocab file and metadata"""
    vocab_path = _vocab_file_path(userId)
    meta_path = _vocab_meta_path(userId)
    
    if not vocab_path.exists():
        return None, {}
    
    vocab_data = storage.read_json(vocab_path)
    meta_data = storage.read_json(meta_path) if meta_path.exists() else {}
    
    return vocab_data, meta_data

def _write_vocab_data(userId: str, file: VocabFile, serverRev: int, clientId: str) -> None:
    """Write vocab file and update metadata"""
    now = storage.now_iso()
    
    vocab_path = _vocab_file_path(userId)
    meta_path = _vocab_meta_path(userId)
    
    # Write vocab file
    storage.atomic_write_json(vocab_path, file.model_dump())
    
    # Write metadata
    meta = {
        "serverRev": serverRev,
        "updatedAt": now,
        "updatedByClientId": clientId,
    }
    storage.atomic_write_json(meta_path, meta)

def _backup_current_vocab(userId: str, currentRev: int) -> None:
    """Backup current vocab before overwriting"""
    vocab_path = _vocab_file_path(userId)
    if not vocab_path.exists():
        return
    
    backup = _backup_path(userId, currentRev)
    vocab_data = storage.read_json(vocab_path)
    
    storage.atomic_write_json(backup, vocab_data)
    logger.info(f"Backed up vocab for userId={userId} rev={currentRev}")

def _cleanup_old_backups(userId: str, keep: int = 5) -> None:
    """Keep only the most recent N backups"""
    backup_dir = storage.user_dir(userId) / "backups"
    if not backup_dir.exists():
        return
    
    backups = sorted(backup_dir.glob("vocab_backup_rev*.json"))
    if len(backups) > keep:
        for backup in backups[:-keep]:
            backup.unlink()
            logger.debug(f"Removed old backup: {backup}")

# ========== API Endpoints ==========

@router.get(
    "",
    response_model=VocabServerData,
    summary="Get vocabulary data from server",
    description="Fetch current vocabulary file and server revision for sync.",
    responses={
        200: {"description": "Vocabulary data retrieved"},
        401: {"description": "Unauthorized"},
        404: {"description": "No vocabulary data found on server"},
    }
)
async def get_vocab(
    request: Request,
    u: dict = Depends(require_auth),
):
    """Get current vocabulary file from server"""
    request_id = getattr(request.state, "request_id", None)
    
    async with storage.user_lock(u["userId"]):
        vocab_data, meta_data = _read_vocab_data(u["userId"])
        
        if vocab_data is None:
            # No data on server yet
            audit_logger.info(
                "Vocab fetch - no data",
                extra={
                    "event": "vocab.get",
                    "user_id": u["userId"],
                    "username": u["username"],
                    "request_id": request_id,
                    "result": "not_found"
                }
            )
            raise HTTPException(status_code=404, detail="No vocabulary data found")
        
        response = VocabServerData(
            serverRev=meta_data.get("serverRev", 0),
            file=VocabFile(**vocab_data),
            updatedAt=meta_data.get("updatedAt", storage.now_iso()),
            updatedByClientId=meta_data.get("updatedByClientId", "unknown"),
        )
        
        audit_logger.info(
            "Vocab fetched",
            extra={
                "event": "vocab.get",
                "user_id": u["userId"],
                "username": u["username"],
                "request_id": request_id,
                "server_rev": response.serverRev,
                "word_count": len(response.file.words),
                "result": "success"
            }
        )
        
        return response


@router.put(
    "",
    response_model=VocabSyncResponse,
    summary="Sync vocabulary data to server",
    description="Upload vocabulary file. Use force=true to override conflicts (LWW).",
    responses={
        200: {"description": "Sync successful"},
        401: {"description": "Unauthorized"},
        409: {"description": "Conflict - server revision mismatch"},
    }
)
async def put_vocab(
    request: Request,
    sync_request: VocabSyncRequest | VocabForceSyncRequest,
    force: bool = Query(default=False, description="Force overwrite (ignore serverRev)"),
    u: dict = Depends(require_auth),
):
    """Upload vocabulary file (normal or forced)"""
    request_id = getattr(request.state, "request_id", None)
    
    async with storage.user_lock(u["userId"]):
        _, meta_data = _read_vocab_data(u["userId"])
        current_rev = meta_data.get("serverRev", 0)
        
        if force:
            # Force mode: always accept (LWW)
            if not isinstance(sync_request, VocabForceSyncRequest):
                # Accept VocabSyncRequest as well in force mode
                pass
            
            # Backup before overwriting
            _backup_current_vocab(u["userId"], current_rev)
            
            new_rev = current_rev + 1
            _write_vocab_data(
                u["userId"],
                sync_request.file,
                new_rev,
                sync_request.clientId
            )
            
            _cleanup_old_backups(u["userId"])
            
            audit_logger.info(
                "Vocab force synced",
                extra={
                    "event": "vocab.sync.force",
                    "user_id": u["userId"],
                    "username": u["username"],
                    "request_id": request_id,
                    "server_rev": new_rev,
                    "client_id": sync_request.clientId,
                    "word_count": len(sync_request.file.words),
                    "result": "success"
                }
            )
            
            return VocabSyncResponse(
                ok=True,
                serverRev=new_rev,
                updatedAt=storage.now_iso()
            )
        
        else:
            # Normal mode: check serverRev
            if not isinstance(sync_request, VocabSyncRequest):
                raise HTTPException(
                    status_code=400,
                    detail="Normal sync requires serverRev"
                )
            
            if sync_request.serverRev != current_rev:
                # Conflict!
                audit_logger.warning(
                    "Vocab sync conflict",
                    extra={
                        "event": "vocab.sync.conflict",
                        "user_id": u["userId"],
                        "username": u["username"],
                        "request_id": request_id,
                        "expected_rev": sync_request.serverRev,
                        "current_rev": current_rev,
                        "client_id": sync_request.clientId,
                        "result": "conflict"
                    }
                )
                raise HTTPException(
                    status_code=409,
                    detail={
                        "error": "CONFLICT",
                        "message": "サーバーのデータが更新されています",
                        "expectedRev": sync_request.serverRev,
                        "currentRev": current_rev,
                    }
                )
            
            # No conflict: write new version
            new_rev = current_rev + 1
            _write_vocab_data(
                u["userId"],
                sync_request.file,
                new_rev,
                sync_request.clientId
            )
            
            audit_logger.info(
                "Vocab synced",
                extra={
                    "event": "vocab.sync.normal",
                    "user_id": u["userId"],
                    "username": u["username"],
                    "request_id": request_id,
                    "server_rev": new_rev,
                    "client_id": sync_request.clientId,
                    "word_count": len(sync_request.file.words),
                    "result": "success"
                }
            )
            
            return VocabSyncResponse(
                ok=True,
                serverRev=new_rev,
                updatedAt=storage.now_iso()
            )
