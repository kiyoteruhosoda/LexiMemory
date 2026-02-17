# app/routers/words.py

from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import uuid4
from ..deps import require_user
from ..models import WordEntry, WordUpsert   # ★追加
from .. import storage
from ..services import load_words, save_words, delete_word

router = APIRouter(prefix="/words", tags=["words"])

@router.get("")
async def list_words_api(
    q: Optional[str] = Query(default=None),
    pos: Optional[str] = Query(default=None),
    u: dict = Depends(require_user),
):
    async with storage.user_lock(u["userId"]):
        wf = load_words(u["userId"])
        words = wf.words

        if q:
            qq = q.lower()
            words = [w for w in words if qq in w.headword.lower() or qq in w.meaningJa.lower()]
        if pos:
            words = [w for w in words if w.pos == pos]
        return {"ok": True, "words": words}

@router.post("")
async def create_word_api(word: WordUpsert, u: dict = Depends(require_user)):  # ★変更
    async with storage.user_lock(u["userId"]):
        now = storage.now_iso()
        w = WordEntry(
            id=str(uuid4()),
            createdAt=now,
            updatedAt=now,
            **word.model_dump(),
        )
        wf = load_words(u["userId"])
        wf.words.append(w)
        save_words(u["userId"], wf)
        return {"ok": True, "word": w}

@router.put("/{wordId}")
async def update_word_api(wordId: str, word: WordUpsert, u: dict = Depends(require_user)):  # ★変更
    async with storage.user_lock(u["userId"]):
        wf = load_words(u["userId"])
        found = False
        now = storage.now_iso()
        new_list = []
        for w in wf.words:
            if w.id == wordId:
                found = True
                # createdAt は既存維持、updatedAt だけ更新
                new_list.append(
                    WordEntry(
                        id=wordId,
                        createdAt=w.createdAt,
                        updatedAt=now,
                        **word.model_dump(),
                    )
                )
            else:
                new_list.append(w)

        if not found:
            raise HTTPException(status_code=404, detail="Word not found")

        wf.words = new_list
        save_words(u["userId"], wf)
        updated_word = next(w for w in wf.words if w.id == wordId)
        return {"ok": True, "word": updated_word}

@router.delete("/{wordId}")
async def delete_word_api(wordId: str, u: dict = Depends(require_user)):
    async with storage.user_lock(u["userId"]):
        delete_word(u["userId"], wordId)
        return {"ok": True}
