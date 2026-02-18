"""
Test error checking and validation for import
"""
import pytest
from httpx import AsyncClient
import json
import os


@pytest.mark.asyncio
async def test_import_with_invalid_pos(authenticated_client):
    """Test import with invalid pos values - should return 422 validation error"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Import with invalid pos
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "test",
                    "pos": "phrasal verb",  # Invalid!
                    "meaningJa": "テスト"
                }
            ]
        },
        headers=headers
    )
    
    print(f"\n=== Invalid pos Test ===")
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    print(f"Error details: {result.get('error', {})}")
    
    # Pydantic validation should catch invalid pos
    assert response.status_code == 422
    error_info = str(result).lower()
    assert "validation" in error_info or "error" in error_info


@pytest.mark.asyncio
async def test_import_missing_required_fields(authenticated_client):
    """Test import with missing required fields - should return 422"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Missing meaningJa (required field)
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "test",
                    "pos": "noun"
                    # Missing meaningJa!
                }
            ]
        },
        headers=headers
    )
    
    print(f"\n=== Missing meaningJa Test ===")
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    # Should return 422 for missing required field
    assert response.status_code == 422
    # Error should mention missing or validation
    error_info = str(result).lower()
    assert "validation" in error_info or "error" in error_info


@pytest.mark.asyncio
async def test_import_with_duplicate_headwords(authenticated_client):
    """Test import with duplicate headwords (should warn but allow)"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Import with duplicate headwords
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "test",
                    "pos": "noun",
                    "meaningJa": "テスト1"
                },
                {
                    "headword": "test",
                    "pos": "verb",
                    "meaningJa": "テスト2"
                }
            ]
        },
        headers=headers
    )
    
    print(f"\n=== Duplicate Headwords Test ===")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Should succeed (warnings don't block import)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_import_valid_data(authenticated_client):
    """Test import with valid data"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Valid import
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "apple",
                    "pos": "noun",
                    "meaningJa": "りんご",
                    "examples": [
                        {
                            "en": "I like apples",
                            "ja": "私りんごが好きです"
                        }
                    ]
                },
                {
                    "headword": "beautiful",
                    "pos": "adj",
                    "meaningJa": "美しい",
                    "tags": ["adjective", "appearance"]
                }
            ]
        },
        headers=headers
    )
    
    print(f"\n=== Valid Data Test ===")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    assert response.status_code == 200
    assert response.json()["ok"] == True


@pytest.mark.asyncio
async def test_import_multiple_errors(authenticated_client):
    """Test import with multiple errors - should return 422"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Import with multiple errors
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "word1",
                    "pos": "invalid_pos",  # Error 1
                    "meaningJa": "意味1"
                },
                {
                    "headword": "word2",
                    "pos": "noun"
                    # Error 2: missing meaningJa
                },
                {
                    "headword": "word3",
                    "pos": "adjective",  # Error 3: should be "adj"
                    "meaningJa": "意味3"
                }
            ]
        },
        headers=headers
    )
    
    print(f"\n=== Multiple Errors Test ===")
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    # Should return 422 with validation errors
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_import_missing_example_english(authenticated_client):
    """Test import with missing English in example - should return 422"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "test",
                    "pos": "noun",
                    "meaningJa": "テスト",
                    "examples": [
                        {
                            "ja": "テスト"
                            # Missing "en"!
                        }
                    ]
                }
            ]
        },
        headers=headers
    )
    
    print(f"\n=== Missing Example English Test ===")
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    # Should return 422 for missing required example field
    assert response.status_code == 422
    error_info = str(result).lower()
    assert "validation" in error_info or "error" in error_info
