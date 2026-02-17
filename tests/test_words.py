# tests/test_words.py
"""Tests for word management endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_words_empty(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test listing words when none exist."""
    client, _, access_token = authenticated_client
    
    response = await client.get(
        "/api/words",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["words"] == []


@pytest.mark.asyncio
async def test_create_word(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test creating a new word."""
    client, _, access_token = authenticated_client
    
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
    
    response = await client.post(
        "/api/words",
        json=word_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "word" in data
    created_word = data["word"]
    assert created_word["headword"] == "eloquent"
    assert "id" in created_word
    assert "createdAt" in created_word
    assert "updatedAt" in created_word


@pytest.mark.asyncio
async def test_list_words_after_create(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test listing words after creating one."""
    client, _, access_token = authenticated_client
    
    # Create a word
    word_data = {
        "headword": "test",
        "pos": "noun",
        "meaningJa": "テスト",
    }
    await client.post(
        "/api/words",
        json=word_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    # List words
    response = await client.get(
        "/api/words",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert len(data["words"]) == 1
    assert data["words"][0]["headword"] == "test"


@pytest.mark.asyncio
async def test_update_word(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test updating an existing word."""
    client, _, access_token = authenticated_client
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "original", "pos": "noun", "meaningJa": "元の"},
        headers={"Authorization": f"Bearer {access_token}"}
    )
    word_id = create_response.json()["word"]["id"]
    
    # Update the word
    update_data = {
        "headword": "updated",
        "pos": "verb",
        "meaningJa": "更新された",
    }
    response = await client.put(
        f"/api/words/{word_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["word"]["headword"] == "updated"
    assert data["word"]["pos"] == "verb"


@pytest.mark.asyncio
async def test_delete_word(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test deleting a word."""
    client, _, access_token = authenticated_client
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "todelete", "pos": "noun", "meaningJa": "削除する"},
        headers={"Authorization": f"Bearer {access_token}"}
    )
    word_id = create_response.json()["word"]["id"]
    
    # Delete the word
    response = await client.delete(
        f"/api/words/{word_id}",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    
    # Verify it's deleted
    list_response = await client.get(
        "/api/words",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert len(list_response.json()["words"]) == 0


@pytest.mark.asyncio
async def test_words_isolated_by_user(client: AsyncClient, unique_username):
    """Test that words are isolated between users."""
    
    # Register and login user 1
    user1 = unique_username()
    await client.post(
        "/api/auth/register",
        json={"username": user1, "password": "pass1"},
    )
    resp1 = await client.post(
        "/api/auth/login",
        json={"username": user1, "password": "pass1"},
    )
    token1 = resp1.json()["access_token"]
    
    # Create word as user 1
    await client.post(
        "/api/words",
        json={"headword": "user1word", "pos": "noun", "meaningJa": "ユーザー1の単語"},
        headers={"Authorization": f"Bearer {token1}"}
    )
    
    # Register and login user 2
    user2 = unique_username()
    await client.post(
        "/api/auth/register",
        json={"username": user2, "password": "pass2"},
    )
    resp2 = await client.post(
        "/api/auth/login",
        json={"username": user2, "password": "pass2"},
    )
    token2 = resp2.json()["access_token"]
    
    # User 2 should have no words
    response = await client.get(
        "/api/words",
        headers={"Authorization": f"Bearer {token2}"}
    )
    data = response.json()
    assert len(data["words"]) == 0
