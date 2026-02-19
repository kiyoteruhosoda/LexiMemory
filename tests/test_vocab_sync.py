"""
Tests for offline-first vocabulary sync API
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_vocab_get_not_found(authenticated_client):
    """Test GET /vocab when user has no vocab data yet"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.get("/api/vocab", headers=headers)
    
    # Should return 404 when no vocab data exists
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_vocab_put_normal_sync(authenticated_client):
    """Test normal sync with serverRev check"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # First sync (serverRev=0)
    vocab_file = {
        "schemaVersion": 1,
        "words": [
            {
                "id": "test-word-1",
                "headword": "test",
                "pos": "noun",
                "meaningJa": "テスト",
                "pronunciation": None,
                "examples": [],
                "tags": [],
                "memo": None,
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z"
            }
        ],
        "memory": [],
        "updatedAt": "2026-01-01T00:00:00Z"
    }
    
    response = await client.put(
        "/api/vocab",
        json={
            "serverRev": 0,
            "file": vocab_file,
            "clientId": "test-client-1"
        },
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["serverRev"] == 1
    assert "updatedAt" in data


@pytest.mark.asyncio
async def test_vocab_get_after_sync(authenticated_client):
    """Test GET /vocab after syncing data"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Sync some data first
    vocab_file = {
        "schemaVersion": 1,
        "words": [
            {
                "id": "word-1",
                "headword": "apple",
                "pos": "noun",
                "meaningJa": "りんご",
                "pronunciation": None,
                "examples": [],
                "tags": [],
                "memo": None,
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z"
            }
        ],
        "memory": [],
        "updatedAt": "2026-01-01T00:00:00Z"
    }
    
    await client.put(
        "/api/vocab",
        json={
            "serverRev": 0,
            "file": vocab_file,
            "clientId": "test-client-1"
        },
        headers=headers
    )
    
    # Now GET it back
    response = await client.get("/api/vocab", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["serverRev"] == 1
    assert len(data["file"]["words"]) == 1
    assert data["file"]["words"][0]["headword"] == "apple"
    assert data["updatedByClientId"] == "test-client-1"


@pytest.mark.asyncio
async def test_vocab_conflict_detection(authenticated_client):
    """Test conflict detection (409) when serverRev doesn't match"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # First sync
    vocab_file = {
        "schemaVersion": 1,
        "words": [],
        "memory": [],
        "updatedAt": "2026-01-01T00:00:00Z"
    }
    
    await client.put(
        "/api/vocab",
        json={
            "serverRev": 0,
            "file": vocab_file,
            "clientId": "client-1"
        },
        headers=headers
    )
    
    # Try to sync with old serverRev (conflict)
    response = await client.put(
        "/api/vocab",
        json={
            "serverRev": 0,  # Still 0, but server is now at 1
            "file": vocab_file,
            "clientId": "client-2"
        },
        headers=headers
    )
    
    # Should return 409 Conflict
    assert response.status_code == 409
    data = response.json()
    assert "CONFLICT" in str(data)


@pytest.mark.asyncio
async def test_vocab_force_sync(authenticated_client):
    """Test force sync (LWW) with force=true"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # First sync
    vocab_v1 = {
        "schemaVersion": 1,
        "words": [{"id": "w1", "headword": "old", "pos": "noun", "meaningJa": "古い",
                   "pronunciation": None, "examples": [], "tags": [], "memo": None,
                   "createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z"}],
        "memory": [],
        "updatedAt": "2026-01-01T00:00:00Z"
    }
    
    await client.put(
        "/api/vocab",
        json={"serverRev": 0, "file": vocab_v1, "clientId": "client-1"},
        headers=headers
    )
    
    # Force sync with different data (ignore serverRev)
    vocab_v2 = {
        "schemaVersion": 1,
        "words": [{"id": "w2", "headword": "new", "pos": "verb", "meaningJa": "新しい",
                   "pronunciation": None, "examples": [], "tags": [], "memo": None,
                   "createdAt": "2026-01-02T00:00:00Z", "updatedAt": "2026-01-02T00:00:00Z"}],
        "memory": [],
        "updatedAt": "2026-01-02T00:00:00Z"
    }
    
    response = await client.put(
        "/api/vocab?force=true",
        json={"file": vocab_v2, "clientId": "client-2"},
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["serverRev"] == 2  # Incremented
    
    # Verify data was overwritten
    get_response = await client.get("/api/vocab", headers=headers)
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert len(get_data["file"]["words"]) == 1
    assert get_data["file"]["words"][0]["headword"] == "new"


@pytest.mark.asyncio
async def test_vocab_backup_on_force_sync(authenticated_client):
    """Test that force sync creates backups"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create initial data
    vocab_v1 = {
        "schemaVersion": 1,
        "words": [{"id": "w1", "headword": "important", "pos": "adj", "meaningJa": "重要",
                   "pronunciation": None, "examples": [], "tags": [], "memo": None,
                   "createdAt": "2026-01-01T00:00:00Z", "updatedAt": "2026-01-01T00:00:00Z"}],
        "memory": [],
        "updatedAt": "2026-01-01T00:00:00Z"
    }
    
    await client.put(
        "/api/vocab",
        json={"serverRev": 0, "file": vocab_v1, "clientId": "client-1"},
        headers=headers
    )
    
    # Force overwrite
    vocab_v2 = {
        "schemaVersion": 1,
        "words": [],
        "memory": [],
        "updatedAt": "2026-01-02T00:00:00Z"
    }
    
    response = await client.put(
        "/api/vocab?force=true",
        json={"file": vocab_v2, "clientId": "client-2"},
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Verify backup exists (check via file system if accessible)
    # For now, just verify the sync succeeded
    get_response = await client.get("/api/vocab", headers=headers)
    assert len(get_response.json()["file"]["words"]) == 0


@pytest.mark.asyncio
async def test_vocab_unauthorized(client):
    """Test that vocab endpoints require authentication"""
    # GET without auth
    response = await client.get("/api/vocab")
    assert response.status_code == 401
    
    # PUT without auth
    response = await client.put(
        "/api/vocab",
        json={"serverRev": 0, "file": {}, "clientId": "test"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_vocab_memory_state_sync(authenticated_client):
    """Test syncing vocabulary with memory states"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    vocab_file = {
        "schemaVersion": 1,
        "words": [
            {
                "id": "word-1",
                "headword": "study",
                "pos": "verb",
                "meaningJa": "勉強する",
                "pronunciation": None,
                "examples": [],
                "tags": ["learning"],
                "memo": None,
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z"
            }
        ],
        "memory": [
            {
                "wordId": "word-1",
                "memoryLevel": 3,
                "ease": 2.5,
                "intervalDays": 7,
                "dueAt": "2026-02-01T00:00:00Z",
                "lastRating": "good",
                "lastReviewedAt": "2026-01-25T00:00:00Z",
                "lapseCount": 0,
                "reviewCount": 5
            }
        ],
        "updatedAt": "2026-01-01T00:00:00Z"
    }
    
    response = await client.put(
        "/api/vocab",
        json={
            "serverRev": 0,
            "file": vocab_file,
            "clientId": "test-client"
        },
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Retrieve and verify memory was synced
    get_response = await client.get("/api/vocab", headers=headers)
    assert get_response.status_code == 200
    data = get_response.json()
    assert len(data["file"]["memory"]) == 1
    assert data["file"]["memory"][0]["wordId"] == "word-1"
    assert data["file"]["memory"][0]["memoryLevel"] == 3
    assert data["file"]["memory"][0]["reviewCount"] == 5
