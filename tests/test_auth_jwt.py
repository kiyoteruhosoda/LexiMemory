# tests/test_auth_jwt.py
"""
Tests for JWT authentication with refresh token rotation.
"""

import pytest
from datetime import datetime, timezone
from app.domain.exceptions import AuthDomainError, RefreshTokenReusedError
from app.infra.jwt_provider import JWTProvider
from app.infra.token_store_json import JsonTokenStore, hash_refresh_token
from app.service.auth_service import AuthService


@pytest.fixture
def jwt_provider():
    """Create JWT provider for testing"""
    return JWTProvider(
        secret_key="test-secret-key",
        algorithm="HS256",
        access_ttl_minutes=15
    )


@pytest.fixture
async def token_store(tmp_path):
    """Create token store with temporary directory"""
    store = JsonTokenStore(data_dir=str(tmp_path))
    return store


@pytest.fixture
async def auth_service(jwt_provider, token_store):
    """Create auth service for testing"""
    return AuthService(
        jwt_provider=jwt_provider,
        token_store=token_store,
        refresh_salt="test-salt",
        refresh_ttl_days=30
    )


class TestJWTProvider:
    """Test JWT token creation and verification"""
    
    def test_create_access_token(self, jwt_provider):
        """Test creating access token"""
        user_id = "test-user-123"
        token, expires_at = jwt_provider.create_access_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0
        assert isinstance(expires_at, datetime)
        assert expires_at.tzinfo is not None  # UTC aware
    
    def test_verify_valid_token(self, jwt_provider):
        """Test verifying valid token"""
        user_id = "test-user-123"
        token, _ = jwt_provider.create_access_token(user_id)
        
        payload = jwt_provider.verify_access_token(token)
        
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["iss"] == "lexivault"
        assert "iat" in payload
        assert "exp" in payload
    
    def test_verify_invalid_token(self, jwt_provider):
        """Test verifying invalid token"""
        invalid_token = "invalid.token.string"
        
        payload = jwt_provider.verify_access_token(invalid_token)
        
        assert payload is None


class TestTokenStore:
    """Test token store operations"""
    
    async def test_add_and_find_token(self, token_store):
        """Test adding and finding token by hash"""
        token_hash = hash_refresh_token("test-token", "test-salt")
        
        await token_store.add_token(
            token_id="tok_123",
            user_id="user_456",
            token_hash=token_hash,
            family_id="fam_789",
            prev_token_id=None,
            ttl_days=30
        )
        
        result = await token_store.find_by_hash(token_hash)
        
        assert result is not None
        token_id, record = result
        assert token_id == "tok_123"
        assert record.user_id == "user_456"
        assert record.token_hash == token_hash
        assert record.family_id == "fam_789"
    
    async def test_mark_replaced(self, token_store):
        """Test marking token as replaced"""
        token_hash = hash_refresh_token("test-token", "test-salt")
        
        await token_store.add_token(
            token_id="tok_old",
            user_id="user_123",
            token_hash=token_hash,
            family_id="fam_abc",
            prev_token_id=None,
            ttl_days=30
        )
        
        await token_store.mark_replaced("tok_old", "tok_new")
        
        result = await token_store.find_by_hash(token_hash)
        token_id, record = result
        assert record.replaced_by_token_id == "tok_new"
    
    async def test_revoke_family(self, token_store):
        """Test revoking entire token family"""
        family_id = "fam_xyz"
        
        # Add multiple tokens in same family
        for i in range(3):
            token_hash = hash_refresh_token(f"token-{i}", "test-salt")
            await token_store.add_token(
                token_id=f"tok_{i}",
                user_id="user_123",
                token_hash=token_hash,
                family_id=family_id,
                prev_token_id=None if i == 0 else f"tok_{i-1}",
                ttl_days=30
            )
        
        # Revoke entire family
        await token_store.revoke_family(family_id)
        
        # All tokens should be revoked
        for i in range(3):
            token_hash = hash_refresh_token(f"token-{i}", "test-salt")
            result = await token_store.find_by_hash(token_hash)
            token_id, record = result
            assert record.revoked_at_utc is not None


