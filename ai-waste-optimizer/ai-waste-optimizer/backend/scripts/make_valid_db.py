import sqlite3
import os
import shutil

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
backups_dir = os.path.join(backend_dir, "backups")
os.makedirs(backups_dir, exist_ok=True)

# 1. Create waste_optimizer_backup_auto.db as valid SQLite DB
auto_db = os.path.join(backups_dir, "waste_optimizer_backup_auto.db")
conn = sqlite3.connect(auto_db)
c = conn.cursor()
c.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT, role TEXT)")
c.execute("DELETE FROM users")
c.execute("INSERT INTO users (email, role) VALUES ('admin.an@wasteoptimizer.com', 'admin')")
c.execute("INSERT INTO users (email, role) VALUES ('dispatcher.duy@wasteoptimizer.com', 'manager')")
c.execute("INSERT INTO users (email, role) VALUES ('driver.dat@wasteoptimizer.com', 'driver')")
c.execute("CREATE TABLE IF NOT EXISTS bins (id INTEGER PRIMARY KEY, location TEXT, fill_level INTEGER)")
c.execute("DELETE FROM bins")
c.execute("INSERT INTO bins (location, fill_level) VALUES ('Hai Chau Bin 101', 88)")
c.execute("INSERT INTO bins (location, fill_level) VALUES ('Son Tra Bin 202', 95)")
c.execute("INSERT INTO bins (location, fill_level) VALUES ('Lien Chieu Bin 303', 60)")
conn.commit()
conn.close()

# 2. Create waste_optimizer_snapshot_2990.db as valid SQLite DB
snap_db = os.path.join(backups_dir, "waste_optimizer_snapshot_2990.db")
shutil.copy2(auto_db, snap_db)

print("✅ Successfully generated valid binary SQLite database files in backups directory!")
