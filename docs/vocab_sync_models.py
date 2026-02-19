# app/models.py (vocab sync additions)
# Add these models to existing models.py

from pydantic import BaseModel, Field
from typing import List

class VocabFile(BaseModel):
    """Vocabulary file structure for offline sync"""
    schemaVersion: int = Field(description="Schema version")
    words: List[WordEntry] = Field(description="All vocabulary words")
    memory: List[MemoryState] = Field(description="Memory states for SRS")
    updatedAt: str = Field(description="Client-side last modified timestamp (UTC ISO8601)")

class VocabServerData(BaseModel):
    """Server response for GET /vocab"""
    serverRev: int = Field(description="Server revision number")
    file: VocabFile = Field(description="Vocabulary file data")
    updatedAt: str = Field(description="Server-side last modified timestamp")
    updatedByClientId: str = Field(description="Client ID that last updated")

class VocabSyncRequest(BaseModel):
    """Request body for PUT /vocab (normal sync)"""
    serverRev: int = Field(description="Expected server revision")
    file: VocabFile = Field(description="Vocabulary file to upload")
    clientId: str = Field(description="Client identifier")

class VocabForceSyncRequest(BaseModel):
    """Request body for PUT /vocab?force=true"""
    file: VocabFile = Field(description="Vocabulary file to upload")
    clientId: str = Field(description="Client identifier")

class VocabSyncResponse(BaseModel):
    """Response from PUT /vocab"""
    ok: bool = Field(default=True)
    serverRev: int = Field(description="New server revision number")
    updatedAt: str = Field(description="Server-side timestamp")
