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
    memo: Optional[str] = None

class WordEntry(WordUpsert):
    id: str
    createdAt: str
    updatedAt: str

# --- Auth Models ---
class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class MeResponse(BaseModel):
    userId: str
    username: str

# --- Words/Mem/Export Models ---
class WordsFile(BaseModel):
    updatedAt: str
    words: List[WordEntry] = Field(default_factory=list)

class MemoryState(BaseModel):
    wordId: str
    dueAt: str
    lastRating: Optional[Rating] = None
    lastReviewedAt: Optional[str] = None
    memoryLevel: int = 0
    ease: float = 2.5
    intervalDays: int = 0
    reviewCount: int = 0
    lapseCount: int = 0

class MemoryFile(BaseModel):
    updatedAt: str
    memory: List[MemoryState] = Field(default_factory=list)

class AppData(BaseModel):
    schemaVersion: int = 1
    exportedAt: str
    words: List[WordEntry] = Field(default_factory=list)
    memory: List[MemoryState] = Field(default_factory=list)

# --- Study Models ---
class GradeRequest(BaseModel):
    wordId: str
    rating: Rating

# --- Client Logging Models ---
class ClientLogEntry(BaseModel):
    timestamp: str
    level: str  # DEBUG, INFO, WARN, ERROR
    message: str
    userId: Optional[str] = None
    extra: Optional[dict] = None

class ClientLogBatch(BaseModel):
    logs: List[ClientLogEntry] = Field(default_factory=list)