class TestAuthService:
    """Test authentication service"""
    
    async def test_login_success(self, auth_service):
        """Test successful login"""
        async def fake_authenticate_user(username, password):
            assert username == "alice"
            assert password == "secret"
            return {"userId": "user-alice", "username": "alice"}

        auth_service.authenticate_user = fake_authenticate_user

        result = await auth_service.login("alice", "secret")

        assert result is not None
        access_token, refresh_token, expires_at = result
        assert isinstance(access_token, str)
        assert isinstance(refresh_token, str)
        assert expires_at.tzinfo is not None
        assert await auth_service.has_active_refresh_token(refresh_token) is True
    
    async def test_has_active_refresh_token(self, auth_service, token_store):
        """Test active refresh token detection"""
        from app.infra.token_store_json import generate_refresh_token

        refresh_token = generate_refresh_token()
        token_hash = hash_refresh_token(refresh_token, "test-salt")

        await token_store.add_token(
            token_id="tok_active",
            user_id="test-user",
            token_hash=token_hash,
            family_id="fam_active",
            prev_token_id=None,
            ttl_days=30,
        )

        assert await auth_service.has_active_refresh_token(refresh_token) is True

    async def test_has_active_refresh_token_returns_false_for_revoked(self, auth_service, token_store):
        """Test revoked refresh token is not considered active"""
        from app.infra.token_store_json import generate_refresh_token

        refresh_token = generate_refresh_token()
        token_hash = hash_refresh_token(refresh_token, "test-salt")

        await token_store.add_token(
            token_id="tok_revoked",
            user_id="test-user",
            token_hash=token_hash,
            family_id="fam_revoked",
            prev_token_id=None,
            ttl_days=30,
        )
        await token_store.revoke_token("tok_revoked")

        assert await auth_service.has_active_refresh_token(refresh_token) is False

    async def test_has_active_refresh_token_returns_false_for_expired(self, auth_service, token_store):
        """Test expired refresh token is not considered active"""
        from app.infra.token_store_json import generate_refresh_token

        refresh_token = generate_refresh_token()
        token_hash = hash_refresh_token(refresh_token, "test-salt")

        await token_store.add_token(
            token_id="tok_expired",
            user_id="test-user",
            token_hash=token_hash,
            family_id="fam_expired",
            prev_token_id=None,
            ttl_days=-1,
        )

        assert await auth_service.has_active_refresh_token(refresh_token) is False


    async def test_evaluate_auth_status_with_valid_access_and_refresh(self, auth_service):
        """Test evaluate_auth_status returns authenticated and canRefresh."""
        async def fake_has_active_refresh_token(_token):
            return True

        async def fake_verify_access_token(_token):
            return "user-123"

        auth_service.has_active_refresh_token = fake_has_active_refresh_token
        auth_service.verify_access_token = fake_verify_access_token

        authenticated, can_refresh, user_id = await auth_service.evaluate_auth_status(
            access_token="valid-token",
            refresh_token="valid-refresh",
        )

        assert authenticated is True
        assert can_refresh is True
        assert user_id == "user-123"

    async def test_evaluate_auth_status_with_invalid_access_and_valid_refresh(self, auth_service):
        """Test evaluate_auth_status preserves canRefresh on invalid access token."""
        async def fake_has_active_refresh_token(_token):
            return True

        async def fake_verify_access_token(_token):
            return None

        auth_service.has_active_refresh_token = fake_has_active_refresh_token
        auth_service.verify_access_token = fake_verify_access_token

        authenticated, can_refresh, user_id = await auth_service.evaluate_auth_status(
            access_token="invalid-token",
            refresh_token="valid-refresh",
        )

        assert authenticated is False
        assert can_refresh is True
        assert user_id is None

    async def test_refresh_rotation(self, auth_service, token_store):
        """Test refresh token rotation"""
        # Manually create initial token
        user_id = "test-user"
        from app.infra.token_store_json import generate_refresh_token
        
        refresh_token = generate_refresh_token()
        token_hash = hash_refresh_token(refresh_token, "test-salt")
        family_id = "fam_test"
        
        await token_store.add_token(
            token_id="tok_initial",
            user_id=user_id,
            token_hash=token_hash,
            family_id=family_id,
            prev_token_id=None,
            ttl_days=30
        )
        
        # Perform refresh (rotation)
        result = await auth_service.refresh(refresh_token)
        
        assert result is not None
        access_token, new_refresh_token, expires_at = result
        assert isinstance(access_token, str)
        assert isinstance(new_refresh_token, str)
        assert new_refresh_token != refresh_token  # Token rotated
        
        # Old token should be marked as replaced
        old_result = await token_store.find_by_hash(token_hash)
        _, old_record = old_result
        assert old_record.replaced_by_token_id is not None
    
    async def test_replay_detection(self, auth_service, token_store):
        """Test replay attack detection"""
        # Create initial token
        user_id = "test-user"
        from app.infra.token_store_json import generate_refresh_token
        
        refresh_token = generate_refresh_token()
        token_hash = hash_refresh_token(refresh_token, "test-salt")
        family_id = "fam_test_replay"
        
        await token_store.add_token(
            token_id="tok_initial",
            user_id=user_id,
            token_hash=token_hash,
            family_id=family_id,
            prev_token_id=None,
            ttl_days=30
        )
        
        # First refresh (should succeed)
        result1 = await auth_service.refresh(refresh_token)
        assert result1 is not None
        
        # Try to reuse old token (should detect replay)
        with pytest.raises(RefreshTokenReusedError) as exc_info:
            await auth_service.refresh(refresh_token)

        assert str(exc_info.value) == "REFRESH_REUSED"
        assert isinstance(exc_info.value, AuthDomainError)
        
        # Verify entire family is revoked
        store = await token_store.load()
        token_ids = store.family_index.get(family_id, [])
        for token_id in token_ids:
            if token_id in store.tokens:
                assert store.tokens[token_id].revoked_at_utc is not None
