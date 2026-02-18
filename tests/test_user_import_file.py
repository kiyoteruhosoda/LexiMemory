"""
Test import with the user's actual file
"""
import pytest
from httpx import AsyncClient
import json


@pytest.mark.asyncio
async def test_import_user_file(authenticated_client):
    """Test importing the user's actual file"""
    client, user_info, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Load user's file
    with open('data/No Title3_20260218_185432.txt', 'r') as f:
        import_data = json.load(f)
    
    print(f"\n=== User File Import Test ===")
    print(f"File has {len(import_data['words'])} words")
    
    # Get initial word count
    before = await client.get("/api/words", headers=headers)
    before_count = len(before.json()['words'])
    print(f"Words before import: {before_count}")
    
    # Import
    response = await client.post(
        "/api/io/import?mode=merge",
        json=import_data,
        headers=headers
    )
    
    print(f"Import response status: {response.status_code}")
    print(f"Import response: {response.json()}")
    assert response.status_code == 200
    
    # Get final word count
    after = await client.get("/api/words", headers=headers)
    after_count = len(after.json()['words'])
    print(f"Words after import: {after_count}")
    
    # Check for duplicate headwords
    all_words = after.json()['words']
    headwords = [w['headword'] for w in all_words]
    duplicates = {hw: count for hw, count in {h: headwords.count(h) for h in set(headwords)}.items() if count > 1}
    
    print(f"\n=== Results ===")
    print(f"Words added: {after_count - before_count}")
    if duplicates:
        print(f"Duplicate headwords in database: {duplicates}")
    
    # List first 10 words
    print(f"\nFirst 10 imported words:")
    for i, w in enumerate(all_words[:10]):
        print(f"  {i+1}. {w['headword']} ({w['pos']})")
    
    # Specific check: chart and colleague should be there
    assert any(w['headword'] == 'chart' for w in all_words), "chart not found"
    assert any(w['headword'] == 'colleague' for w in all_words), "colleague not found"
    assert any(w['headword'] == 'afford' for w in all_words), "afford not found"
    
    print(f"\n✅ Core words found successfully")
