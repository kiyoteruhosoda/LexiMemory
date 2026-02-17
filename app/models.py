# app/models.py

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

Pos = Literal["noun","verb","adj","adv","prep","conj","pron","det","interj","other"]
Rating = Literal["again","hard","good","easy"]

class ExampleSentence(BaseModel):
    id: str
    en: str
    ja: Optional[str] = None
    source: Optional[str] = None

# ★追加：作成/更新入力用（id/createdAt/updatedAt を含めない）
class WordUpsert(BaseModel):
    headword: str
    pronunciation: Optional[str] = None
    pos: Pos
    meaningJa: str
    examples: List[ExampleSentence] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

class WordEntry(WordUpsert):
    id: str
    createdAt: str
    updatedAt: str
