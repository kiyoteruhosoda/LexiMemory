"""
Debug test for import endpoint to understand request body issue
"""
import pytest
from httpx import AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_import_request_body_logging(authenticated_client):
    """Test to verify request body is properly handled in import"""
    # Use the test app
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Prepare minimal import data
    import_data = {
        "schemaVersion": 1,
        "words": [
            {
                "headword": "debug_test",
                "pos": "noun",
                "meaningJa": "デバッグテスト"
            }
        ],
        "memory": []
    }
    
    # Log the data being sent
    import json
    print(f"\n=== Import Request ===")
    print(f"Method: POST")
    print(f"URL: /api/io/import?mode=merge")
    print(f"Headers: Content-Type: application/json, Authorization: Bearer {token[:20]}...")
    print(f"Body:\n{json.dumps(import_data, indent=2)}")
    print(f"Body length: {len(json.dumps(import_data))} bytes")
    
    # Send the import request
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    
    print(f"\n=== Import Response ===")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert response.json() == {"ok": True}
    
    # Verify words were imported
    words_response = await client.get(
        "/api/words",
        headers=headers
    )
    words_data = words_response.json()
    
    print(f"\n=== Words After Import ===")
    print(f"Total words: {len(words_data['words'])}")
    for w in words_data['words']:
        print(f"  - {w['headword']} (id: {w['id']}, meaningJa: {w['meaningJa']})")
    
    # Verify the word was added
    assert any(w["headword"] == "debug_test" for w in words_data["words"]), \
        f"debug_test word not found in imported words. Words: {[w['headword'] for w in words_data['words']]}"


@pytest.mark.asyncio
async def test_import_with_auth_issue(client):
    """Test import endpoint when auth might fail"""
    import_data = {"schemaVersion": 1, "words": [], "memory": []}
    
    # Test without auth
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data
    )
    print(f"\n=== Import without auth ===")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json() if response.status_code != 401 else 'Unauthorized'}")
    
    assert response.status_code == 401


@pytest.mark.asyncio  
async def test_import_empty_body(authenticated_client):
    """Test what happens if import body is empty"""
    client, user_info, token = authenticated_client
