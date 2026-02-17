# tests/test_auth.py
"""Tests for authentication endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_healthz(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "version" in data
    assert "git_version" in data


def test_register_success(client: TestClient):
    """Test successful user registration."""
    from uuid import uuid4
    username = f"newuser_{uuid4().hex[:8]}"
    
    response = client.post(
        "/api/auth/register",
        json={"username": username, "password": "securepass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "userId" in data
    assert data["username"] == username


def test_register_duplicate_username(client: TestClient):
    """Test registration with duplicate username."""
    # First registration
    client.post(
        "/api/auth/register",
        json={"username": "duplicate", "password": "pass123"},
    )
    
    # Second registration with same username
    response = client.post(
        "/api/auth/register",
        json={"username": "duplicate", "password": "pass456"},
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["error"]["message"].lower()


def test_login_success(client: TestClient):
    """Test successful login."""
    # Register user
    client.post(
        "/api/auth/register",
        json={"username": "loginuser", "password": "loginpass123"},
    )
    
    # Login
    response = client.post(
        "/api/auth/login",
        json={"username": "loginuser", "password": "loginpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "session" in response.cookies or len(response.cookies) > 0


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials."""
    response = client.post(
        "/api/auth/login",
        json={"username": "nonexistent", "password": "wrongpass"},
    )
    assert response.status_code == 401


def test_me_authenticated(authenticated_client: tuple[TestClient, dict]):
    """Test /me endpoint with authenticated user."""
    client, user_data = authenticated_client
    
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["userId"] == user_data["userId"]
    assert data["username"] == user_data["username"]


def test_me_unauthenticated(client: TestClient):
    """Test /me endpoint without authentication."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout(authenticated_client: tuple[TestClient, dict]):
    """Test logout endpoint."""
    client, _ = authenticated_client
    
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
