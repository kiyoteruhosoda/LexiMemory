# app/routers/words.py

from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional, List
from uuid import uuid4
from ..deps import require_auth
from ..models import WordEntry, WordUpsert, ExampleSentence
from .. import storage
from ..services import load_words, save_words, delete_word, load_memory

logger = logging.getLogger(__name__)
audit_logger = logging.getLogger("app.audit")

# Helper to ensure examples have IDs
def _normalize_examples(examples: List[ExampleSentence]) -> List[ExampleSentence]:
    """Ensure all examples have IDs, generating UUIDs if missing"""
    return [
        ExampleSentence(
            id=ex.id or str(uuid4()),
            en=ex.en,
            ja=ex.ja,
            source=ex.source
        )
        for ex in examples
    ]

router = APIRouter(prefix="/words", tags=["words"])

@router.get(
    "",
    summary="List vocabulary words",
    description="Retrieve all vocabulary words for the authenticated user with optional filtering and memory states.",
    responses={
        200: {
            "description": "Words retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "ok": True,
                        "words": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "headword": "serendipity",
                                "pos": "noun",
                                "meaningJa": "幸運な偶然",
                                "createdAt": "2024-01-01T00:00:00Z",
                                "updatedAt": "2024-01-01T00:00:00Z",
                            }
                        ],
                        "memoryMap": {
                            "550e8400-e29b-41d4-a716-446655440000": {
                                "wordId": "550e8400-e29b-41d4-a716-446655440000",
                                "dueAt": "2024-02-01T00:00:00Z",
                                "memoryLevel": 1,
                            }
                        },
                    }
                }
            }
        },
        401: {"description": "Unauthorized"},
    }
)
async def list_words_api(
    q: Optional[str] = Query(default=None, description="Search query (searches headword and Japanese meaning)"),
    pos: Optional[str] = Query(default=None, description="Filter by part of speech (noun, verb, adj, etc.)"),
    u: dict = Depends(require_auth),
):
    async with storage.user_lock(u["userId"]):
        wf = load_words(u["userId"])
        mf = load_memory(u["userId"])
        words = wf.words

        if q:
            qq = q.lower()
            words = [w for w in words if qq in w.headword.lower() or qq in w.meaningJa.lower()]
        if pos:
            words = [w for w in words if w.pos == pos]
        
        # Build memory map by wordId
        memory_map = {m.wordId: m for m in mf.memory}
        
        return {"ok": True, "words": words, "memoryMap": memory_map}

@router.post(
    "",
    response_model=dict,
    summary="Create a new word",
    description="Add a new vocabulary word with optional examples and tags.",
    responses={
        200: {
            "description": "Word created successfully",
        },
        401: {"description": "Unauthorized"},
        422: {"description": "Validation error"},
    }
)
async def create_word_api(word: WordUpsert, request: Request, u: dict = Depends(require_auth)):
    request_id = getattr(request.state, "request_id", None)
    
    async with storage.user_lock(u["userId"]):
        now = storage.now_iso()
        # Normalize examples to ensure all have IDs
        normalized_examples = _normalize_examples(word.examples)
        w = WordEntry(
            id=str(uuid4()),
            createdAt=now,
            updatedAt=now,
            headword=word.headword,
            pronunciation=word.pronunciation,
            pos=word.pos,
            meaningJa=word.meaningJa,
            examples=normalized_examples,
            tags=word.tags,
            memo=word.memo,
        )
        wf = load_words(u["userId"])
        wf.words.append(w)
        save_words(u["userId"], wf)
        
        # Audit log
        audit_logger.info(
            "Word created",
            extra={
                "event": "word.create",
                "user_id": u["userId"],
                "username": u["username"],
                "word_id": w.id,
                "headword": w.headword,
                "request_id": request_id,
                "result": "success"
            }
        )
        
        return {"ok": True, "word": w}

@router.put(
    "/{wordId}",
    response_model=dict,
    summary="Update a word",
    description="Update an existing vocabulary word. The creation timestamp is preserved.",
    responses={
        200: {
            "description": "Word updated successfully",
        },
        401: {"description": "Unauthorized"},
        404: {"description": "Word not found"},
        422: {"description": "Validation error"},
    }
)
async def update_word_api(
    wordId: str,
    word: WordUpsert,
    request: Request,
    u: dict = Depends(require_auth),
):
    request_id = getattr(request.state, "request_id", None)
    
    async with storage.user_lock(u["userId"]):
        wf = load_words(u["userId"])
        found = False
        now = storage.now_iso()
        new_list = []
        for w in wf.words:
            if w.id == wordId:
                found = True
                # Normalize examples to ensure all have IDs
                normalized_examples = _normalize_examples(word.examples)
                new_list.append(
                    WordEntry(
                        id=wordId,
                        createdAt=w.createdAt,
                        updatedAt=now,
                        headword=word.headword,
                        pronunciation=word.pronunciation,
                        pos=word.pos,
                        meaningJa=word.meaningJa,
                        examples=normalized_examples,
                        tags=word.tags,
                        memo=word.memo,
                    )
                )
            else:
                new_list.append(w)

        if not found:
            raise HTTPException(status_code=404, detail="Word not found")

        wf.words = new_list
        save_words(u["userId"], wf)
        updated_word = next(w for w in wf.words if w.id == wordId)
        
        # Audit log
        audit_logger.info(
            "Word updated",
            extra={
                "event": "word.update",
                "user_id": u["userId"],
                "username": u["username"],
                "word_id": wordId,
                "headword": word.headword,
                "request_id": request_id,
                "result": "success"
            }
        )
        
        return {"ok": True, "word": updated_word}

@router.delete(
    "/{wordId}",
    summary="Delete a word",
    description="Remove a vocabulary word and its associated memory state.",
    responses={
        200: {"description": "Word deleted successfully"},
        401: {"description": "Unauthorized"},
        404: {"description": "Word not found"},
    }
)
async def delete_word_api(wordId: str, request: Request, u: dict = Depends(require_auth)):
    request_id = getattr(request.state, "request_id", None)
    
    async with storage.user_lock(u["userId"]):
        # Get word info before deleting for audit log
        wf = load_words(u["userId"])
        word = next((w for w in wf.words if w.id == wordId), None)
        
        if not word:
            raise HTTPException(status_code=404, detail="Word not found")
        
        delete_word(u["userId"], wordId)
        
        # Audit log
        audit_logger.info(
            "Word deleted",
            extra={
                "event": "word.delete",
                "user_id": u["userId"],
                "username": u["username"],
                "word_id": wordId,
                "headword": word.headword,
                "request_id": request_id,
                "result": "success"
            }
        )
        
        return {"ok": True}
