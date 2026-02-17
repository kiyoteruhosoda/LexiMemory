# app/routers/study.py
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from ..deps import require_auth
from ..models import GradeRequest
from .. import storage
from ..services import get_next_card, grade_card

router = APIRouter(prefix="/study", tags=["study"])

@router.get("/next")
async def next_card(u: dict = Depends(require_auth)):
    async with storage.user_lock(u["userId"]):
        card = get_next_card(u["userId"])
        if not card:
            return {"ok": True, "card": None}
        return {"ok": True, "card": {"word": card["word"], "memory": card["memory"]}}

@router.post("/grade")
async def grade(req: GradeRequest, u: dict = Depends(require_auth)):
    async with storage.user_lock(u["userId"]):
        m = grade_card(u["userId"], req.wordId, req.rating)
        return {"ok": True, "memory": m}
