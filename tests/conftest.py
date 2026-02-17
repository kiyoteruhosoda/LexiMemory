# tests/conftest.py
"""Pytest configuration and shared fixtures."""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Generator
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

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
        settings_module.settings = settings_module.Settings()
        
        yield Path(tmpdir)
        
        if original_data_dir:
            os.environ["VOCAB_DATA_DIR"] = original_data_dir
        else:
            os.environ.pop("VOCAB_DATA_DIR", None)
        
        # Restore original settings
        settings_module.settings = settings_module.Settings()


@pytest.fixture(scope="function")
def client(temp_data_dir: Path) -> TestClient:
    """Create test client with isolated data directory."""
    app = create_app()
    storage.ensure_dirs()
    return TestClient(app)


@pytest.fixture(scope="function")
def authenticated_client(client: TestClient) -> tuple[TestClient, dict]:
    """Create authenticated test client with a registered user."""
    # Generate unique username for this test
    username = f"testuser_{uuid4().hex[:8]}"
    password = "testpass123"
    
    # Register user
    register_response = client.post(
        "/api/auth/register",
        json={"username": username, "password": password},
    )
    assert register_response.status_code == 200
    user_data = register_response.json()

    # Login
    login_response = client.post(
        "/api/auth/login",
        json={"username": username, "password": password},
    )
    assert login_response.status_code == 200

    return client, user_data
