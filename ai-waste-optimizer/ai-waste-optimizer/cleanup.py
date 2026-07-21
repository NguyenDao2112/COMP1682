import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'waste_optimizer.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Clean up collection_history
cursor.execute("DELETE FROM collection_history WHERE route_id IN (SELECT id FROM routes WHERE driver_name LIKE '%Le Van C%' OR driver_name LIKE '%Le Thi C%')")

# Clean up routes
cursor.execute("DELETE FROM routes WHERE driver_name LIKE '%Le Van C%' OR driver_name LIKE '%Le Thi C%'")

# Clean up drivers
cursor.execute("DELETE FROM drivers WHERE name LIKE '%Le Van C%' OR name LIKE '%Le Thi C%'")

conn.commit()
print('Orphans cleaned up successfully.')
conn.close()
