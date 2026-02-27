# app/domain/exceptions.py
"""Domain exceptions for authentication and security flows."""


class AuthDomainError(Exception):
    """Base class for auth-related domain errors with stable error_code."""

    error_code = "AUTH_DOMAIN_ERROR"

    def __init__(self, message: str | None = None):
        super().__init__(message or self.error_code)


class RefreshTokenReusedError(AuthDomainError):
    """Raised when a rotated refresh token is used again."""

    error_code = "REFRESH_REUSED"

    def __init__(self):
        super().__init__(self.error_code)
