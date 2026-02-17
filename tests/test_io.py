# tests/test_io.py
"""Tests for import/export endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_export_empty(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test exporting data when nothing exists."""
    client, _, access_token = authenticated_client
    
    response = await client.get(
        "/api/io/export",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "exportedAt" in data
    assert data["words"] == []
    assert data["memory"] == []


@pytest.mark.asyncio
async def test_export_with_data(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test exporting data after creating words."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "export", "pos": "verb", "meaningJa": "エクスポートする"},
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    # Grade it to create memory state
    await client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "good"},
        headers=headers
    )
    
    # Export
    response = await client.get("/api/io/export", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["words"]) == 1
    assert data["words"][0]["headword"] == "export"
    assert len(data["memory"]) == 1
    assert data["memory"][0]["wordId"] == word_id


@pytest.mark.asyncio
async def test_import_overwrite(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing data with overwrite mode."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create initial data
    await client.post(
        "/api/words",
        json={"headword": "initial", "pos": "noun", "meaningJa": "初期"},
        headers=headers
    )
    
    # Import new data (overwrite)
    import_data = {
        "exportedAt": "2026-01-01T00:00:00Z",
        "words": [
            {
                "id": "word1",
                "headword": "imported",
                "pos": "adj",
                "meaningJa": "インポートされた",
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z",
                "examples": [],
                "tags": [],
            }
        ],
        "memory": [],
    }
    
    response = await client.post(
        "/api/io/import?mode=overwrite",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify data was overwritten
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["headword"] == "imported"


@pytest.mark.asyncio
async def test_import_merge(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing data with merge mode."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create initial word
    create_response = await client.post(
        "/api/words",
        json={"headword": "existing", "pos": "noun", "meaningJa": "既存"},
        headers=headers
    )
    existing_id = create_response.json()["word"]["id"]
    
    # Import additional data (merge)
    import_data = {
        "exportedAt": "2026-01-01T00:00:00Z",
        "words": [
            {
                "id": "newword1",
                "headword": "merged",
                "pos": "verb",
                "meaningJa": "マージされた",
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z",
                "examples": [],
                "tags": [],
            }
        ],
        "memory": [],
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify both words exist
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 2
    headwords = {w["headword"] for w in words}
    assert "existing" in headwords
    assert "merged" in headwords


@pytest.mark.asyncio
async def test_import_unauthenticated(client: AsyncClient):
    """Test import endpoint requires authentication."""
    import_data = {
        "exportedAt": "2026-01-01T00:00:00Z",
        "words": [],
        "memory": [],
    }
    
    response = await client.post("/api/io/import", json=import_data)
    assert response.status_code == 401
