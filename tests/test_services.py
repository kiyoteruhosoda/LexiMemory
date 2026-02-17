# tests/test_services.py
"""
Unit tests for service layer functions.
"""

import pytest
from pathlib import Path
from app import services, storage


@pytest.mark.asyncio
async def test_register_user(temp_data_dir: Path):
    """Test user registration"""
    username = "testuser"
    password = "testpass123"
    
    user = services.register_user(username, password)
    
    assert user["username"] == username
    assert "userId" in user
    assert "passwordHash" in user
    assert user["passwordHash"] != password  # Should be hashed
    assert user["roles"] == ["user"]
    assert user["disabled"] is False
    
    # Verify user files were created
    user_dir = storage.user_dir(user["userId"])
    assert user_dir.exists()
    assert (user_dir / "words.json").exists()
    assert (user_dir / "memory.json").exists()


@pytest.mark.asyncio
async def test_register_duplicate_username(temp_data_dir: Path):
    """Test that duplicate username registration fails"""
    username = "testuser"
    password = "testpass123"
    
    services.register_user(username, password)
    
    # Try to register again with same username
    with pytest.raises(ValueError, match="username already exists"):
        services.register_user(username, "different_password")


@pytest.mark.asyncio
async def test_authenticate_success(temp_data_dir: Path):
    """Test successful authentication"""
    username = "testuser"
    password = "testpass123"
    
    registered_user = services.register_user(username, password)
    
    authenticated_user = services.authenticate(username, password)
    
    assert authenticated_user is not None
    assert authenticated_user["userId"] == registered_user["userId"]
    assert authenticated_user["username"] == username


@pytest.mark.asyncio
async def test_authenticate_wrong_password(temp_data_dir: Path):
    """Test authentication fails with wrong password"""
    username = "testuser"
    password = "testpass123"
    
    services.register_user(username, password)
    
    result = services.authenticate(username, "wrongpassword")
    
    assert result is None


@pytest.mark.asyncio
async def test_authenticate_nonexistent_user(temp_data_dir: Path):
    """Test authentication fails for non-existent user"""
    result = services.authenticate("nonexistent", "password")
    
    assert result is None


@pytest.mark.asyncio
async def test_delete_user(temp_data_dir: Path):
    """Test user deletion"""
    username = "testuser"
    password = "testpass123"
    
    user = services.register_user(username, password)
    user_id = user["userId"]
    user_dir = storage.user_dir(user_id)
    
    # Verify user and directory exist
    assert services.find_user_by_id(user_id) is not None
    assert user_dir.exists()
    
    # Delete user
    services.delete_user(user_id)
    
    # Verify user and directory are gone
    assert services.find_user_by_id(user_id) is None
    assert not user_dir.exists()


@pytest.mark.asyncio
async def test_find_user_by_username(temp_data_dir: Path):
    """Test finding user by username"""
    username = "testuser"
    password = "testpass123"
    
    registered_user = services.register_user(username, password)
    
    found_user = services.find_user_by_username(username)
    
    assert found_user is not None
    assert found_user["userId"] == registered_user["userId"]
    assert found_user["username"] == username


@pytest.mark.asyncio
async def test_find_user_by_id(temp_data_dir: Path):
    """Test finding user by ID"""
    username = "testuser"
    password = "testpass123"
    
    registered_user = services.register_user(username, password)
    user_id = registered_user["userId"]
    
    found_user = services.find_user_by_id(user_id)
    
    assert found_user is not None
    assert found_user["userId"] == user_id
    assert found_user["username"] == username


@pytest.mark.asyncio
async def test_upsert_word(temp_data_dir: Path):
    """Test word creation and update"""
    username = "testuser"
    password = "testpass123"
    
    user = services.register_user(username, password)
    user_id = user["userId"]
    
    from app.models import WordEntry
    from datetime import datetime, timezone
    
    # Create word
    word = WordEntry(
        id="1",
        headword="test",
        pos="noun",
        meaningJa="テスト",
        examples=[],
        tags=[],
        memo=None,
        pronunciation=None,
        createdAt=datetime.now(timezone.utc).isoformat(),
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )
    
    services.upsert_word(user_id, word)
    
    # Verify word was created
    words = services.list_words(user_id)
    assert len(words) == 1
    assert words[0].headword == "test"
    
    # Update word
    word.meaningJa = "テスト更新"
    services.upsert_word(user_id, word)
    
    # Verify word was updated
    words = services.list_words(user_id)
    assert len(words) == 1
    assert words[0].meaningJa == "テスト更新"


@pytest.mark.asyncio
async def test_delete_word(temp_data_dir: Path):
    """Test word deletion"""
    username = "testuser"
    password = "testpass123"
    
    user = services.register_user(username, password)
    user_id = user["userId"]
    
    from app.models import WordEntry
    from datetime import datetime, timezone
    
    word = WordEntry(
        id="1",
        headword="test",
        pos="noun",
        meaningJa="テスト",
        examples=[],
        tags=[],
        memo=None,
        pronunciation=None,
        createdAt=datetime.now(timezone.utc).isoformat(),
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )
    
    services.upsert_word(user_id, word)
    assert len(services.list_words(user_id)) == 1
    
    services.delete_word(user_id, "1")
    assert len(services.list_words(user_id)) == 0
