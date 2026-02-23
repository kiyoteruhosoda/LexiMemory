"""
Diagnostic tests for import functionality - identify why UI doesn't show imported words
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_import_merge_with_empty_existing_words(authenticated_client):
    """Test importing new words to user with no existing words"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # User starts with no words
    words_before = await client.get("/api/words", headers=headers)
    print(f"\n=== Before Import ===")
    print(f"Words count: {len(words_before.json()['words'])}")
    assert len(words_before.json()['words']) == 0
    
    # Import minimal data
    import_response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "new_word_1",
                    "pos": "noun",
                    "meaningJa": "新しい単語1"
                }
            ]
        },
        headers=headers
    )
    print(f"\n=== Import Response ===")
    print(f"Status: {import_response.status_code}")
    print(f"Body: {import_response.json()}")
    assert import_response.status_code == 200
    
    # Check words after import
    words_after = await client.get("/api/words", headers=headers)
    print(f"\n=== After Import ===")
    print(f"Words count: {len(words_after.json()['words'])}")
    for w in words_after.json()['words']:
        print(f"  - {w['headword']} (id: {w['id']})")
    
    assert len(words_after.json()['words']) == 1
    assert words_after.json()['words'][0]['headword'] == "new_word_1"


@pytest.mark.asyncio
async def test_import_merge_duplicate_detection(authenticated_client):
    """Test importing with explicit IDs - should merge if ID exists"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create initial word
    create_response = await client.post(
        "/api/words",
        json={
            "headword": "existing",
            "pos": "noun",
            "meaningJa": "既存の単語"
        },
        headers=headers
    )
    existing_id = create_response.json()['word']['id']
    existing_timestamp = create_response.json()['word']['updatedAt']
    print(f"\n=== Created Word ===")
    print(f"ID: {existing_id}")
    print(f"Updated: {existing_timestamp}")
    
    # Try to import with same ID (older timestamp)
    import_old = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "id": existing_id,
                    "headword": "different",
                    "pos": "verb",
                    "meaningJa": "違う単語",
                    "createdAt": "2025-01-01T00:00:00Z",
                    "updatedAt": "2025-01-01T00:00:00Z"  # OLD timestamp
                }
            ]
        },
        headers=headers
    )
    print(f"\n=== Import Old Timestamp ===")
    print(f"Status: {import_old.status_code}")
    
    # Check - older imported data should not override newer existing data
    words = await client.get("/api/words", headers=headers)
    print(f"Words count: {len(words.json()['words'])}")
    print(f"Headword: {words.json()['words'][0]['headword']}")
    assert words.json()['words'][0]['headword'] == "existing"
    
    # Try to import with same ID (newer timestamp)
    import_new = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "id": existing_id,
                    "headword": "updated",
                    "pos": "verb",
                    "meaningJa": "更新された単語",
                    "createdAt": "2025-01-01T00:00:00Z",
                    "updatedAt": "2099-01-01T00:00:00Z"  # NEWER timestamp
                }
            ]
        },
        headers=headers
    )
    print(f"\n=== Import New Timestamp ===")
    print(f"Status: {import_new.status_code}")
    
    # Check - should have been updated
    words = await client.get("/api/words", headers=headers)
    print(f"Words count: {len(words.json()['words'])}")
    print(f"Headword: {words.json()['words'][0]['headword']}")
    assert words.json()['words'][0]['headword'] == "updated"


@pytest.mark.asyncio
async def test_import_with_memory_states_only(authenticated_client):
    """Test importing memory states without new words"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create initial word
    create_response = await client.post(
        "/api/words",
        json={
            "headword": "test",
            "pos": "noun",
            "meaningJa": "テスト"
        },
        headers=headers
    )
    word_id = create_response.json()['word']['id']
    
    # Import only memory state (no new words)
    import_response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [],  # NO NEW WORDS
            "memory": [
                {
                    "wordId": word_id,
                    "dueAt": "2099-01-01T00:00:00Z",
                    "memoryLevel": 3,
                    "ease": 2.5,
                    "intervalDays": 10,
                    "reviewCount": 5
                }
            ]
        },
        headers=headers
    )
    print(f"\n=== Import Memory Only ===")
    print(f"Status: {import_response.status_code}")
    assert import_response.status_code == 200
    
    # Check - word count should not increase
    words = await client.get("/api/words", headers=headers)
    print(f"Words count: {len(words.json()['words'])}")
    assert len(words.json()['words']) == 1
    
    # Memory should be imported
    print(f"Memory states: {words.json()['memoryMap']}")
    assert word_id in words.json()['memoryMap']


@pytest.mark.asyncio
async def test_import_validation_error_response(client):
    """Test what happens when import data is invalid"""
    # Create and auth a user first
    username = "test_user"
    password = "testpass"
    
    register = await client.post(
        "/api/auth/register",
        json={"username": username, "password": password}
    )
    assert register.status_code == 200
    
    login = await client.post(
        "/api/auth/login",
        json={"username": username, "password": password}
    )
    token = login.json()['access_token']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to import invalid data
    invalid_imports = [
        ({"schemaVersion": 2}, "Wrong schema version"),  # Wrong version -> 400
        ({"schemaVersion": 1, "words": [{"headword": "test"}]}, "Missing required fields"),  # Missing meaningJa and pos -> 422
        ({"schemaVersion": 1, "words": [{"pos": "noun", "meaningJa": "意味"}]}, "Missing headword"),  # Missing headword -> 422
    ]
    
    for invalid_data, description in invalid_imports:
        response = await client.post(
            "/api/io/import?mode=merge",
            json=invalid_data,
            headers=headers
        )
        print(f"\n=== Invalid Import Test: {description} ===")
        print(f"Data: {invalid_data}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json() if response.status_code in [400, 422] else response.json()}")
        
        # Should either be 400 (bad schema) or 422 (validation error)
        assert response.status_code in [400, 422], f"Expected 400 or 422 for '{description}', got {response.status_code}"

