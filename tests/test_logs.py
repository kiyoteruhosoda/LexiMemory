# tests/test_logs.py
"""Tests for client-side logging endpoint."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_client_logs_basic(client: AsyncClient):
    """Test basic client log submission without extra fields."""
    payload = {
        "logs": [
            {
                "timestamp": "2026-02-19T10:00:00Z",
                "level": "INFO",
                "message": "Test log message",
                "userId": None,
            }
        ]
    }
    
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 1


@pytest.mark.asyncio
async def test_client_logs_with_batch_extra(client: AsyncClient):
    """Test client log submission with batch-level extra fields.
    
    This test ensures that batch.extra is properly handled,
    preventing the AttributeError that occurred when trying to access entry.extra.
    """
    payload = {
        "logs": [
            {
                "timestamp": "2026-02-19T10:00:00Z",
                "level": "INFO",
                "message": "Test log message 1",
                "userId": "user-123",
            },
            {
                "timestamp": "2026-02-19T10:01:00Z",
                "level": "ERROR",
                "message": "Test error message",
                "userId": "user-123",
            }
        ],
        "extra": {
            "clientId": "browser-abc123",
            "appVersion": "1.0.0",
            "userAgent": "Mozilla/5.0"
        }
    }
    
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 2


@pytest.mark.asyncio
async def test_client_logs_multiple_entries(client: AsyncClient):
    """Test client log submission with multiple log entries."""
    payload = {
        "logs": [
            {
                "timestamp": "2026-02-19T10:00:00Z",
                "level": "DEBUG",
                "message": "Debug message",
                "userId": None,
            },
            {
                "timestamp": "2026-02-19T10:01:00Z",
                "level": "INFO",
                "message": "Info message",
                "userId": "user-456",
            },
            {
                "timestamp": "2026-02-19T10:02:00Z",
                "level": "WARN",
                "message": "Warning message",
                "userId": "user-456",
            },
            {
                "timestamp": "2026-02-19T10:03:00Z",
                "level": "ERROR",
                "message": "Error message",
                "userId": "user-456",
            }
        ]
    }
    
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 4


@pytest.mark.asyncio
async def test_client_logs_without_extra(client: AsyncClient):
    """Test that logs work correctly when extra field is omitted.
    
    This is the regression test for the bug where entry.extra was accessed
    but ClientLogEntry doesn't have an extra field.
    """
    payload = {
        "logs": [
            {
                "timestamp": "2026-02-19T10:00:00Z",
                "level": "INFO",
                "message": "Test without extra",
                "userId": "user-789",
            }
        ]
        # Note: no 'extra' field at batch level
    }
    
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 1


@pytest.mark.asyncio
async def test_client_logs_empty_batch(client: AsyncClient):
    """Test client log submission with empty log array."""
    payload = {
        "logs": []
    }
    
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 0


@pytest.mark.asyncio
async def test_client_logs_invalid_level(client: AsyncClient):
    """Test that invalid log levels are handled gracefully."""
    payload = {
        "logs": [
            {
                "timestamp": "2026-02-19T10:00:00Z",
                "level": "INVALID_LEVEL",
                "message": "Test with invalid level",
                "userId": None,
            }
        ]
    }
    
    # Should not crash - getattr with default should handle this
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 1


@pytest.mark.asyncio
async def test_client_logs_all_levels(client: AsyncClient):
    """Test all standard log levels."""
    payload = {
        "logs": [
            {"timestamp": "2026-02-19T10:00:00Z", "level": "DEBUG", "message": "Debug", "userId": None},
            {"timestamp": "2026-02-19T10:00:01Z", "level": "INFO", "message": "Info", "userId": None},
            {"timestamp": "2026-02-19T10:00:02Z", "level": "WARNING", "message": "Warning", "userId": None},
            {"timestamp": "2026-02-19T10:00:03Z", "level": "ERROR", "message": "Error", "userId": None},
            {"timestamp": "2026-02-19T10:00:04Z", "level": "CRITICAL", "message": "Critical", "userId": None},
        ]
    }
    
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 5


@pytest.mark.asyncio
async def test_client_logs_with_authenticated_user(authenticated_client):
    """Test client log submission with authenticated user context."""
    client, user_data, access_token = authenticated_client
    
    payload = {
        "logs": [
            {
                "timestamp": "2026-02-19T10:00:00Z",
                "level": "INFO",
                "message": "Authenticated user action",
                "userId": user_data["userId"],
            }
        ],
        "extra": {
            "sessionId": "session-xyz",
            "clientVersion": "2.0.0"
        }
    }
    
    # Note: This endpoint doesn't require authentication, but userId can be included
    response = await client.post("/api/logs/client", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["received"] == 1
