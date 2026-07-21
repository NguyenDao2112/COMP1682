"""
reseed_all.py - Clear all data and reseed fresh data for Hai Chau, Da Nang
Run this script to reset the entire database to a clean state with:
- 1 driver (driver_route_001)
- 1 route (ROUTE_QD1_001) assigned to driver
- 10 bins in Hai Chau, Da Nang with real GPS coordinates
- Collection history linking all bins to the route
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timedelta
from backend.database import SessionLocal, engine, Base
from backend.models.models import Bin, CollectionRoute, CollectionHistory, Driver, User, Feedback, Notification, KPI
from backend.auth.auth import get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()

def clear_all_data():
    """Clear all existing data from database."""
    print("Clearing all existing data...")
    
    db.query(CollectionHistory).delete()
    db.query(Bin).delete()
    db.query(CollectionRoute).delete()
    db.query(Driver).delete()
    db.query(Notification).delete()
    db.query(Feedback).delete()
    db.query(KPI).delete()
    db.query(User).delete()
    
    db.commit()
    print("All data cleared successfully.\n")

def seed_admin_user():
    """Create default admin user if not exists."""
    print("Creating admin user...")
    admin = User(
        email="admin@wasteoptimizer.com",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        full_name="System Administrator",
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Created admin user: {admin.email}\n")

def seed_driver_route():
    """Seed driver, route, bins and collection history for Android testing."""
    
    print("Seeding driver route data for Hai Chau, Da Nang...")
    
    # ============= STEP 1: Create driver =============
    driver_id = "driver_route_001"
    driver = Driver(
        driver_id=driver_id,
        name="Nguyen Van Tuan",
        hashed_password=get_password_hash("password123"),
        status="On Duty",
        phone="0987654321",
        email="driver.tuan@example.com",
        is_active=True
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    print(f"Created driver: {driver_id} ({driver.name})")
    
    # ============= STEP 2: Create collection route =============
    route_id = "ROUTE_QD1_001"
    route = CollectionRoute(
        route_id=route_id,
        route_name="Hai Chau District Collection Route",
        vehicle_id="TRUCK_001",
        driver_name=driver.name,
        total_distance=12.5,
        estimated_time=180,
        status="in_progress",
        scheduled_date=datetime.utcnow() + timedelta(days=1)
    )
    db.add(route)
    db.commit()
    db.refresh(route)
    print(f"Created route: {route_id}")
    
    # Update driver's current route
    driver.current_route_id = route.id
    db.commit()
    print(f"Assigned route {route_id} to driver {driver_id}\n")
    
    # ============= STEP 3: Create 10 bins in Hai Chau, Da Nang =============
    bins_data = [
        {
            "bin_id": "BIN_001",
            "address": "842 Le Loi Street, Hai Chau",
            "latitude": 16.0544,
            "longitude": 108.2022,
            "fill_level": 92.5,
            "bin_type": "Commercial",
            "ward": "Hai Chau I",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_002",
            "address": "123 Nguyen Chi Thanh Street",
            "latitude": 16.0567,
            "longitude": 108.2078,
            "fill_level": 78.3,
            "bin_type": "Commercial",
            "ward": "Hai Chau II",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_003",
            "address": "45 Tran Phu Street",
            "latitude": 16.0589,
            "longitude": 108.2101,
            "fill_level": 45.6,
            "bin_type": "Public",
            "ward": "Thanh Binh",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_004",
            "address": "789 Bach Dang Street",
            "latitude": 16.0534,
            "longitude": 108.2245,
            "fill_level": 65.4,
            "bin_type": "Public",
            "ward": "Tho Quang",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_005",
            "address": "321 Nguyen Trai Street",
            "latitude": 16.0598,
            "longitude": 108.2156,
            "fill_level": 32.1,
            "bin_type": "Residential",
            "ward": "Hai Chau I",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_006",
            "address": "156 Ho Nghinh Street",
            "latitude": 16.0612,
            "longitude": 108.2189,
            "fill_level": 88.9,
            "bin_type": "Commercial",
            "ward": "Nai Nam",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_007",
            "address": "88 Dien Bien Phu Street",
            "latitude": 16.0556,
            "longitude": 108.2089,
            "fill_level": 55.2,
            "bin_type": "Public",
            "ward": "Hai Chau II",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_008",
            "address": "234 Nguyen Van Linh Street",
            "latitude": 16.0578,
            "longitude": 108.2123,
            "fill_level": 41.7,
            "bin_type": "Residential",
            "ward": "Thanh Binh",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_009",
            "address": "567 Phan Chau Trinh Street",
            "latitude": 16.0539,
            "longitude": 108.2056,
            "fill_level": 73.5,
            "bin_type": "Commercial",
            "ward": "Hai Chau I",
            "district": "Hai Chau, Da Nang"
        },
        {
            "bin_id": "BIN_010",
            "address": "901 Le Duan Street",
            "latitude": 16.0601,
            "longitude": 108.2178,
            "fill_level": 59.8,
            "bin_type": "Public",
            "ward": "Thanh Khe",
            "district": "Hai Chau, Da Nang"
        }
    ]
    
    created_bins = []
    for bin_data in bins_data:
        bin_obj = Bin(
            bin_id=bin_data["bin_id"],
            address=bin_data["address"],
            latitude=bin_data["latitude"],
            longitude=bin_data["longitude"],
            ward=bin_data["ward"],
            district=bin_data["district"],
            capacity=1000.0,
            current_fill_level=bin_data["fill_level"],
            bin_type=bin_data["bin_type"],
            status="active"
        )
        db.add(bin_obj)
        db.commit()
        db.refresh(bin_obj)
        created_bins.append(bin_obj)
        print(f"  Created bin: {bin_data['bin_id']} ({bin_data['address']})")
    
    print(f"Total bins created: {len(created_bins)}\n")
    
    # ============= STEP 4: Create collection history (link bins to route) =============
    print("Creating collection history...")
    for idx, bin_obj in enumerate(created_bins, 1):
        history = CollectionHistory(
            bin_id=bin_obj.id,
            route_id=route.id,
            collection_time=datetime.utcnow() + timedelta(hours=idx),
            fill_level_before=bin_obj.current_fill_level,
            fill_level_after=None,
            waste_collected=0,
            notes=f"Stop {idx} in route sequence"
        )
        db.add(history)
    
    db.commit()
    print(f"Collection history created for all {len(created_bins)} bins\n")
    
    return driver, route, created_bins

if __name__ == "__main__":
    try:
        clear_all_data()
        seed_admin_user()
        driver, route, bins = seed_driver_route()
        
        print("\n" + "="*60)
        print("RESEED ALL COMPLETED SUCCESSFULLY")
        print("="*60)
        print(f"\nDriver Account:")
        print(f"   - Driver ID: driver_route_001")
        print(f"   - Password: password123")
        print(f"   - Name: {driver.name}")
        print(f"   - Status: {driver.status}")
        print(f"\nRoute Information:")
        print(f"   - Route ID: ROUTE_QD1_001")
        print(f"   - District: Hai Chau, Da Nang")
        print(f"   - Total Stops: {len(bins)}")
        print(f"   - Status: {route.status}")
        print(f"\nGPS Coordinates (Bins):")
        print(f"   - Latitude Range: 16.0534 - 16.0612")
        print(f"   - Longitude Range: 108.2022 - 108.2245")
        print(f"\nAndroid App Endpoints:")
        print(f"   - Login: POST /api/driver/login")
        print(f"   - Route Sequence: GET /api/driver/route/sequence")
        print(f"   - Route Details: GET /api/driver/route/ROUTE_QD1_001/details")
        print(f"   - Token Expiry: 24 hours (1440 minutes)")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"Error during reseed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()
