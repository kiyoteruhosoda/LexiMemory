# tests/test_study.py
"""Tests for study/spaced-repetition endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_next_card_no_words(authenticated_client: tuple[TestClient, dict]):
    """Test getting next card when no words exist."""
    client, _ = authenticated_client
    
    response = client.get("/api/study/next")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is None


def test_next_card_with_word(authenticated_client: tuple[TestClient, dict]):
    """Test getting next card after creating a word."""
    client, _ = authenticated_client
    
    # Create a word
    client.post(
        "/api/words",
        json={"headword": "study", "pos": "noun", "meaningJa": "勉強"},
    )
    
    # Get next card
    response = client.get("/api/study/next")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["card"] is not None
    assert "word" in data["card"]
    assert "memory" in data["card"]
    assert data["card"]["word"]["headword"] == "study"


def test_grade_card(authenticated_client: tuple[TestClient, dict]):
    """Test grading a card."""
    client, _ = authenticated_client
    
    # Create a word
    create_response = client.post(
        "/api/words",
        json={"headword": "grade", "pos": "verb", "meaningJa": "評価する"},
    )
    word_id = create_response.json()["word"]["id"]
    
    # Grade the card
    response = client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "good"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "memory" in data
    assert data["memory"]["wordId"] == word_id
    assert data["memory"]["lastRating"] == "good"


def test_grade_card_ratings(authenticated_client: tuple[TestClient, dict]):
    """Test different rating values."""
    client, _ = authenticated_client
    
    # Create words for each rating
    ratings = ["again", "hard", "good", "easy"]
    
    for rating in ratings:
        create_response = client.post(
            "/api/words",
            json={"headword": f"word_{rating}", "pos": "noun", "meaningJa": rating},
        )
        word_id = create_response.json()["word"]["id"]
        
        response = client.post(
            "/api/study/grade",
            json={"wordId": word_id, "rating": rating},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["memory"]["lastRating"] == rating


def test_study_flow(authenticated_client: tuple[TestClient, dict]):
    """Test complete study flow: create word, get card, grade it."""
    client, _ = authenticated_client
    
    # Create a word
    create_response = client.post(
        "/api/words",
        json={"headword": "flow", "pos": "noun", "meaningJa": "流れ"},
    )
    word_id = create_response.json()["word"]["id"]
    
    # Get next card
    next_response = client.get("/api/study/next")
    assert next_response.status_code == 200
    card = next_response.json()["card"]
    assert card["word"]["id"] == word_id
    
    # Grade the card
    grade_response = client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "easy"},
    )
    assert grade_response.status_code == 200
    assert grade_response.json()["memory"]["lastRating"] == "easy"
