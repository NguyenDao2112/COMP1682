import time
import random
import requests
import threading

API_URL = "http://localhost:8000/api/iot/sensor-data"

# Simulate 20 bins across different districts
BINS = [f"BIN_{i:03d}" for i in range(1, 21)]

def simulate_bin(bin_id):
    """Simulates a single IoT bin sending data continuously."""
    fill_level = random.uniform(10.0, 30.0)  # Start at 10-30% full
    temperature = 25.0
    battery = 100.0
    
    print(f"[{bin_id}] Started simulation...")
    
    while True:
        try:
            # Simulate garbage being thrown in (2 to 10% increase every interval for faster demo)
            fill_level += random.uniform(2.0, 10.0)
            if fill_level > 100.0:
                fill_level = 100.0  # Max capacity
                
            # Simulate temperature fluctuation
            temperature += random.uniform(-0.5, 0.5)
            # 1% chance of fire simulation
            if random.random() < 0.01:
                temperature += 40.0
                
            # Simulate battery drain
            battery -= random.uniform(0.1, 0.5)
            if battery < 0:
                battery = 0.0

            payload = {
                "bin_id": bin_id,
                "fill_level": round(fill_level, 2),
                "temperature": round(temperature, 2),
                "battery_level": round(battery, 2)
            }
            
            # Send POST request to backend
            response = requests.post(API_URL, json=payload, timeout=5)
            if response.status_code == 200:
                print(f"[{bin_id}] Sent: Fill={payload['fill_level']}%, Temp={payload['temperature']}°C, Bat={payload['battery_level']}%")
            else:
                print(f"[{bin_id}] Error: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"[{bin_id}] Connection error: Backend might be down.")
            
        # Wait 2 to 5 seconds before sending next reading (fast demo mode)
        time.sleep(random.uniform(2, 5))

def main():
    print("========================================")
    print(" AI WASTE OPTIMIZER - MOCK IOT ENGINE")
    print("========================================")
    print(f"Target API: {API_URL}")
    print(f"Simulating {len(BINS)} IoT Bins...")
    print("Press Ctrl+C to stop.")
    print("========================================")
    
    threads = []
    for bin_id in BINS:
        t = threading.Thread(target=simulate_bin, args=(bin_id,), daemon=True)
        t.start()
        threads.append(t)
        # Stagger startups to avoid bursting all at once
        time.sleep(random.uniform(0.1, 0.5))
        
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Mock IoT Engine...")

if __name__ == "__main__":
    main()
