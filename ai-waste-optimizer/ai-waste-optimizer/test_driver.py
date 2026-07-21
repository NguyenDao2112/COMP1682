#!/usr/bin/env python
"""
Test script for driver endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_driver_endpoints():
    print("=" * 60)
    print("Testing Driver Endpoints")
    print("=" * 60)
    
    # Test 1: Seed driver
    print("\n1. Testing /api/driver/seed (Create sample driver)")
    print("-" * 60)
    response = requests.post(f"{BASE_URL}/api/driver/seed")
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    # Test 2: Login with correct credentials
    print("\n2. Testing /api/driver/login (Login with driver001)")
    print("-" * 60)
    login_data = {
        "driver_id": "driver001",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/api/driver/login", json=login_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    if response.status_code == 200:
        token = result.get("token")
        print(f"\n[OK] Token received: {token[:50]}...")
        
        # Test 3: Get driver profile (protected)
        print("\n3. Testing GET /api/driver/me (Get driver profile - Protected)")
        print("-" * 60)
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/driver/me", headers=headers)
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, default=str)}")
        
        # Test 4: Update driver status (protected)
        print("\n4. Testing PUT /api/driver/status/Active (Update status - Protected)")
        print("-" * 60)
        response = requests.put(f"{BASE_URL}/api/driver/status/Active", headers=headers)
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, default=str)}")
        
        # Test 5: Get route sequence (protected)
        print("\n5. Testing GET /api/driver/route/sequence (Get route - Protected)")
        print("-" * 60)
        response = requests.get(f"{BASE_URL}/api/driver/route/sequence", headers=headers)
        print(f"Status Code: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
    
    # Test 6: Login with wrong password
    print("\n6. Testing /api/driver/login with wrong password")
    print("-" * 60)
    login_data = {
        "driver_id": "driver001",
        "password": "wrongpassword"
    }
    response = requests.post(f"{BASE_URL}/api/driver/login", json=login_data)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"Response: {json.dumps(result, indent=2)}")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    test_driver_endpoints()
