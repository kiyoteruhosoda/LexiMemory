# tests/conftest.py
"""Pytest configuration and shared fixtures."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Generator, AsyncGenerator
from uuid import uuid4

import pytest
from httpx import AsyncClient, ASGITransport

from app.main import create_app
from app import storage


@pytest.fixture(scope="function")
def temp_data_dir() -> Generator[Path, None, None]:
    """Create a temporary data directory for isolated tests."""
    with tempfile.TemporaryDirectory() as tmpdir:
        original_data_dir = os.environ.get("VOCAB_DATA_DIR")
        os.environ["VOCAB_DATA_DIR"] = tmpdir
        
        # Force reload of settings with new data dir
        from app import settings as settings_module
        from app import storage
        settings_module.settings = settings_module.Settings()
        # Update storage module's reference to settings
        storage.settings = settings_module.settings
        
        yield Path(tmpdir)
        
        if original_data_dir:
            os.environ["VOCAB_DATA_DIR"] = original_data_dir
        else:
            os.environ.pop("VOCAB_DATA_DIR", None)
        
        # Restore original settings
        settings_module.settings = settings_module.Settings()
        storage.settings = settings_module.settings


@pytest.fixture(scope="function")
async def client(temp_data_dir: Path):
    """Create async test client with isolated data directory."""
    from app.main import lifespan
    from httpx import Cookies
    
    app = create_app()
    
    # Manually trigger lifespan startup
    async with lifespan(app):
        # Enable automatic cookie handling with httpx.Cookies()
        # Use "testserver" as base_url for proper cookie domain handling
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
            follow_redirects=True,
            cookies=Cookies()
        ) as ac:
            yield ac


@pytest.fixture(scope="function")
def unique_username():
    """Generate unique username for each test."""
    def _generate():
        return f"testuser_{uuid4().hex[:8]}"
    return _generate


@pytest.fixture(scope="function")
async def authenticated_client(client: AsyncClient, unique_username) -> AsyncGenerator[tuple[AsyncClient, dict, str], None]:
    """
    Create authenticated test client with a registered user.
    Returns (client, user_data, access_token).
    Automatically cleans up the user after the test.
    """
    username = unique_username()
    password = "testpass123"
    
    # Register user
    register_response = await client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert register_response.status_code == 200
    user_data = register_response.json()

    # Login
    login_response = await client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    access_token = login_data["access_token"]

    yield client, user_data, access_token
    
    # Cleanup: delete user after test
    try:
        await client.delete(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    except Exception:
        # Ignore cleanup errors (user may have been deleted by test)
        pass
