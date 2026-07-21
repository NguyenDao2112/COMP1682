import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = os.path.join(os.path.dirname(__file__), 'waste_optimizer.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# ========================================
# FIX 1: Son Tra Route should use BIN_011 to BIN_020 (Son Tra district bins)
# Currently it uses BIN_001 to BIN_010 which are Hai Chau bins
# ========================================

# Get Son Tra route DB ID
cursor.execute("SELECT id FROM routes WHERE route_name = 'Son Tra Route'")
son_tra_route = cursor.fetchone()
if not son_tra_route:
    print("ERROR: Son Tra Route not found!")
    exit(1)

son_tra_id = son_tra_route[0]
print(f"Son Tra Route DB_ID = {son_tra_id}")

# Delete current collection_history for Son Tra (which wrongly points to BIN_001-BIN_010)
cursor.execute("DELETE FROM collection_history WHERE route_id = ?", (son_tra_id,))
print(f"Deleted {cursor.rowcount} old collection_history records for Son Tra")

# Insert new collection_history pointing to BIN_011-BIN_020 (the actual Son Tra bins)
# BIN_011 to BIN_020 have DB ids 11 to 20
for bin_db_id in range(11, 21):
    cursor.execute("""
        INSERT INTO collection_history (route_id, bin_id, fill_level_before, fill_level_after)
        VALUES (?, ?, 80.0, 80.0)
    """, (son_tra_id, bin_db_id))

print(f"Inserted 10 new collection_history records for Son Tra (BIN_011 to BIN_020)")

# ========================================
# FIX 2: Fix vehicle assignments (Son Tra has TRUCK_003 same as Lien Chieu)
# Correct: Son Tra = TRUCK_002, Lien Chieu = TRUCK_003, Hai Chau = TRUCK_001
# ========================================
cursor.execute("UPDATE routes SET vehicle_id = 'TRUCK_002' WHERE route_name = 'Son Tra Route'")
print("Fixed Son Tra vehicle: TRUCK_003 -> TRUCK_002")

conn.commit()

# ========================================
# VERIFY
# ========================================
print("\n=== VERIFICATION ===")
cursor.execute("SELECT id, route_id, route_name, vehicle_id, driver_name FROM routes ORDER BY id")
for r in cursor.fetchall():
    print(f"  DB_ID={r[0]}, route_id={r[1]}, name={r[2]}, vehicle={r[3]}, driver={r[4]}")

print("\n=== BINS PER ROUTE ===")
cursor.execute("SELECT id, route_name FROM routes ORDER BY id")
routes = cursor.fetchall()
for r in routes:
    cursor.execute("""
        SELECT b.bin_id, b.latitude, b.longitude, b.district
        FROM collection_history ch
        JOIN bins b ON ch.bin_id = b.id
        WHERE ch.route_id = ?
        ORDER BY b.id
    """, (r[0],))
    bins = cursor.fetchall()
    print(f"\n  {r[1]}: {len(bins)} bins")
    for b in bins:
        print(f"    {b[0]}: lat={b[1]:.4f}, lon={b[2]:.4f}, district={b[3]}")

conn.close()
print("\nDone! All routes now have unique, district-correct bins.")
