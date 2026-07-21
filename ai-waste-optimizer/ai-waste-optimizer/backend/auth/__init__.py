# backend/auth/__init__.py
"""Authentication utilities"""
from backend.auth.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_active_user,
    require_admin,
    require_manager,
    pwd_context,
    oauth2_scheme
)