import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:8000"

# Login as manager
resp = requests.post(f"{BASE}/api/auth/login", data={"username": "manager@wasteoptimizer.com", "password": "managerpassword"})
if resp.status_code != 200:
    print(f"Login failed: {resp.status_code} - {resp.text}")
    exit(1)
    
login_data = resp.json()
token = login_data.get("access_token")

headers = {"Authorization": f"Bearer {token}"}

print("\n=== PUT /api/routes/3 (dispatch Son Tra) ===")
# Try to set Son Tra to in_progress with TRUCK_002
payload = {"status": "in_progress", "vehicle_id": "TRUCK_002"}
try:
    resp = requests.put(f"{BASE}/api/routes/3", headers=headers, json=payload)
    print(f"Status: {resp.status_code}")
    print(resp.text[:500])
except Exception as e:
    print(f"Request failed: {e}")
