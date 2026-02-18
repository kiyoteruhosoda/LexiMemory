# app/models.py

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

Pos = Literal["noun","verb","adj","adv","prep","conj","pron","det","interj","other"]
Rating = Literal["again","hard","good","easy"]

class ExampleSentence(BaseModel):
    """Example sentence for a word"""
    id: Optional[str] = Field(None, description="Unique identifier for the example (auto-generated if missing)")
    en: str = Field(..., description="Example sentence in English")
    ja: Optional[str] = Field(None, description="Example sentence in Japanese (optional)")
    source: Optional[str] = Field(None, description="Source of the example (book, website, etc.)")


# ★追加：作成/更新入力用（id/createdAt/updatedAt を含めない）
class WordUpsert(BaseModel):
    """Create or update a word entry"""
    headword: str = Field(..., description="The word to learn", min_length=1)
    pronunciation: Optional[str] = Field(None, description="Phonetic pronunciation (e.g., IPA)")
    pos: Pos = Field(..., description="Part of speech")
    meaningJa: str = Field(..., description="Japanese meaning", min_length=1)
    examples: List[ExampleSentence] = Field(default_factory=list, description="Example sentences")
    tags: List[str] = Field(default_factory=list, description="Custom tags for categorization")
    memo: Optional[str] = Field(None, description="Personal notes or memory aids")


class WordEntry(WordUpsert):
    """Complete word entry with metadata"""
    id: str = Field(..., description="Unique word ID (UUID)")
    createdAt: str = Field(..., description="Creation timestamp (ISO 8601)")
    updatedAt: str = Field(..., description="Last update timestamp (ISO 8601)")


# --- Auth Models ---
class RegisterRequest(BaseModel):
    """User registration request"""
    username: str = Field(..., description="Username (unique identifier)", min_length=1, max_length=255)
    password: str = Field(..., description="Password for the account", min_length=1)


class LoginRequest(BaseModel):
    """User login request"""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class MeResponse(BaseModel):
    """Current user information"""
    userId: str = Field(..., description="Unique user identifier (UUID)")
    username: str = Field(..., description="Username")


# --- Words/Mem/Export Models ---
class WordsFile(BaseModel):
    """Exported words data"""
    updatedAt: str = Field(..., description="Last update timestamp (ISO 8601)")
    words: List[WordEntry] = Field(default_factory=list, description="List of word entries")


class MemoryState(BaseModel):
    """Memory state for FSRS (Free Spaced Repetition Scheduler) algorithm"""
    wordId: str = Field(..., description="Reference to word ID")
    dueAt: str = Field(..., description="Next scheduled review (ISO 8601 timestamp)")
    lastRating: Optional[Rating] = Field(None, description="Last rating response (again/hard/good/easy)")
    lastReviewedAt: Optional[str] = Field(None, description="Last review timestamp (ISO 8601)")
    memoryLevel: int = Field(default=0, description="Memory proficiency level")
    ease: float = Field(default=2.5, description="FSRS ease factor (affects interval growth)")
    intervalDays: int = Field(default=0, description="Current review interval in days")
    reviewCount: int = Field(default=0, description="Total number of reviews")
    lapseCount: int = Field(default=0, description="Number of times forgotten (lapsed)")


class MemoryFile(BaseModel):
    """Exported memory state data"""
    updatedAt: str = Field(..., description="Last update timestamp (ISO 8601)")
    memory: List[MemoryState] = Field(default_factory=list, description="List of memory states")


class AppData(BaseModel):
    """Complete application data export format"""
    schemaVersion: int = Field(default=1, description="Data schema version for compatibility")
    exportedAt: str = Field(..., description="Export timestamp (ISO 8601)")
    words: List[WordEntry] = Field(default_factory=list, description="All word entries")
    memory: List[MemoryState] = Field(default_factory=list, description="All memory states")


# --- Import Models (flexible scenarios) ---
# WordEntryForImport and AppDataForImport support manual file creation
# where IDs and timestamps may be missing; they will be auto-generated.

class ExampleSentenceForImport(BaseModel):
    """Example sentence for import - ID is optional (auto-generated if missing)"""
    id: Optional[str] = Field(None, description="Optional ID; auto-generated if missing")
    en: str = Field(..., description="Example sentence in English")
    ja: Optional[str] = Field(None, description="Example sentence in Japanese (optional)")
    source: Optional[str] = Field(None, description="Source of the example (book, website, etc.)")


class WordEntryForImport(BaseModel):
    """Word entry for import - ID and timestamps are optional (auto-generated if missing)"""
    id: Optional[str] = Field(None, description="Optional ID (UUID); auto-generated if missing")
    headword: str = Field(..., description="The word to learn", min_length=1)
    pronunciation: Optional[str] = Field(None, description="Phonetic pronunciation (e.g., IPA)")
    pos: Pos = Field(..., description="Part of speech")
    meaningJa: str = Field(..., description="Japanese meaning", min_length=1)
    examples: List[ExampleSentenceForImport] = Field(default_factory=list, description="Example sentences")
    tags: List[str] = Field(default_factory=list, description="Custom tags for categorization")
    memo: Optional[str] = Field(None, description="Personal notes or memory aids")
    createdAt: Optional[str] = Field(None, description="Creation timestamp (ISO 8601); auto-generated if missing")
    updatedAt: Optional[str] = Field(None, description="Last update timestamp (ISO 8601); auto-generated if missing")


class MemoryStateForImport(BaseModel):
    """Memory state for import - most fields optional"""
    wordId: str = Field(..., description="Reference to word ID")
    dueAt: str = Field(..., description="Next scheduled review (ISO 8601 timestamp)")
    lastRating: Optional[Rating] = Field(None, description="Last rating response (again/hard/good/easy)")
    lastReviewedAt: Optional[str] = Field(None, description="Last review timestamp (ISO 8601)")
    memoryLevel: int = Field(default=0, description="Memory proficiency level")
    ease: float = Field(default=2.5, description="FSRS ease factor (affects interval growth)")
    intervalDays: int = Field(default=0, description="Current review interval in days")
    reviewCount: int = Field(default=0, description="Total number of reviews")
    lapseCount: int = Field(default=0, description="Number of times forgotten (lapsed)")


class AppDataForImport(BaseModel):
    """Application data for import - flexible version supporting manual file creation"""
    schemaVersion: int = Field(default=1, description="Data schema version for compatibility")
    exportedAt: Optional[str] = Field(None, description="Export timestamp (ISO 8601); optional for manually created files")
    words: List[WordEntryForImport] = Field(default_factory=list, description="Word entries to import")
    memory: List[MemoryStateForImport] = Field(default_factory=list, description="Memory states to import")


# --- Study Models ---
class GradeRequest(BaseModel):
    """Grade request for a studied word"""
    wordId: str = Field(..., description="Word ID that was studied")
    rating: Rating = Field(..., description="How well you remembered (again/hard/good/easy)")


# --- Client Logging Models ---
class ClientLogEntry(BaseModel):
    """Client-side log entry"""
    timestamp: str = Field(..., description="Log timestamp (ISO 8601)")
    level: str = Field(..., description="Log level (DEBUG/INFO/WARN/ERROR)")
    message: str = Field(..., description="Log message")
    userId: Optional[str] = Field(None, description="User ID (if authenticated)")
    extra: Optional[dict] = Field(None, description="Additional context fields")


class ClientLogBatch(BaseModel):
    """Batch of client-side log entries"""
    logs: List[ClientLogEntry] = Field(..., description="Array of log entries")
    extra: Optional[dict] = None
