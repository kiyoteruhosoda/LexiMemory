"""Application service contract for authentication use-cases."""

from __future__ import annotations

from datetime import datetime
from typing import Protocol


class AuthServicePort(Protocol):
    """Port for auth use-cases consumed by API routers."""

    async def login(self, username: str, password: str) -> tuple[str, str, datetime] | None:
        ...

    async def refresh(self, refresh_token: str) -> tuple[str, str, datetime] | None:
        ...

    async def logout(self, refresh_token: str | None) -> bool:
        ...

    async def has_active_refresh_token(self, refresh_token: str) -> bool:
        ...

    async def verify_access_token(self, token: str) -> str | None:
        ...

    async def evaluate_auth_status(
        self,
        access_token: str | None,
        refresh_token: str | None,
    ) -> tuple[bool, bool, str | None]:
        ...
