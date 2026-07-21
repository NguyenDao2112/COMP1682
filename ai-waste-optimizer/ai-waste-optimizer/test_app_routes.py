#!/usr/bin/env python
"""Test if the app can be imported successfully and check if driver router is loaded"""
import sys
sys.path.insert(0, '.')

try:
    print("1. Importing backend.main...")
    from backend.main import app
    print("✓ Successfully imported app")
    
    print("\n2. Checking registered routes...")
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append(route.path)
    
    driver_routes = [r for r in routes if '/driver' in r]
    print(f"Total routes: {len(routes)}")
    print(f"Driver routes: {len(driver_routes)}")
    
    if driver_routes:
        print("\n✓ Driver routes found:")
        for r in driver_routes:
            print(f"  - {r}")
    else:
        print("\n✗ No driver routes registered in app!")
        print("\nAll routes:")
        for r in sorted(set(routes)):
            print(f"  - {r}")
            
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
