# tests/test_words.py
"""Tests for word management endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_list_words_empty(authenticated_client: tuple[TestClient, dict]):
    """Test listing words when none exist."""
    client, _ = authenticated_client
    
    response = client.get("/api/words")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["words"] == []


def test_create_word(authenticated_client: tuple[TestClient, dict]):
    """Test creating a new word."""
    client, _ = authenticated_client
    
    word_data = {
        "headword": "eloquent",
        "pronunciation": "ˈeləkwənt",
        "pos": "adj",
        "meaningJa": "雄弁な、説得力のある",
        "examples": [
            {
                "id": "ex1",
                "en": "She gave an eloquent speech.",
                "ja": "彼女は雄弁なスピーチをした。",
            }
        ],
        "tags": ["adjective", "formal"],
    }
    
    response = client.post("/api/words", json=word_data)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "word" in data
    created_word = data["word"]
    assert created_word["headword"] == "eloquent"
    assert "id" in created_word
    assert "createdAt" in created_word
    assert "updatedAt" in created_word


def test_list_words_after_create(authenticated_client: tuple[TestClient, dict]):
    """Test listing words after creating one."""
    client, _ = authenticated_client
    
    # Create a word
    word_data = {
        "headword": "test",
        "pos": "noun",
        "meaningJa": "テスト",
    }
    client.post("/api/words", json=word_data)
    
    # List words
    response = client.get("/api/words")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert len(data["words"]) == 1
    assert data["words"][0]["headword"] == "test"


def test_update_word(authenticated_client: tuple[TestClient, dict]):
    """Test updating an existing word."""
    client, _ = authenticated_client
    
    # Create a word
    create_response = client.post(
        "/api/words",
        json={"headword": "original", "pos": "noun", "meaningJa": "元の"},
    )
    word_id = create_response.json()["word"]["id"]
    
    # Update the word
    update_data = {
        "headword": "updated",
        "pos": "verb",
        "meaningJa": "更新された",
    }
    response = client.put(f"/api/words/{word_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["word"]["headword"] == "updated"
    assert data["word"]["pos"] == "verb"


def test_delete_word(authenticated_client: tuple[TestClient, dict]):
    """Test deleting a word."""
    client, _ = authenticated_client
    
    # Create a word
    create_response = client.post(
        "/api/words",
        json={"headword": "todelete", "pos": "noun", "meaningJa": "削除する"},
    )
    word_id = create_response.json()["word"]["id"]
    
    # Delete the word
    response = client.delete(f"/api/words/{word_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    
    # Verify it's deleted
    list_response = client.get("/api/words")
    assert len(list_response.json()["words"]) == 0


def test_words_isolated_by_user(client: TestClient):
    """Test that words are isolated between users."""
    from uuid import uuid4
    
    # Register and login user 1
    user1 = f"user1_{uuid4().hex[:8]}"
    client.post(
        "/api/auth/register",
        json={"username": user1, "password": "pass1"},
    )
    client.post(
        "/api/auth/login",
        json={"username": user1, "password": "pass1"},
    )
    
    # Create word as user 1
    client.post(
        "/api/words",
        json={"headword": "user1word", "pos": "noun", "meaningJa": "ユーザー1の単語"},
    )
    
    # Logout
    client.post("/api/auth/logout")
    
    # Register and login user 2
    user2 = f"user2_{uuid4().hex[:8]}"
    client.post(
        "/api/auth/register",
        json={"username": user2, "password": "pass2"},
    )
    client.post(
        "/api/auth/login",
        json={"username": user2, "password": "pass2"},
    )
    
    # User 2 should have no words
    response = client.get("/api/words")
    data = response.json()
    assert len(data["words"]) == 0
