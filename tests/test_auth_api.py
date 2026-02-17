# tests/test_auth_api.py
"""
API-level tests for JWT authentication endpoints.
"""

import pytest
from fastapi import status
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_and_access_me(client: AsyncClient, unique_username):
    """Test login flow and accessing protected endpoint"""
    username = unique_username()
    password = "testpass123"
    
    # Register user
    resp = await client.post("/api/auth/register", json={
        "username": username,
        "password": password
    })
    assert resp.status_code == 200
    
    # Login
    resp = await client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert "expires_in" in data
    
    access_token = data["access_token"]
    
    # Access protected endpoint with Bearer token
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert resp.status_code == 200
    me_data = resp.json()
    assert me_data["username"] == username


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient, unique_username):
    """Test refresh token rotation"""
    username = unique_username()
    password = "testpass123"
    
    # Register and login
    await client.post("/api/auth/register", json={
        "username": username,
        "password": password
    })
    
    resp = await client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert resp.status_code == 200
    access_token_1 = resp.json()["access_token"]
    
    # Refresh token is in cookie
    assert "refresh_token" in resp.cookies
    
    # Wait a moment to ensure different timestamps
    import asyncio
    await asyncio.sleep(1)
    
    # Call refresh endpoint
    resp = await client.post("/api/auth/refresh")
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    access_token_2 = data["access_token"]
    
    # Should get new access token
    assert access_token_2 != access_token_1
    
    # New refresh token should be in cookie
    assert "refresh_token" in resp.cookies


@pytest.mark.asyncio
async def test_replay_detection(client: AsyncClient, unique_username):
    """Test replay attack detection"""
    username = unique_username()
    password = "testpass123"
    
    # Register and login
    await client.post("/api/auth/register", json={
        "username": username,
        "password": password
    })
    
    resp = await client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert resp.status_code == 200
    
    # Save refresh token cookie from login response
    refresh_token_1 = resp.cookies.get("refresh_token")
    assert isinstance(refresh_token_1, str), "refresh_token cookie must be set"
    
    # First refresh (should succeed)
    client.cookies.set("refresh_token", refresh_token_1)
    resp = await client.post("/api/auth/refresh")
    assert resp.status_code == 200
    
    # Try to reuse old refresh token (replay attack)
    client.cookies.set("refresh_token", refresh_token_1)
    resp = await client.post("/api/auth/refresh")
    assert resp.status_code == 401
    error = resp.json()["error"]
    assert error["error_code"] == "REFRESH_REUSED"


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, unique_username):
    """Test logout"""
    username = unique_username()
    password = "testpass123"
    
    # Register and login
    await client.post("/api/auth/register", json={
        "username": username,
        "password": password
    })
    
    resp = await client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    assert resp.status_code == 200
    access_token = resp.json()["access_token"]
    
    # Logout
    resp = await client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert resp.status_code == 200
    
    # Refresh token should be cleared from cookie
    # (Implementation detail: check Set-Cookie header has max-age=0)


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """Test accessing protected endpoint without token"""
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401
    error = resp.json()["error"]
    assert error["error_code"] == "AUTH_REQUIRED"


@pytest.mark.asyncio
async def test_invalid_token(client: AsyncClient):
    """Test accessing with invalid token"""
    resp = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid-token"}
    )
    assert resp.status_code == 401
    error = resp.json()["error"]
    assert error["error_code"] == "AUTH_EXPIRED"


@pytest.mark.asyncio
async def test_protected_endpoints_require_auth(client: AsyncClient, unique_username):
    """Test that all protected endpoints require authentication"""
    username = unique_username()
    password = "testpass123"
    
    # Register and login
    await client.post("/api/auth/register", json={
        "username": username,
        "password": password
    })
    
    resp = await client.post("/api/auth/login", json={
        "username": username,
        "password": password
    })
    access_token = resp.json()["access_token"]
    
    # Test words endpoint
    resp = await client.get("/api/words")
    assert resp.status_code == 401
    
    # With token should work
    resp = await client.get(
        "/api/words",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert resp.status_code == 200
    
    # Test study endpoint
    resp = await client.get("/api/study/next")
    assert resp.status_code == 401
    
    resp = await client.get(
        "/api/study/next",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert resp.status_code == 200
