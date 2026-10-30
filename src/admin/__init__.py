"""
Admin Module Initialization
Export admin blueprint and authentication utilities
"""

from .routes import admin_bp
from .services import DashboardService
from .auth import (
    auth_bp,
    login_required,
    authenticate,
    login_user,
    logout_user,
    get_current_user,
    is_authenticated,
)

__all__ = [
    "admin_bp",
    "auth_bp",
    "DashboardService",
    "login_required",
    "authenticate",
    "login_user",
    "logout_user",
    "get_current_user",
    "is_authenticated",
]
