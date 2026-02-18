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

@pytest.mark.asyncio
async def test_import_minimal_manual_file(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing from a manually-created file with minimal required fields (no IDs or timestamps)."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Minimal import data (no id, createdAt, updatedAt, or exportedAt)
    minimal_import = {
        "schemaVersion": 1,
        "words": [
            {
                "headword": "manual",
                "pos": "noun",
                "meaningJa": "手動作成",
                "examples": [],
                "tags": ["manual"],
            }
        ],
        "memory": [],
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=minimal_import,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify word was imported with auto-generated ID
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["headword"] == "manual"
    assert words[0]["id"]  # ID should be auto-generated


@pytest.mark.asyncio
async def test_import_partial_data(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing data with some fields optional (e.g., ID provided but timestamps not)."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Partial import data (id provided, but createdAt/updatedAt not)
    partial_import = {
        "schemaVersion": 1,
        "words": [
            {
                "id": "custom-id-123",
                "headword": "partial",
                "pos": "verb",
                "meaningJa": "部分的",
                "examples": [
                    {
                        "en": "This is a partial example.",
                        "ja": "これは部分的な例です。"
                    }
                ],
                "tags": [],
            }
        ],
        "memory": [],
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=partial_import,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify word was imported with provided ID
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["headword"] == "partial"
    assert words[0]["id"] == "custom-id-123"
    # Timestamps should be auto-generated
    assert words[0]["createdAt"]
    assert words[0]["updatedAt"]
    # Example ID should be auto-generated
    assert len(words[0]["examples"]) == 1
    assert words[0]["examples"][0]["id"]


@pytest.mark.asyncio
async def test_import_overwrite_with_manual_file(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test overwrite mode with manually-created file."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create initial data
    await client.post(
        "/api/words",
        json={"headword": "existing", "pos": "noun", "meaningJa": "既存"},
        headers=headers
    )
    
    # Overwrite with minimal import data
    minimal_import = {
        "schemaVersion": 1,
        "words": [
            {
                "headword": "replaced",
                "pos": "adj",
                "meaningJa": "置き換え",
                "examples": [],
                "tags": [],
            }
        ],
        "memory": [],
    }
    
    response = await client.post(
        "/api/io/import?mode=overwrite",
        json=minimal_import,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify data was overwritten
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["headword"] == "replaced"


@pytest.mark.asyncio
async def test_export_with_examples_and_tags(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test exporting words with examples and tags."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word with examples and tags
    create_response = await client.post(
        "/api/words",
        json={
            "headword": "complex",
            "pos": "adj",
            "meaningJa": "複雑な",
            "pronunciation": "/kəmˈplɛks/",
            "examples": [
                {"en": "This is a complex problem.", "ja": "これは複雑な問題です。"},
                {"en": "The system is complex.", "ja": "そのシステムは複雑です。"}
            ],
            "tags": ["advanced", "important"]
        },
        headers=headers
    )
    assert create_response.status_code == 200
    
    # Export and verify
    response = await client.get("/api/io/export", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["words"]) == 1
    word = data["words"][0]
    assert word["headword"] == "complex"
    assert word["pronunciation"] == "/kəmˈplɛks/"
    assert len(word["examples"]) == 2
    assert word["tags"] == ["advanced", "important"]


@pytest.mark.asyncio
async def test_import_multiple_words_with_examples(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing multiple words with examples."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "headword": "create",
                "pos": "verb",
                "meaningJa": "作成する",
                "examples": [
                    {"en": "Create a new file.", "ja": "新しいファイルを作成してください。"}
                ],
                "tags": ["verb"]
            },
            {
                "headword": "delete",
                "pos": "verb",
                "meaningJa": "削除する",
                "examples": [
                    {"en": "Delete old files.", "ja": "古いファイルを削除します。"}
                ],
                "tags": ["verb"]
            },
            {
                "headword": "update",
                "pos": "verb",
                "meaningJa": "更新する",
                "examples": [
                    {"en": "Update the system.", "ja": "システムを更新します。"}
                ],
                "tags": ["verb", "important"]
            }
        ],
        "memory": []
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify all words imported
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 3
    
    headwords = {w["headword"] for w in words}
    assert headwords == {"create", "delete", "update"}
    
    # Verify examples
    for word in words:
        assert len(word["examples"]) == 1


@pytest.mark.asyncio
async def test_import_export_roundtrip(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test export → import → export produces consistent data."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create initial data
    create_response = await client.post(
        "/api/words",
        json={
            "headword": "test",
            "pos": "noun",
            "meaningJa": "テスト",
            "pronunciation": "/tɛst/",
            "examples": [{"en": "This is a test.", "ja": "これはテストです。"}],
            "tags": ["exam"],
            "memo": "Important for study"
        },
        headers=headers
    )
    assert create_response.status_code == 200
    word_id = create_response.json()["word"]["id"]
    
    # Grade to create memory
    await client.post(
        "/api/study/grade",
        json={"wordId": word_id, "rating": "good"},
        headers=headers
    )
    
    # Export
    export_response = await client.get("/api/io/export", headers=headers)
    export_data = export_response.json()
    
    # Import back (overwrite)
    import_response = await client.post(
        "/api/io/import?mode=overwrite",
        json=export_data,
        headers=headers
    )
    assert import_response.status_code == 200
    
    # Export again and compare structure
    export_response2 = await client.get("/api/io/export", headers=headers)
    export_data2 = export_response2.json()
    
    # Verify core structure consistency
    assert len(export_data2["words"]) == len(export_data["words"])
    assert len(export_data2["memory"]) == len(export_data["memory"])
    
    if export_data["words"]:
        word1 = export_data["words"][0]
        word2 = export_data2["words"][0]
        assert word1["headword"] == word2["headword"]
        assert word1["pos"] == word2["pos"]
        assert word1["meaningJa"] == word2["meaningJa"]


@pytest.mark.asyncio
async def test_import_with_memory_states(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing words with memory states."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "id": "word-with-memory",
                "headword": "study",
                "pos": "verb",
                "meaningJa": "勉強する",
                "examples": [],
                "tags": []
            }
        ],
        "memory": [
            {
                "wordId": "word-with-memory",
                "dueAt": "2026-03-01T00:00:00Z",
                "memoryLevel": 2,
                "ease": 2.8,
                "intervalDays": 7,
                "reviewCount": 3,
                "lapseCount": 0,
                "lastRating": "good",
                "lastReviewedAt": "2026-02-15T00:00:00Z"
            }
        ]
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    
    # Verify word and memory imported
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["id"] == "word-with-memory"
    
    # Export to verify memory
    export_response = await client.get("/api/io/export", headers=headers)
    export_data = export_response.json()
    assert len(export_data["memory"]) == 1
    memory = export_data["memory"][0]
    assert memory["wordId"] == "word-with-memory"
    assert memory["memoryLevel"] == 2
    assert memory["reviewCount"] == 3


@pytest.mark.asyncio
async def test_import_invalid_schema_version(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing with unsupported schema version."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    invalid_import = {
        "schemaVersion": 999,  # Unsupported version
        "words": [],
        "memory": []
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=invalid_import,
        headers=headers
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_import_merge_preserves_existing_data(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test that merge mode preserves existing words not in import."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create three words
    word_ids = []
    for headword in ["alpha", "beta", "gamma"]:
        response = await client.post(
            "/api/words",
            json={"headword": headword, "pos": "noun", "meaningJa": f"{headword}意味"},
            headers=headers
        )
        word_ids.append(response.json()["word"]["id"])
    
    # Import one new word in merge mode
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "headword": "delta",
                "pos": "noun",
                "meaningJa": "デルタ",
                "examples": [],
                "tags": []
            }
        ],
        "memory": []
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    
    # Verify all 4 words exist
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 4
    headwords = {w["headword"] for w in words}
    assert headwords == {"alpha", "beta", "gamma", "delta"}


@pytest.mark.asyncio
async def test_import_with_duplicates_in_batch(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test importing multiple words with custom IDs to avoid collisions."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "id": "batch-001",
                "headword": "batch1",
                "pos": "noun",
                "meaningJa": "バッチ1",
                "examples": [],
                "tags": []
            },
            {
                "id": "batch-002",
                "headword": "batch2",
                "pos": "noun",
                "meaningJa": "バッチ2",
                "examples": [],
                "tags": []
            },
            {
                "id": "batch-003",
                "headword": "batch3",
                "pos": "noun",
                "meaningJa": "バッチ3",
                "examples": [],
                "tags": []
            }
        ],
        "memory": []
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    
    # Verify all imported with correct IDs
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 3
    
    ids = {w["id"] for w in words}
    assert ids == {"batch-001", "batch-002", "batch-003"}


@pytest.mark.asyncio
async def test_export_empty_memory(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test exporting words without memory states."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create word without grading (no memory state)
    await client.post(
        "/api/words",
        json={"headword": "ungraded", "pos": "noun", "meaningJa": "採点されていない"},
        headers=headers
    )
    
    # Export
    response = await client.get("/api/io/export", headers=headers)
    data = response.json()
    
    assert len(data["words"]) == 1
    assert len(data["memory"]) == 0  # No memory state for ungraded word


@pytest.mark.asyncio
async def test_import_preserves_memo_field(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test that memo field is preserved during import/export."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    memo_text = "This is an important word to remember!"
    
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "headword": "memorable",
                "pos": "adj",
                "meaningJa": "記憶に値する",
                "memo": memo_text,
                "examples": [],
                "tags": ["important"]
            }
        ],
        "memory": []
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    
    # Verify memo preserved
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["memo"] == memo_text


@pytest.mark.asyncio
async def test_import_merge_with_timestamp_comparison(authenticated_client: tuple[AsyncClient, dict, str]):
    """Test merge mode uses updatedAt for conflict resolution."""
    client, _, access_token = authenticated_client
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create a word
    create_response = await client.post(
        "/api/words",
        json={"headword": "original", "pos": "noun", "meaningJa": "元"},
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    # Try to merge with newer version
    newer_timestamp = "2099-01-01T00:00:00Z"
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "id": word_id,
                "headword": "updated",
                "pos": "verb",
                "meaningJa": "最新版",
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": newer_timestamp,
                "examples": [],
                "tags": []
            }
        ],
        "memory": []
    }
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    assert response.status_code == 200
    
    # Verify newer version was used
    words_response = await client.get("/api/words", headers=headers)
    words = words_response.json()["words"]
    assert len(words) == 1
    assert words[0]["headword"] == "updated"
    assert words[0]["meaningJa"] == "最新版"