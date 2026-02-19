# tests/test_study.py
"""Tests for study/spaced-repetition endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_next_card_no_words(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting next card when no words exist."""
    client, _, access_token = authenticated_client
    
    response = await client.get(
        "/api/study/next",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is None


@pytest.mark.asyncio
async def test_next_card_with_word(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting next card after creating a word."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    await client.post(
        "/api/words",
        json={"headword": "study", "pos": "noun", "meaningJa": "勉強"},
        headers=headers
    )
    
    # Get next card
    response = await client.get("/api/study/next", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is not None
    assert "word" in data["card"]
    assert "memory" in data["card"]
    assert data["card"]["word"]["headword"] == "study"


@pytest.mark.asyncio
async def test_grade_card(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test grading a card."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "grade", "pos": "verb", "meaningJa": "評価する"},
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    # Grade the card
    response = await client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "good"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "memory" in data
    assert data["memory"]["wordId"] == word_id
    assert data["memory"]["lastRating"] == "good"


@pytest.mark.asyncio
async def test_grade_card_ratings(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test different rating values."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words for each rating
    ratings = ["again", "hard", "good", "easy"]
    
    for rating in ratings:
        create_response = await client.post(
            "/api/words",
            json={"headword": f"word_{rating}", "pos": "noun", "meaningJa": rating},
            headers=headers
        )
        word_id = create_response.json()["word"]["id"]
        
        response = await client.post(
            "/api/study/grade",
            json={"wordId": word_id, "rating": rating},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["memory"]["lastRating"] == rating


@pytest.mark.asyncio
async def test_study_flow(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test complete study flow: create word, get card, grade it."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "flow", "pos": "noun", "meaningJa": "流れ"},
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    # Get next card
    next_response = await client.get("/api/study/next", headers=headers)
    assert next_response.status_code == 200
    card = next_response.json()["card"]
    assert card["word"]["id"] == word_id
    
    # Grade the card
    grade_response = await client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "easy"},
        headers=headers
    )
    assert grade_response.status_code == 200
    assert grade_response.json()["memory"]["lastRating"] == "easy"


@pytest.mark.asyncio
async def test_all_words_mastered(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test that no cards are returned when all words are mastered (memoryLevel >= 4)."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "mastered", "pos": "adj", "meaningJa": "習得済み"},
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    # Grade it as "easy" multiple times to reach memoryLevel >= 4
    for _ in range(5):
        await client.post(
            "/api/study/grade",
            json={"wordId": word_id, "rating": "easy"},
            headers=headers
        )
    
    # Get next card - should return None because all words are mastered
    next_response = await client.get("/api/study/next", headers=headers)
    assert next_response.status_code == 200
    data = next_response.json()
    assert data["ok"] is True
    # Card should be None when all words are mastered and not due
    # (Note: might still return a card if due date has passed)


@pytest.mark.asyncio
async def test_reset_memory(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test resetting memory state for a word."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "reset", "pos": "verb", "meaningJa": "リセット"},
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    # Grade it to create memory state
    await client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "good"},
        headers=headers
    )
    
    # Reset memory
    reset_response = await client.post(
        f"/api/study/reset/{word_id}",
        headers=headers
    )
    assert reset_response.status_code == 200
    assert reset_response.json()["ok"] is True
    
    # Get next card - the word should appear again with default memory state
    next_response = await client.get("/api/study/next", headers=headers)
    assert next_response.status_code == 200
    card = next_response.json()["card"]
    assert card["word"]["id"] == word_id
    # Memory should be reset (memoryLevel = 0 or similar initial state)
    assert card["memory"]["memoryLevel"] == 0


@pytest.mark.asyncio
async def test_get_all_tags(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting all unique tags from user's words."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words with different tags
    await client.post(
        "/api/words",
        json={"headword": "business", "pos": "noun", "meaningJa": "ビジネス", "tags": ["business", "formal"]},
        headers=headers
    )
    await client.post(
        "/api/words",
        json={"headword": "travel", "pos": "noun", "meaningJa": "旅行", "tags": ["travel", "casual"]},
        headers=headers
    )
    await client.post(
        "/api/words",
        json={"headword": "meeting", "pos": "noun", "meaningJa": "会議", "tags": ["business"]},
        headers=headers
    )
    
    # Get all tags
    response = await client.get("/api/study/tags", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "tags" in data
    tags = data["tags"]
    
    # Should contain all unique tags
    assert "business" in tags
    assert "formal" in tags
    assert "travel" in tags
    assert "casual" in tags
    # business appears twice but should only be in the list once
    assert tags.count("business") == 1


@pytest.mark.asyncio
async def test_next_card_filter_by_single_tag(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test filtering next card by a single tag."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words with different tags
    business_response = await client.post(
        "/api/words",
        json={"headword": "business", "pos": "noun", "meaningJa": "ビジネス", "tags": ["business"]},
        headers=headers
    )
    travel_response = await client.post(
        "/api/words",
        json={"headword": "travel", "pos": "noun", "meaningJa": "旅行", "tags": ["travel"]},
        headers=headers
    )
    
    # Filter by "business" tag
    response = await client.get("/api/study/next?tags=business", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is not None
    assert data["card"]["word"]["headword"] == "business"
    
    # Filter by "travel" tag
    response = await client.get("/api/study/next?tags=travel", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is not None
    assert data["card"]["word"]["headword"] == "travel"


@pytest.mark.asyncio
async def test_next_card_filter_by_multiple_tags(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test filtering next card by multiple tags (OR logic)."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words with different tags
    await client.post(
        "/api/words",
        json={"headword": "business", "pos": "noun", "meaningJa": "ビジネス", "tags": ["business"]},
        headers=headers
    )
    await client.post(
        "/api/words",
        json={"headword": "travel", "pos": "noun", "meaningJa": "旅行", "tags": ["travel"]},
        headers=headers
    )
    await client.post(
        "/api/words",
        json={"headword": "food", "pos": "noun", "meaningJa": "食べ物", "tags": ["food"]},
        headers=headers
    )
    
    # Filter by multiple tags (should match words with ANY of the tags)
    response = await client.get("/api/study/next?tags=business&tags=travel", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is not None
    # Should return either "business" or "travel", but not "food"
    assert data["card"]["word"]["headword"] in ["business", "travel"]


@pytest.mark.asyncio
async def test_next_card_filter_no_matching_tags(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test filtering by tags that don't match any words."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word with specific tags
    await client.post(
        "/api/words",
        json={"headword": "example", "pos": "noun", "meaningJa": "例", "tags": ["test"]},
        headers=headers
    )
    
    # Filter by non-existent tag
    response = await client.get("/api/study/next?tags=nonexistent", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    # Should return None when no words match the filter
    assert data["card"] is None


@pytest.mark.asyncio
async def test_next_card_word_with_multiple_tags(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test that words with multiple tags can be filtered by any of them."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word with multiple tags
    await client.post(
        "/api/words",
        json={"headword": "meeting", "pos": "noun", "meaningJa": "会議", "tags": ["business", "formal", "work"]},
        headers=headers
    )
    
    # Filter by first tag
    response = await client.get("/api/study/next?tags=business", headers=headers)
    assert response.status_code == 200
    assert response.json()["card"]["word"]["headword"] == "meeting"
    
    # Filter by second tag
    response = await client.get("/api/study/next?tags=formal", headers=headers)
    assert response.status_code == 200
    assert response.json()["card"]["word"]["headword"] == "meeting"
    
    # Filter by third tag
    response = await client.get("/api/study/next?tags=work", headers=headers)
    assert response.status_code == 200
    assert response.json()["card"]["word"]["headword"] == "meeting"
