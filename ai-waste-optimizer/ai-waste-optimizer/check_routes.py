import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = os.path.join(os.path.dirname(__file__), 'waste_optimizer.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check bins table columns
cursor.execute("PRAGMA table_info(bins)")
print("=== BINS TABLE SCHEMA ===")
for col in cursor.fetchall():
    print(f"  {col}")

print("\n=== ROUTES ===")
cursor.execute("SELECT id, route_id, route_name, vehicle_id, driver_name, status FROM routes")
routes = cursor.fetchall()
for r in routes:
    print(f"  DB_ID={r[0]}, route_id={r[1]}, name={r[2]}, vehicle={r[3]}, driver={r[4]}, status={r[5]}")

print("\n=== COLLECTION HISTORY (bins per route) ===")
for r in routes:
    route_db_id = r[0]
    route_name = r[2]
    cursor.execute("""
        SELECT ch.id, ch.bin_id, b.bin_id as bin_code, b.latitude, b.longitude
        FROM collection_history ch
        JOIN bins b ON ch.bin_id = b.id
        WHERE ch.route_id = ?
        ORDER BY ch.id
    """, (route_db_id,))
    bins = cursor.fetchall()
    print(f"\n  Route '{route_name}' (DB_ID={route_db_id}): {len(bins)} bins")
    for b in bins:
        print(f"    ch_id={b[0]}, bin_db_id={b[1]}, code={b[2]}, lat={b[3]}, lon={b[4]}")

print("\n=== ALL BINS (lat/lon) ===")
cursor.execute("SELECT id, bin_id, latitude, longitude FROM bins ORDER BY id")
all_bins = cursor.fetchall()
for b in all_bins:
    print(f"  id={b[0]}, bin_id={b[1]}, lat={b[2]}, lon={b[3]}")

conn.close()
