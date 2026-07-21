import random
import pandas as pd
import datetime

# Number of bins and simulation parameters
NUM_BINS = 50
DAYS = 30
READINGS_PER_DAY = 4  # morning, noon, afternoon, evening

# GPS range for Da Nang city
LAT_RANGE = (16.04, 16.08)
LON_RANGE = (108.20, 108.25)

# Waste types
WASTE_TYPES = ["organic", "plastic", "paper", "metal"]

def simulate_bin_data():
    data = []
    start_date = datetime.datetime(2025, 1, 1)

    # Generate bins with fixed coordinates and waste type
    bins = []
    for bin_id in range(NUM_BINS):
        lat = round(random.uniform(*LAT_RANGE), 6)
        lon = round(random.uniform(*LON_RANGE), 6)
        waste_type = random.choice(WASTE_TYPES)
        bins.append({"bin_id": bin_id, "lat": lat, "lon": lon, "waste_type": waste_type})

    # Generate readings over time
    for day in range(DAYS):
        for reading in range(READINGS_PER_DAY):
            timestamp = start_date + datetime.timedelta(days=day, hours=reading*6)
            for b in bins:
                # Fill level increases gradually with randomness
                fill_level = min(100, random.randint(0, 20) + day*2 + reading*5)
                data.append({
                    "timestamp": timestamp,
                    "bin_id": b["bin_id"],
                    "lat": b["lat"],
                    "lon": b["lon"],
                    "waste_type": b["waste_type"],
                    "fill_level": fill_level
                })
    return pd.DataFrame(data)

# Export data to CSV
df = simulate_bin_data()
df.to_csv("D:/COMP1682/ai-waste-optimizer/data/simulated_bins.csv", index=False)
print("✅ simulated_bins.csv has been created successfully")
