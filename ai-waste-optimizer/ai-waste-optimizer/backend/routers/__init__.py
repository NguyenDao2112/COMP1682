# backend/routers/__init__.py
"""API Routers Package"""
# Import individual router modules
from backend.routers import auth
from backend.routers import bins
from backend.routers import routes
from backend.routers import feedback
from backend.routers import notifications
from backend.routers import users
try:
    from backend.routers import fleet
except Exception:
    pass

# Export router objects for easy import
__all__ = ['auth', 'bins', 'routes', 'feedback', 'notifications', 'users']
