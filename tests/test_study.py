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
