import os
import sys
from datetime import datetime, timedelta

# Determine project root directory
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir)) # Up from scripts -> backend -> project_root
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.database import SessionLocal
from backend.models.models import Bin, CollectionHistory, CollectionRoute, Driver

def fix_data():
    db = SessionLocal()
    print("🧹 Cleaning up fake bins and histories...")
    
    # 1. Clear bins and history
    db.query(CollectionHistory).delete()
    db.query(Bin).delete()
    db.commit()
    
    # 2. Ensure routes exist
    r1 = db.query(CollectionRoute).filter(CollectionRoute.route_id == "RT-001").first()
    if not r1:
        r1 = CollectionRoute(route_id="RT-001", route_name="Hai Chau Route", vehicle_id="DX-1001", driver_name="Nguyen Van Tuan", status="in_progress")
        db.add(r1)
        
    r2 = db.query(CollectionRoute).filter(CollectionRoute.route_id == "RT-002").first()
    if not r2:
        r2 = CollectionRoute(route_id="RT-002", route_name="Son Tra Route", vehicle_id="DX-1002", driver_name="Tran Van B", status="in_progress")
        db.add(r2)
        
    db.commit()
    db.refresh(r1)
    db.refresh(r2)
    
    print("🌍 Creating 20 real bins (10 for Hai Chau, 10 for Son Tra)...")
    
    # Hai Chau Bins (16.05xx, 108.20xx)
    hai_chau_bins = []
    for i in range(1, 11):
        bin_id = f"BIN_{i:03d}"
        lat = 16.0500 + (i * 0.001)
        lng = 108.2000 + ((i % 5) * 0.001)
        b = Bin(bin_id=bin_id, address=f"Hai Chau Point {i}", latitude=lat, longitude=lng, ward="Hai Chau", district="Hai Chau, Da Nang", capacity=1000.0, current_fill_level=90.0, bin_type="general", status="active")
        db.add(b)
        hai_chau_bins.append(b)
        
    # Son Tra Bins (16.08xx, 108.23xx)
    son_tra_bins = []
    for i in range(11, 21):
        bin_id = f"BIN_{i:03d}"
        lat = 16.0800 + ((i-10) * 0.001)
        lng = 108.2300 + (((i-10) % 5) * 0.001)
        b = Bin(bin_id=bin_id, address=f"Son Tra Point {i-10}", latitude=lat, longitude=lng, ward="Son Tra", district="Son Tra, Da Nang", capacity=1000.0, current_fill_level=90.0, bin_type="general", status="active")
        db.add(b)
        son_tra_bins.append(b)
        
    db.commit()
    
    print("🔗 Assigning bins to their respective routes...")
    # Assign Hai Chau bins to RT-001
    for idx, b in enumerate(hai_chau_bins):
        db.add(CollectionHistory(bin_id=b.id, route_id=r1.id, collection_time=datetime.utcnow() + timedelta(hours=idx), fill_level_before=b.current_fill_level, notes=f"Stop {idx+1}"))
        
    # Assign Son Tra bins to RT-002
    for idx, b in enumerate(son_tra_bins):
        db.add(CollectionHistory(bin_id=b.id, route_id=r2.id, collection_time=datetime.utcnow() + timedelta(hours=idx), fill_level_before=b.current_fill_level, notes=f"Stop {idx+1}"))
        
    db.commit()
    db.close()
    print("✅ Database successfully synchronized with 20 real bins!")

if __name__ == "__main__":
    fix_data()
