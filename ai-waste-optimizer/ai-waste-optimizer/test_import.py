#!/usr/bin/env python
"""Test driver import"""
try:
    from backend.routers.driver import router
    print("✓ Driver router imported successfully")
    print(f"Number of routes: {len(router.routes)}")
    for route in router.routes:
        print(f"  - {route.path}")
except Exception as e:
    print(f"✗ Error importing driver router: {e}")
    import traceback
    traceback.print_exc()
