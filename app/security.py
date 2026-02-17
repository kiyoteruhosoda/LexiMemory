# app/security.py
from __future__ import annotations
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from .settings import settings

_ph = PasswordHasher()

def _pepper(password: str) -> str:
    # pepper は漏れても良いわけではないので env 管理推奨
    if settings.password_pepper:
        return password + settings.password_pepper
    return password

def hash_password(password: str) -> str:
    return _ph.hash(_pepper(password))

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _ph.verify(password_hash, _pepper(password))
    except VerifyMismatchError:
        return False
