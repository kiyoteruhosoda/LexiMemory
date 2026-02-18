# app/routers/study.py
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from ..deps import require_auth
from ..models import GradeRequest, MemoryState
from .. import storage
from ..services import get_next_card, grade_card, reset_memory

router = APIRouter(prefix="/study", tags=["study"])

@router.get(
    "/next",
    summary="Get next card to study",
    description="Retrieve the next word to study using FSRS spaced repetition algorithm. Prioritizes words due for review.",
    responses={
        200: {
            "description": "Next card retrieved",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "card": {
                            "word": {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "headword": "serendipity",
                                "pos": "noun",
                                "meaningJa": "幸運な偶然",
                            },
                            "memory": {
                                "wordId": "550e8400-e29b-41d4-a716-446655440000",
                                "dueAt": "2024-02-01T00:00:00Z",
                                "memoryLevel": 1,
                            }
                        }
                    }
                }
            }
        },
        401: {"description": "Unauthorized"},
    }
)
async def next_card(u: dict = Depends(require_auth)):
    async with storage.user_lock(u["userId"]):
        card = get_next_card(u["userId"])
        if not card:
            return {"ok": True, "card": None}
        return {"ok": True, "card": {"word": card["word"], "memory": card["memory"]}}

@router.post(
    "/grade",
    summary="Grade a studied card",
    description="Submit a response grade (again/hard/good/easy) for a studied word. Updates FSRS memory state and calculates next review interval.",
    responses={
        200: {
            "description": "Card graded successfully",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "memory": {
                            "wordId": "550e8400-e29b-41d4-a716-446655440000",
                            "dueAt": "2024-02-15T00:00:00Z",
                            "lastRating": "good",
                            "memoryLevel": 2,
                        }
                    }
                }
            }
        },
        401: {"description": "Unauthorized"},
        404: {"description": "Word not found"},
        422: {"description": "Validation error"},
    }
)
async def grade(req: GradeRequest, u: dict = Depends(require_auth)):
    async with storage.user_lock(u["userId"]):
        m = grade_card(u["userId"], req.wordId, req.rating)
        return {"ok": True, "memory": m}

@router.post(
    "/reset/{word_id}",
    summary="Reset word memory state",
    description="Reset the spaced repetition memory state for a word, setting it back to initial state for re-learning.",
    responses={
        200: {"description": "Memory state reset"},
        401: {"description": "Unauthorized"},
        404: {"description": "Word not found"},
    }
)
async def reset_word_memory(word_id: str, u: dict = Depends(require_auth)):
    """Reset memory state for a specific word"""
    async with storage.user_lock(u["userId"]):
        reset_memory(u["userId"], word_id)
        return {"ok": True}
