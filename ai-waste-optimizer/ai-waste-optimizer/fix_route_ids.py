import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'waste_optimizer.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("UPDATE routes SET route_id = 'TEMP1' WHERE route_name LIKE '%Son Tra%'")
cursor.execute("UPDATE routes SET route_id = 'TEMP2' WHERE route_name LIKE '%Lien Chieu%'")
cursor.execute("UPDATE routes SET route_id = 'TEMP3' WHERE route_name LIKE '%Hai Chau%'")
conn.commit()

cursor.execute("UPDATE routes SET route_id = 'RT - Sơn Trà' WHERE route_id = 'TEMP1'")
cursor.execute("UPDATE routes SET route_id = 'RT - Liên Chiểu' WHERE route_id = 'TEMP2'")
cursor.execute("UPDATE routes SET route_id = 'RT - Hải Châu' WHERE route_id = 'TEMP3'")
conn.commit()
conn.close()
print("Fixed route_ids successfully")
