# tests/test_examples.py
"""Tests for example sentence test endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_next_example_no_words(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting next example when no words exist"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    response = await client.get("/api/examples/next", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["example"] is None


@pytest.mark.asyncio
async def test_next_example_no_examples(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting next example when words exist but have no examples"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word without examples
    await client.post(
        "/api/words",
        json={"headword": "test", "pos": "noun", "meaningJa": "テスト"},
        headers=headers
    )
    
    response = await client.get("/api/examples/next", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["example"] is None


@pytest.mark.asyncio
async def test_next_example_with_examples(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting next example when examples exist"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word with examples
    await client.post(
        "/api/words",
        json={
            "headword": "run",
            "pos": "verb",
            "meaningJa": "走る",
            "examples": [
                {"en": "I run every morning.", "ja": "毎朝走ります。"},
                {"en": "She runs fast.", "ja": "彼女は速く走る。"}
            ],
            "tags": ["sports"]
        },
        headers=headers
    )
    
    response = await client.get("/api/examples/next", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["example"] is not None
    example = data["example"]
    assert "en" in example
    assert "ja" in example
    assert example["en"] in ["I run every morning.", "She runs fast."]
    assert "word" in example
    assert example["word"]["headword"] == "run"
    assert example["word"]["pos"] == "verb"
    assert example["word"]["meaningJa"] == "走る"
    assert "sports" in example["word"]["tags"]


@pytest.mark.asyncio
async def test_next_example_filter_by_tags(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test filtering examples by tags"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words with different tags
    await client.post(
        "/api/words",
        json={
            "headword": "run",
            "pos": "verb",
            "meaningJa": "走る",
            "examples": [{"en": "I run every day.", "ja": "毎日走ります。"}],
            "tags": ["sports"]
        },
        headers=headers
    )
    
    await client.post(
        "/api/words",
        json={
            "headword": "study",
            "pos": "verb",
            "meaningJa": "勉強する",
            "examples": [{"en": "I study English.", "ja": "英語を勉強します。"}],
            "tags": ["education"]
        },
        headers=headers
    )
    
    # Filter by sports tag
    response = await client.get("/api/examples/next?tags=sports", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["example"] is not None
    assert data["example"]["word"]["headword"] == "run"
    assert "sports" in data["example"]["word"]["tags"]
    
    # Filter by education tag
    response = await client.get("/api/examples/next?tags=education", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["example"] is not None
    assert data["example"]["word"]["headword"] == "study"
    assert "education" in data["example"]["word"]["tags"]


@pytest.mark.asyncio
async def test_next_example_multiple_tags_filter(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test filtering by multiple tags (OR logic)"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words with different tags
    await client.post(
        "/api/words",
        json={
            "headword": "run",
            "pos": "verb",
            "meaningJa": "走る",
            "examples": [{"en": "I run daily.", "ja": "毎日走ります。"}],
            "tags": ["sports"]
        },
        headers=headers
    )
    
    await client.post(
        "/api/words",
        json={
            "headword": "study",
            "pos": "verb",
            "meaningJa": "勉強する",
            "examples": [{"en": "I study hard.", "ja": "一生懸命勉強します。"}],
            "tags": ["education"]
        },
        headers=headers
    )
    
    await client.post(
        "/api/words",
        json={
            "headword": "eat",
            "pos": "verb",
            "meaningJa": "食べる",
            "examples": [{"en": "I eat lunch.", "ja": "昼食を食べます。"}],
            "tags": ["food"]
        },
        headers=headers
    )
    
    # Filter by sports OR education tags - should get run or study, not eat
    seen_headwords = set()
    for _ in range(10):  # Try multiple times to get both
        response = await client.get(
            "/api/examples/next?tags=sports&tags=education",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["example"] is not None
        headword = data["example"]["word"]["headword"]
        seen_headwords.add(headword)
        assert headword in ["run", "study"], "Should only get words with sports or education tags"
    
    assert "eat" not in seen_headwords, "Should never get 'eat' with food tag"


@pytest.mark.asyncio
async def test_get_tags_no_examples(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting tags when no examples exist"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word without examples
    await client.post(
        "/api/words",
        json={"headword": "test", "pos": "noun", "meaningJa": "テスト", "tags": ["unused"]},
        headers=headers
    )
    
    response = await client.get("/api/examples/tags", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["tags"] == []


@pytest.mark.asyncio
async def test_get_tags_with_examples(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test getting tags from words with examples"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create words with examples
    await client.post(
        "/api/words",
        json={
            "headword": "run",
            "pos": "verb",
            "meaningJa": "走る",
            "examples": [{"en": "I run.", "ja": "走ります。"}],
            "tags": ["sports", "daily"]
        },
        headers=headers
    )
    
    await client.post(
        "/api/words",
        json={
            "headword": "study",
            "pos": "verb",
            "meaningJa": "勉強する",
            "examples": [{"en": "I study.", "ja": "勉強します。"}],
            "tags": ["education", "daily"]
        },
        headers=headers
    )
    
    # Word without examples - its tags should not appear
    await client.post(
        "/api/words",
        json={
            "headword": "test",
            "pos": "noun",
            "meaningJa": "テスト",
            "tags": ["unused"]
        },
        headers=headers
    )
    
    response = await client.get("/api/examples/tags", headers=headers)
    assert response.status_code == 200
    data = response.json()
    tags = data["tags"]
    
    # Should be sorted
    assert tags == sorted(tags)
    
    # Should include tags from words with examples
    assert "sports" in tags
    assert "education" in tags
    assert "daily" in tags
    
    # Should not include tags from words without examples
    assert "unused" not in tags


@pytest.mark.asyncio
async def test_next_example_with_inflections(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test examples with inflected word forms"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word with inflected forms in examples
    await client.post(
        "/api/words",
        json={
            "headword": "run",
            "pos": "verb",
            "meaningJa": "走る",
            "examples": [
                {"en": "He is running in the park.", "ja": "彼は公園で走っています。"},
                {"en": "I ran yesterday.", "ja": "昨日走りました。"},
                {"en": "She runs every day.", "ja": "彼女は毎日走ります。"}
            ],
            "tags": ["verb"]
        },
        headers=headers
    )
    
    response = await client.get("/api/examples/next", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["example"] is not None
    example = data["example"]
    assert example["word"]["headword"] == "run"
    assert example["en"] in [
        "He is running in the park.",
        "I ran yesterday.",
        "She runs every day."
    ]


@pytest.mark.asyncio
async def test_next_example_with_compound_words(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test examples with compound/multi-word expressions"""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word with compound expression
    await client.post(
        "/api/words",
        json={
            "headword": "check in",
            "pos": "verb",
            "meaningJa": "チェックインする",
            "examples": [
                {"en": "Please check in at the front desk.", "ja": "フロントでチェックインしてください。"},
                {"en": "I checked in online.", "ja": "オンラインでチェックインしました。"}
            ],
            "tags": ["travel"]
        },
        headers=headers
    )
    
    response = await client.get("/api/examples/next", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["example"] is not None
    example = data["example"]
    assert example["word"]["headword"] == "check in"
    assert "check in" in example["en"].lower() or "checked in" in example["en"].lower()


@pytest.mark.asyncio
async def test_next_example_requires_auth(client: AsyncClient):
    """Test that authentication is required"""
    response = await client.get("/api/examples/next")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_tags_requires_auth(client: AsyncClient):
    """Test that authentication is required for tags endpoint"""
    response = await client.get("/api/examples/tags")
    assert response.status_code == 401
