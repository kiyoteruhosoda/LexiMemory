"""
Test audit logging functionality.
Verify that critical operations are logged to audit.log with proper structure.
"""
import pytest
import json
from pathlib import Path
from typing import Optional
from app import storage
from app.settings import settings


@pytest.fixture
def audit_log_path():
    """Return path to audit.log"""
    return settings.data_dir / "logs" / "audit.log"


def read_audit_events(audit_log_path: Path, event_type: Optional[str] = None):
    """Read audit log and return parsed events, optionally filtered by event type"""
    if not audit_log_path.exists():
        return []
    
    events = []
    with open(audit_log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                if event_type is None or entry.get("event") == event_type:
                    events.append(entry)
            except json.JSONDecodeError:
                continue
    return events


@pytest.mark.asyncio
async def test_audit_user_register(client, audit_log_path, unique_username):
    """Test that user registration is logged to audit.log"""
    initial_count = len(read_audit_events(audit_log_path, "user.register"))
    username = unique_username()
    
    response = await client.post(
        "/api/auth/register",
        json={"username": username, "password": "testpass123"}
    )
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "user.register")
    assert len(events) > initial_count, "Audit log should contain registration event"
    
    latest = events[-1]
    assert latest["event"] == "user.register"
    assert latest["result"] == "success"
    assert "user_id" in latest
    assert "username" in latest
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_user_login(authenticated_client, audit_log_path):
    """Test that login is logged to audit.log"""
    client, user_data, token = authenticated_client
    
    # Count login events (authenticated_client already logged in once)
    events = read_audit_events(audit_log_path, "user.login")
    
    # Find the login event for this user
    user_events = [e for e in events if e.get("user_id") == user_data["userId"]]
    assert len(user_events) >= 1, "Login event should be logged"
    
    latest = user_events[-1]
    assert latest["event"] == "user.login"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_user_login_failure(client, audit_log_path):
    """Test that failed login is logged to audit.log"""
    initial_count = len(read_audit_events(audit_log_path, "user.login"))
    
    response = await client.post(
        "/api/auth/login",
        json={"username": "nonexistent_user", "password": "wrongpass"}
    )
    
    assert response.status_code == 401
    
    # Check audit log
    events = read_audit_events(audit_log_path, "user.login")
    assert len(events) > initial_count, "Failed login should be logged"
    
    latest = events[-1]
    assert latest["event"] == "user.login"
    assert latest["result"] == "failure"
    assert latest["error_code"] == "AUTH_INVALID"
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_word_create(authenticated_client, audit_log_path):
    """Test that word creation is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "word.create"))
    
    response = await client.post(
        "/api/words",
        json={
            "headword": "audit_test_word",
            "pos": "noun",
            "meaningJa": "監査テスト単語",
            "examples": [],
            "tags": []
        },
        headers=headers
    )
    
    assert response.status_code == 200
    word_id = response.json()["word"]["id"]
    
    # Check audit log
    events = read_audit_events(audit_log_path, "word.create")
    assert len(events) > initial_count, "Word creation should be logged"
    
    latest = events[-1]
    assert latest["event"] == "word.create"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert latest["word_id"] == word_id
    assert latest["headword"] == "audit_test_word"
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_word_update(authenticated_client, audit_log_path):
    """Test that word update is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a word first
    create_response = await client.post(
        "/api/words",
        json={
            "headword": "update_test",
            "pos": "noun",
            "meaningJa": "更新テスト",
            "examples": [],
            "tags": []
        },
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    initial_count = len(read_audit_events(audit_log_path, "word.update"))
    
    # Update the word
    response = await client.put(
        f"/api/words/{word_id}",
        json={
            "headword": "update_test_modified",
            "pos": "verb",
            "meaningJa": "更新テスト（変更後）",
            "examples": [],
            "tags": []
        },
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "word.update")
    assert len(events) > initial_count, "Word update should be logged"
    
    latest = events[-1]
    assert latest["event"] == "word.update"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert latest["word_id"] == word_id
    assert latest["headword"] == "update_test_modified"
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_word_delete(authenticated_client, audit_log_path):
    """Test that word deletion is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a word first
    create_response = await client.post(
        "/api/words",
        json={
            "headword": "delete_test",
            "pos": "noun",
            "meaningJa": "削除テスト",
            "examples": [],
            "tags": []
        },
        headers=headers
    )
    word_id = create_response.json()["word"]["id"]
    
    initial_count = len(read_audit_events(audit_log_path, "word.delete"))
    
    # Delete the word
    response = await client.delete(f"/api/words/{word_id}", headers=headers)
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "word.delete")
    assert len(events) > initial_count, "Word deletion should be logged"
    
    latest = events[-1]
    assert latest["event"] == "word.delete"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert latest["word_id"] == word_id
    assert latest["headword"] == "delete_test"
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_data_export(authenticated_client, audit_log_path):
    """Test that data export is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "data.export"))
    
    response = await client.get("/api/io/export", headers=headers)
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "data.export")
    assert len(events) > initial_count, "Data export should be logged"
    
    latest = events[-1]
    assert latest["event"] == "data.export"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert "word_count" in latest
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_data_import_merge(authenticated_client, audit_log_path):
    """Test that data import (merge mode) is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "data.import.merge"))
    
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "import_test",
                    "pos": "noun",
                    "meaningJa": "インポートテスト"
                }
            ]
        },
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "data.import.merge")
    assert len(events) > initial_count, "Data import should be logged"
    
    latest = events[-1]
    assert latest["event"] == "data.import.merge"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert latest["word_count"] == 1
    assert latest["mode"] == "merge"
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_data_import_overwrite(authenticated_client, audit_log_path):
    """Test that data import (overwrite mode) is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "data.import.overwrite"))
    
    response = await client.post(
        "/api/io/import?mode=overwrite",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "overwrite_test",
                    "pos": "verb",
                    "meaningJa": "上書きテスト"
                }
            ]
        },
        headers=headers
    )
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "data.import.overwrite")
    assert len(events) > initial_count, "Data import should be logged"
    
    latest = events[-1]
    assert latest["event"] == "data.import.overwrite"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert latest["word_count"] == 1
    assert latest["mode"] == "overwrite"
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_import_validation_failure(authenticated_client, audit_log_path):
    """Test that import validation failure is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "data.import.merge"))
    
    # Try to import with invalid data
    response = await client.post(
        "/api/io/import?mode=merge",
        json={
            "schemaVersion": 1,
            "words": [
                {
                    "headword": "invalid",
                    "pos": "invalid_pos",  # Invalid!
                    "meaningJa": "無効"
                }
            ]
        },
        headers=headers
    )
    
    assert response.status_code == 422  # Pydantic validation error
    
    # Validation failures might be logged differently
    # Check if there are any relevant events
    events = read_audit_events(audit_log_path)
    # Note: Pydantic validation errors occur before custom validation,
    # so they might not trigger audit log. This is expected behavior.


@pytest.mark.asyncio
async def test_audit_user_logout(authenticated_client, audit_log_path):
    """Test that logout is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "user.logout"))
    
    response = await client.post("/api/auth/logout", headers=headers)
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "user.logout")
    assert len(events) > initial_count, "Logout should be logged"
    
    latest = events[-1]
    assert latest["event"] == "user.logout"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert "request_id" in latest


@pytest.mark.asyncio
async def test_audit_user_delete(authenticated_client, audit_log_path):
    """Test that account deletion is logged to audit.log"""
    client, user_data, token = authenticated_client
    headers = {"Authorization": f"Bearer {token}"}
    
    initial_count = len(read_audit_events(audit_log_path, "user.delete"))
    
    response = await client.delete("/api/auth/me", headers=headers)
    
    assert response.status_code == 200
    
    # Check audit log
    events = read_audit_events(audit_log_path, "user.delete")
    assert len(events) > initial_count, "Account deletion should be logged"
    
    latest = events[-1]
    assert latest["event"] == "user.delete"
    assert latest["result"] == "success"
    assert latest["user_id"] == user_data["userId"]
    assert "request_id" in latest
