# app/infra/token_store_json.py
"""
JSON-based refresh token store with atomic writes and locking.
File: data/auth/refresh_store.json
"""

import asyncio
import hashlib
import json
import logging
import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.domain.models.tokens import RefreshStore, TokenRecord

logger = logging.getLogger(__name__)


class JsonTokenStore:
    """Manages refresh tokens in a JSON file with atomic writes"""
    
    def __init__(self, data_dir: str):
        """
        Args:
            data_dir: Base data directory
        """
        self.auth_dir = Path(data_dir) / "auth"
        self.store_path = self.auth_dir / "refresh_store.json"
        self.tmp_path = self.auth_dir / "refresh_store.json.tmp"
        self._lock = asyncio.Lock()
        
        # Ensure directory exists
        self.auth_dir.mkdir(parents=True, exist_ok=True)
    
    async def load(self) -> RefreshStore:
        """Load refresh store from file (atomic)"""
        async with self._lock:
            if not self.store_path.exists():
                # Initialize empty store
                return RefreshStore(
                    version=1,
                    updated_at_utc=datetime.now(timezone.utc).isoformat(),
                    tokens={},
                    user_index={},
                    family_index={}
                )
            
            try:
                with open(self.store_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return RefreshStore(**data)
            except Exception as e:
                logger.error(f"Failed to load refresh store: {e}")
                # Return empty store on corruption
                return RefreshStore(
                    version=1,
                    updated_at_utc=datetime.now(timezone.utc).isoformat(),
                    tokens={},
                    user_index={},
                    family_index={}
                )
    
    async def save(self, store: RefreshStore) -> None:
        """
        Save refresh store to file atomically.
        Uses tmp file + rename for atomic replacement.
        """
        async with self._lock:
            store.updated_at_utc = datetime.now(timezone.utc).isoformat()
            
            # Ensure directory exists (race condition protection)
            self.auth_dir.mkdir(parents=True, exist_ok=True)
            
            try:
                # Write to temporary file
                with open(self.tmp_path, "w", encoding="utf-8") as f:
                    json.dump(store.model_dump(), f, indent=2, ensure_ascii=False)
                    f.flush()
                    os.fsync(f.fileno())  # Ensure written to disk
                
                # Verify tmp file exists before rename
                if not self.tmp_path.exists():
                    raise FileNotFoundError(f"Temporary file not created: {self.tmp_path}")
                
                # Atomic rename
                os.replace(self.tmp_path, self.store_path)
                logger.debug("Refresh store saved atomically")
            except Exception as e:
                # Clean up tmp file if it exists
                if self.tmp_path.exists():
                    try:
                        self.tmp_path.unlink()
                    except Exception:
                        pass
                logger.error(f"Failed to save refresh store: {e}")
                raise
    
    async def find_by_hash(self, token_hash: str) -> Optional[tuple[str, TokenRecord]]:
        """
        Find token record by hash.
        
        Args:
            token_hash: SHA256 hash of token
            
        Returns:
            Tuple of (token_id, TokenRecord) if found, None otherwise
        """
        store = await self.load()
        for token_id, record in store.tokens.items():
            if record.token_hash == token_hash:
                return (token_id, record)
        return None
    
    async def add_token(
        self,
        token_id: str,
        user_id: str,
        token_hash: str,
        family_id: str,
        prev_token_id: Optional[str],
        ttl_days: int
    ) -> None:
        """
        Add a new refresh token record.
        
        Args:
            token_id: Unique token identifier
            user_id: User identifier
            token_hash: SHA256 hash of token
            family_id: Token family identifier
            prev_token_id: Previous token in rotation chain
            ttl_days: Time-to-live in days
        """
        store = await self.load()
        
        now_utc = datetime.now(timezone.utc)
        from datetime import timedelta
        expires_at_utc = now_utc + timedelta(days=ttl_days)
        
        record = TokenRecord(
            user_id=user_id,
            token_hash=token_hash,
            family_id=family_id,
            prev_token_id=prev_token_id,
            issued_at_utc=now_utc.isoformat(),
            expires_at_utc=expires_at_utc.isoformat(),
            revoked_at_utc=None,
            replaced_by_token_id=None,
            last_used_at_utc=None
        )
        
        store.tokens[token_id] = record
        
        # Update indexes
        if user_id not in store.user_index:
            store.user_index[user_id] = []
        store.user_index[user_id].append(token_id)
        
        if family_id not in store.family_index:
            store.family_index[family_id] = []
        store.family_index[family_id].append(token_id)
        
        await self.save(store)
    
    async def mark_replaced(self, token_id: str, new_token_id: str) -> None:
        """Mark token as replaced during rotation"""
        store = await self.load()
        if token_id in store.tokens:
            store.tokens[token_id].replaced_by_token_id = new_token_id
            await self.save(store)
    
    async def revoke_token(self, token_id: str) -> None:
        """Revoke a single token"""
        store = await self.load()
        if token_id in store.tokens:
            store.tokens[token_id].revoked_at_utc = datetime.now(timezone.utc).isoformat()
            await self.save(store)
    
    async def revoke_family(self, family_id: str) -> None:
        """Revoke all tokens in a family (used for replay detection)"""
        store = await self.load()
        token_ids = store.family_index.get(family_id, [])
        
        now_utc = datetime.now(timezone.utc).isoformat()
        for token_id in token_ids:
            if token_id in store.tokens:
                store.tokens[token_id].revoked_at_utc = now_utc
        
        if token_ids:
            logger.warning(f"Revoked entire token family: {family_id} ({len(token_ids)} tokens)")
            await self.save(store)
    
    async def update_last_used(self, token_id: str) -> None:
        """Update last used timestamp"""
        store = await self.load()
        if token_id in store.tokens:
            store.tokens[token_id].last_used_at_utc = datetime.now(timezone.utc).isoformat()
            await self.save(store)
    
    async def cleanup_expired(self) -> int:
        """
        Remove expired tokens from store.
        
        Returns:
            Number of tokens removed
        """
        store = await self.load()
        now_utc = datetime.now(timezone.utc)
        
        to_remove = []
        for token_id, record in store.tokens.items():
            expires_at = datetime.fromisoformat(record.expires_at_utc.replace("Z", "+00:00"))
            if expires_at < now_utc:
                to_remove.append(token_id)
        
        if not to_remove:
            return 0
        
        # Remove from tokens
        for token_id in to_remove:
            record = store.tokens[token_id]
            del store.tokens[token_id]
            
            # Remove from indexes
            if record.user_id in store.user_index:
                store.user_index[record.user_id] = [
                    tid for tid in store.user_index[record.user_id] if tid != token_id
                ]
            if record.family_id in store.family_index:
                store.family_index[record.family_id] = [
                    tid for tid in store.family_index[record.family_id] if tid != token_id
                ]
        
        await self.save(store)
        logger.info(f"Cleaned up {len(to_remove)} expired tokens")
        return len(to_remove)


def generate_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token"""
    return secrets.token_urlsafe(32)  # 256 bits


def hash_refresh_token(token: str, server_salt: str) -> str:
    """
    Hash refresh token with server-side salt.
    
    Args:
        token: Raw refresh token
        server_salt: Server-side salt
        
    Returns:
        Hash string with prefix (e.g., "sha256:...")
    """
    salted = f"{server_salt}:{token}"
    hash_bytes = hashlib.sha256(salted.encode("utf-8")).hexdigest()
    return f"sha256:{hash_bytes}"
