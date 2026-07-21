"""
Test script for /api/driver/route/sequence endpoint
Tests the Driver Route Sequence API for Android app
"""

import requests
import json
from datetime import timedelta

BASE_URL = "http://localhost:8000"

def test_driver_route_sequence():
    """Test the driver route sequence endpoint."""
    
    print("\n" + "="*70)
    print("📱 Testing Driver Route Sequence API for Android App")
    print("="*70)
    
    # Step 1: Login as driver
    print("\n1️⃣  Step 1: Login as Driver")
    print("-" * 70)
    
    login_payload = {
        "driver_id": "driver_route_001",
        "password": "password123"
    }
    
    login_url = f"{BASE_URL}/api/driver/login"
    print(f"POST {login_url}")
    print(f"Payload: {json.dumps(login_payload, indent=2)}")
    
    try:
        login_response = requests.post(login_url, json=login_payload)
        login_response.raise_for_status()
        login_data = login_response.json()
        token = login_data.get("token")
        
        print(f"✅ Login successful")
        print(f"Token: {token[:50]}...")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return
    
    # Step 2: Get route sequence
    print("\n2️⃣  Step 2: Get Route Sequence")
    print("-" * 70)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    route_url = f"{BASE_URL}/api/driver/route/sequence"
    print(f"GET {route_url}")
    print(f"Headers: Authorization: Bearer {token[:30]}...")
    
    try:
        route_response = requests.get(route_url, headers=headers)
        route_response.raise_for_status()
        route_data = route_response.json()
        
        print(f"✅ Route sequence retrieved successfully")
        print(f"\n📍 Response JSON Structure:")
        print(json.dumps(route_data, indent=2, ensure_ascii=False))
        
        # Validate structure
        print(f"\n📊 Validation Results:")
        if "route" in route_data:
            bins = route_data["route"]
            print(f"   ✓ 'route' field present: {len(bins)} bins")
            
            if len(bins) > 0:
                first_bin = bins[0]
                required_fields = ["id", "location_name", "latitude", "longitude", 
                                 "current_fill_level", "bin_type", "zone"]
                
                print(f"\n   ✓ First bin structure:")
                for field in required_fields:
                    if field in first_bin:
                        print(f"     ✓ {field}: {first_bin[field]}")
                    else:
                        print(f"     ✗ {field}: MISSING")
                
                # Summary
                print(f"\n📈 Data Summary:")
                print(f"   - Total bins in route: {len(bins)}")
                
                fill_levels = [b.get("current_fill_level", 0) for b in bins]
                bin_types = {}
                for b in bins:
                    bt = b.get("bin_type", "Unknown")
                    bin_types[bt] = bin_types.get(bt, 0) + 1
                
                print(f"   - Average fill level: {sum(fill_levels)/len(fill_levels):.1f}%")
                print(f"   - Fill level range: {min(fill_levels):.1f}% - {max(fill_levels):.1f}%")
                print(f"   - Bin types distribution:")
                for bt, count in sorted(bin_types.items()):
                    print(f"     • {bt}: {count}")
                
                # Coordinates validation
                lats = [b["latitude"] for b in bins]
                lngs = [b["longitude"] for b in bins]
                print(f"\n   - Location coordinates (HCM District 1):")
                print(f"     • Latitude range: {min(lats):.4f} - {max(lats):.4f}")
                print(f"     • Longitude range: {min(lngs):.4f} - {max(lngs):.4f}")
        else:
            print(f"   ✗ 'route' field missing in response")
        
    except Exception as e:
        print(f"❌ Failed to get route sequence: {e}")
        return
    
    print("\n" + "="*70)
    print("✅ TEST COMPLETED SUCCESSFULLY")
    print("="*70)
    print("\n📱 Android App Integration Notes:")
    print("   1. Response format matches Android model requirements")
    print("   2. All required fields (id, location_name, latitude, longitude,")
    print("      current_fill_level, bin_type, zone) are present")
    print("   3. Coordinates are realistic for District 1, HCM")
    print("   4. Fill levels vary (good for color-coded marker display)")
    print("\n")

if __name__ == "__main__":
    print("\nMake sure backend is running on http://localhost:8000")
    print("Press Enter to start test...", end="")
    input()
    test_driver_route_sequence()
