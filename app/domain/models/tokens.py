# app/domain/models/tokens.py
"""
Domain models for token management.
All timestamps use UTC.
"""

from __future__ import annotations
from typing import Optional, Dict, List
from pydantic import BaseModel, Field


class TokenRecord(BaseModel):
    """Represents a single refresh token record"""
    
    user_id: str
    token_hash: str  # sha256:...
    family_id: str  # Identifies token family for revocation
    prev_token_id: Optional[str] = None  # Previous token in rotation chain
    issued_at_utc: str  # ISO 8601 UTC
    expires_at_utc: str  # ISO 8601 UTC
    revoked_at_utc: Optional[str] = None  # ISO 8601 UTC if revoked
    replaced_by_token_id: Optional[str] = None  # Set when rotated
    last_used_at_utc: Optional[str] = None  # ISO 8601 UTC


class RefreshStore(BaseModel):
    """Complete refresh token store structure"""
    
    version: int = 1
    updated_at_utc: str  # ISO 8601 UTC
    tokens: Dict[str, TokenRecord] = Field(default_factory=dict)  # token_id -> record
    user_index: Dict[str, List[str]] = Field(default_factory=dict)  # user_id -> [token_id]
    family_index: Dict[str, List[str]] = Field(default_factory=dict)  # family_id -> [token_id]
