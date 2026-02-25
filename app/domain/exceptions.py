"""Domain exceptions for authentication and security flows."""


class RefreshTokenReusedError(Exception):
    """Raised when a rotated refresh token is used again."""

    error_code = "REFRESH_REUSED"

    def __str__(self) -> str:
        return self.error_code

