import os
import sys

# Determine project root directory
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from datetime import datetime, timedelta
from backend.database import SessionLocal, engine, Base
from backend.models.models import Bin, Driver, CollectionRoute, CollectionHistory, DriverStatus, User, UserRole
from backend.auth.auth import get_password_hash

def seed():
    print("🚀 Starting clean database seed (30 Bins / 3 District Routes / 5 Users)...")
    db = SessionLocal()
    
    # 0. Clear old data completely to prevent clutter
    db.query(CollectionHistory).delete()
    db.query(Bin).delete()
    db.query(CollectionRoute).delete()
    db.query(Driver).delete()
    db.query(User).delete()
    db.commit()

    # 1. Seed 5 Project User Personas
    users = [
        User(
            username="admin_an",
            email="admin.an@wasteoptimizer.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin An (Nguyen Van An)",
            role=UserRole.ADMIN,
            is_active=True
        ),
        User(
            username="dispatcher_duy",
            email="dispatcher.duy@wasteoptimizer.com",
            hashed_password=get_password_hash("manager123"),
            full_name="Dispatcher Duy (Tran Quoc Duy)",
            role=UserRole.MANAGER,
            is_active=True
        ),
        User(
            username="driver_dat",
            email="driver.dat@wasteoptimizer.com",
            hashed_password=get_password_hash("driver123"),
            full_name="Driver Dat (Pham Van Dat)",
            role=UserRole.DRIVER,
            is_active=True
        ),
        User(
            username="driver_b",
            email="driver.b@wasteoptimizer.com",
            hashed_password=get_password_hash("driver123"),
            full_name="Driver B (Nguyen Van B)",
            role=UserRole.DRIVER,
            is_active=True
        ),
        User(
            username="driver_c",
            email="driver.c@wasteoptimizer.com",
            hashed_password=get_password_hash("driver123"),
            full_name="Driver C (Le Van C - Added by Admin An)",
            role=UserRole.DRIVER,
            is_active=True
        )
    ]
    db.add_all(users)
    db.commit()

    # 2. Seed 3 District Routes
    r1 = CollectionRoute(
        route_id="RT-001",
        route_name="Hai Chau District Route",
        vehicle_id="DX-1001",
        driver_name="Driver Dat (Pham Van Dat)",
        status="in_progress"
    )
    r2 = CollectionRoute(
        route_id="RT-002",
        route_name="Son Tra District Route",
        vehicle_id="DX-1002",
        driver_name="Driver B (Nguyen Van B)",
        status="completed"
    )
    r3 = CollectionRoute(
        route_id="RT-003",
        route_name="Lien Chieu District Route",
        vehicle_id="DX-1003",
        driver_name="Driver C (Le Van C)",
        status="pending"
    )
    db.add_all([r1, r2, r3])
    db.commit()

    # 3. Seed 3 Fleet Drivers
    d1 = Driver(
        driver_id="driver_dat",
        hashed_password=get_password_hash("driver123"),
        name="Driver Dat (Pham Van Dat)",
        status=DriverStatus.ON_DUTY,
        current_route_id=r1.id,
        phone="0905888999",
        email="driver.dat@wasteoptimizer.com",
        is_active=True
    )
    d2 = Driver(
        driver_id="driver_b",
        hashed_password=get_password_hash("driver123"),
        name="Driver B (Nguyen Van B)",
        status=DriverStatus.ON_DUTY,
        current_route_id=r2.id,
        phone="0905111222",
        email="driver.b@wasteoptimizer.com",
        is_active=True
    )
    d3 = Driver(
        driver_id="driver_c",
        hashed_password=get_password_hash("driver123"),
        name="Driver C (Le Van C)",
        status=DriverStatus.ON_DUTY,
        current_route_id=r3.id,
        phone="0905333444",
        email="driver.c@wasteoptimizer.com",
        is_active=True
    )
    db.add_all([d1, d2, d3])
    db.commit()

    # 4. Seed EXACTLY 30 Active IoT Bins (10 per District)
    hc_bins = [
        ("BIN-HC-001", 16.0682, 108.2208, "Bach Dang Street, Hai Chau", 85.0),
        ("BIN-HC-002", 16.0645, 108.2223, "Tran Phu Street, Hai Chau", 92.0),
        ("BIN-HC-003", 16.0610, 108.2198, "Phan Chau Trinh, Hai Chau", 78.0),
        ("BIN-HC-004", 16.0578, 108.2215, "Le Dinh Duong, Hai Chau", 88.0),
        ("BIN-HC-005", 16.0532, 108.2230, "2 Thang 9 Street, Hai Chau", 95.0),
        ("BIN-HC-006", 16.0501, 108.2185, "Nguyen Van Linh, Hai Chau", 72.0),
        ("BIN-HC-007", 16.0465, 108.2152, "Hoang Diu Street, Hai Chau", 81.0),
        ("BIN-HC-008", 16.0430, 108.2190, "Trung Nu Vuong, Hai Chau", 65.0),
        ("BIN-HC-009", 16.0395, 108.2225, "30 Thang 4 Street, Hai Chau", 89.0),
        ("BIN-HC-010", 16.0350, 108.2170, "Le Thanh Nghi, Hai Chau", 76.0),
    ]

    st_bins = [
        ("BIN-ST-001", 16.0725, 108.2320, "Vo Van Kiet, Son Tra", 90.0),
        ("BIN-ST-002", 16.0690, 108.2380, "Pham Van Dong, Son Tra", 84.0),
        ("BIN-ST-003", 16.0650, 108.2435, "Vo Nguyen Giap, Son Tra", 96.0),
        ("BIN-ST-004", 16.0612, 108.2350, "Tran Hung Dao, Son Tra", 79.0),
        ("BIN-ST-005", 16.0580, 108.2395, "Ngo Quyen Street, Son Tra", 87.0),
        ("BIN-ST-006", 16.0545, 108.2440, "Nguyen Van Thoai, Son Tra", 91.0),
        ("BIN-ST-007", 16.0760, 108.2290, "Le Duc Tho, Son Tra", 73.0),
        ("BIN-ST-008", 16.0800, 108.2340, "Yet Kieu Street, Son Tra", 82.0),
        ("BIN-ST-009", 16.0840, 108.2400, "Hoang Sa Street, Son Tra", 68.0),
        ("BIN-ST-010", 16.0510, 108.2475, "My Khe Beach Area, Son Tra", 94.0),
    ]

    lc_bins = [
        ("BIN-LC-001", 16.0750, 108.1530, "Ton Duc Thang, Lien Chieu", 88.0),
        ("BIN-LC-002", 16.0790, 108.1480, "Nguyen Luan Bieu, Lien Chieu", 74.0),
        ("BIN-LC-003", 16.0830, 108.1420, "DUT Campus Area, Lien Chieu", 93.0),
        ("BIN-LC-004", 16.0870, 108.1370, "Au Co Street, Lien Chieu", 80.0),
        ("BIN-LC-005", 16.0910, 108.1310, "Pham Nhu Xuong, Lien Chieu", 86.0),
        ("BIN-LC-006", 16.0950, 108.1250, "Nguyen Tat Thanh Rd, Lien Chieu", 71.0),
        ("BIN-LC-007", 16.0710, 108.1580, "Nam Cao Street, Lien Chieu", 83.0),
        ("BIN-LC-008", 16.0670, 108.1630, "Hoang Van Thai, Lien Chieu", 69.0),
        ("BIN-LC-009", 16.1010, 108.1190, "Hoa Khanh IP, Lien Chieu", 91.0),
        ("BIN-LC-010", 16.1060, 108.1130, "Lien Chieu Port, Lien Chieu", 77.0),
    ]

    db_bins = []
    
    # Add Hai Chau bins
    for b_id, lat, lng, addr, fill in hc_bins:
        b = Bin(
            bin_id=b_id, latitude=lat, longitude=lng, address=addr,
            ward="Ward 1", district="Hai Chau", capacity=1000.0,
            current_fill_level=fill, bin_type="general", status="active"
        )
        db_bins.append(b)

    # Add Son Tra bins
    for b_id, lat, lng, addr, fill in st_bins:
        b = Bin(
            bin_id=b_id, latitude=lat, longitude=lng, address=addr,
            ward="Ward 2", district="Son Tra", capacity=1000.0,
            current_fill_level=fill, bin_type="recyclable", status="active"
        )
        db_bins.append(b)

    # Add Lien Chieu bins
    for b_id, lat, lng, addr, fill in lc_bins:
        b = Bin(
            bin_id=b_id, latitude=lat, longitude=lng, address=addr,
            ward="Ward 3", district="Lien Chieu", capacity=1000.0,
            current_fill_level=fill, bin_type="organic", status="active"
        )
        db_bins.append(b)

    db.add_all(db_bins)
    db.commit()

    # 5. Link Bins to Routes via CollectionHistory (10 stops per route)
    all_seeded_bins = db.query(Bin).all()
    hc_db_bins = [b for b in all_seeded_bins if b.district == "Hai Chau"]
    st_db_bins = [b for b in all_seeded_bins if b.district == "Son Tra"]
    lc_db_bins = [b for b in all_seeded_bins if b.district == "Lien Chieu"]

    histories = []
    # Link Route 1 (Hai Chau - Driver Dat - IN TRANSIT): 3 completed stops, 7 pending stops
    for idx, b in enumerate(hc_db_bins):
        is_done = idx < 3
        histories.append(CollectionHistory(
            bin_id=b.id, route_id=r1.id,
            collection_time=datetime.utcnow() - timedelta(minutes=30 * idx) if is_done else None,
            fill_level_before=b.current_fill_level,
            fill_level_after=0.0 if is_done else None,
            waste_collected=150.0 + (idx * 10) if is_done else 0.0,
            notes=f"Stop {idx + 1} - Hai Chau Route (Driver Dat)"
        ))

    # Link Route 2 (Son Tra - Driver B - COMPLETED): All 10 stops completed
    for idx, b in enumerate(st_db_bins):
        histories.append(CollectionHistory(
            bin_id=b.id, route_id=r2.id,
            collection_time=datetime.utcnow() - timedelta(hours=idx * 2 + 1),
            fill_level_before=b.current_fill_level,
            fill_level_after=0.0,
            waste_collected=180.0 + (idx * 12),
            notes=f"Stop {idx + 1} - Son Tra Route (Driver B)"
        ))

    # Link Route 3 (Lien Chieu - Driver C - PENDING): All 10 stops pending
    for idx, b in enumerate(lc_db_bins):
        histories.append(CollectionHistory(
            bin_id=b.id, route_id=r3.id,
            collection_time=None,
            fill_level_before=b.current_fill_level,
            fill_level_after=None,
            waste_collected=0.0,
            notes=f"Stop {idx + 1} - Lien Chieu Route (Driver C)"
        ))

    db.add_all(histories)
    db.commit()
    db.close()

    print(f"✅ Successfully seeded database: 30 Bins (10 per district), 3 Routes, 5 Users.")

if __name__ == "__main__":
    seed()
