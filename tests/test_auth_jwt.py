# tests/test_auth_jwt.py
"""
Tests for JWT authentication with refresh token rotation.
"""

import pytest
from datetime import datetime, timezone
from app.domain.exceptions import RefreshTokenReusedError
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
        # Note: This requires a test user to exist
        # You may need to create a test fixture for user data
        pass
    
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
        
        # Verify entire family is revoked
        store = await token_store.load()
        token_ids = store.family_index.get(family_id, [])
        for token_id in token_ids:
            if token_id in store.tokens:
                assert store.tokens[token_id].revoked_at_utc is not None
