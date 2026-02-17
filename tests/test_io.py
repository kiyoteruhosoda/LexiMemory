# tests/test_io.py
"""Tests for import/export endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_export_empty(authenticated_client: tuple[TestClient, dict]):
    """Test exporting data when nothing exists."""
    client, _ = authenticated_client
    
    response = client.get("/api/io/export")
    assert response.status_code == 200
    data = response.json()
    assert "exportedAt" in data
    assert data["words"] == []
    assert data["memory"] == []


def test_export_with_data(authenticated_client: tuple[TestClient, dict]):
    """Test exporting data after creating words."""
    client, _ = authenticated_client
    
    # Create a word
    create_response = client.post(
        "/api/words",
        json={"headword": "export", "pos": "verb", "meaningJa": "エクスポートする"},
    )
    word_id = create_response.json()["word"]["id"]
    
    # Grade it to create memory state
    client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "good"},
    )
    
    # Export
    response = client.get("/api/io/export")
    assert response.status_code == 200
    data = response.json()
    assert len(data["words"]) == 1
    assert data["words"][0]["headword"] == "export"
    assert len(data["memory"]) == 1
    assert data["memory"][0]["wordId"] == word_id


def test_import_overwrite(authenticated_client: tuple[TestClient, dict]):
    """Test importing data with overwrite mode."""
    client, _ = authenticated_client
    
    # Create initial data
    client.post(
        "/api/words",
        json={"headword": "initial", "pos": "noun", "meaningJa": "初期"},
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
    
    response = client.post("/api/io/import?mode=overwrite", json=import_data)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify data was overwritten
    words_response = client.get("/api/words")
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["headword"] == "imported"


def test_import_merge(authenticated_client: tuple[TestClient, dict]):
    """Test importing data with merge mode."""
    client, _ = authenticated_client
    
    # Create initial word
    create_response = client.post(
        "/api/words",
        json={"headword": "existing", "pos": "noun", "meaningJa": "既存"},
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
    
    response = client.post("/api/io/import?mode=merge", json=import_data)
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify both words exist
    words_response = client.get("/api/words")
    words = words_response.json()["words"]
    assert len(words) == 2
    headwords = {w["headword"] for w in words}
    assert "existing" in headwords
    assert "merged" in headwords


def test_import_unauthenticated(client: TestClient):
    """Test import endpoint requires authentication."""
    import_data = {
        "exportedAt": "2026-01-01T00:00:00Z",
        "words": [],
        "memory": [],
    }
    
    response = client.post("/api/io/import", json=import_data)
    assert response.status_code == 401
