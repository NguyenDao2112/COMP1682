"""
Script to seed driver route data for Android app testing.
Creates 10 waste bins in District 1, Ho Chi Minh City with realistic coordinates.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
from backend.database import SessionLocal, engine, Base
from backend.models.models import Bin, CollectionRoute, CollectionHistory, Driver
from backend.auth.auth import get_password_hash

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_driver_route():
    """Seed driver, route, bins and collection history for Android testing."""
    
    print("🗑️  Starting seed data for Driver Route Sequence...")
    
    # ============= STEP 1: Create or get driver =============
    driver_id = "driver_route_001"
    existing_driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    
    if existing_driver:
        print(f"✓ Driver '{driver_id}' already exists")
        driver = existing_driver
    else:
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
        print(f"✓ Created driver '{driver_id}'")
    
    # ============= STEP 2: Create or get collection route =============
    route_id = "ROUTE_QD1_001"
    existing_route = db.query(CollectionRoute).filter(CollectionRoute.route_id == route_id).first()
    
    if existing_route:
        print(f"✓ Route '{route_id}' already exists")
        route = existing_route
    else:
        route = CollectionRoute(
            route_id=route_id,
            route_name="District 1 - Zone 4 Collection Route",
            vehicle_id="TRUCK_001",
            driver_name=driver.name,
            total_distance=8.5,
            estimated_time=120,  # 2 hours
            status="in_progress",
            scheduled_date=datetime.utcnow() + timedelta(days=1)
        )
        db.add(route)
        db.commit()
        db.refresh(route)
        print(f"✓ Created route '{route_id}'")
    
    # Update driver's current route
    driver.current_route_id = route.id
    db.commit()
    print(f"✓ Assigned route to driver")
    
    # ============= STEP 3: Create bins in Hai Chau, Da Nang =============
    # Da Nang coordinates range approximately:
    # Latitude: 16.04 - 16.08
    # Longitude: 108.20 - 108.24
    
    bins_data = [
        {
            "bin_id": "BIN_QD1_001",
            "address": "32 Bach Dang Street (North Harbor)",
            "latitude": 16.0790,
            "longitude": 108.2240,
            "fill_level": 92.5,
            "bin_type": "Commercial",
            "ward": "Thach Thang",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_002",
            "address": "150 Bach Dang Street (Near Le Duan)",
            "latitude": 16.0760,
            "longitude": 108.2235,
            "fill_level": 78.3,
            "bin_type": "Commercial",
            "ward": "Thach Thang",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_003",
            "address": "260 Bach Dang Street (Han River Swing Bridge)",
            "latitude": 16.0730,
            "longitude": 108.2230,
            "fill_level": 45.6,
            "bin_type": "Public",
            "ward": "Hai Chau I",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_004",
            "address": "Indochina Riverside Mall, Bach Dang",
            "latitude": 16.0700,
            "longitude": 108.2225,
            "fill_level": 65.4,
            "bin_type": "Public",
            "ward": "Hai Chau I",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_005",
            "address": "Han Market Area, Bach Dang",
            "latitude": 16.0670,
            "longitude": 108.2220,
            "fill_level": 32.1,
            "bin_type": "Residential",
            "ward": "Hai Chau I",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_006",
            "address": "Cham Museum, 2/9 Street",
            "latitude": 16.0610,
            "longitude": 108.2210,
            "fill_level": 88.9,
            "bin_type": "Commercial",
            "ward": "Binh Thuan",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_007",
            "address": "29/3 Park, Nguyen Van Linh",
            "latitude": 16.0595,
            "longitude": 108.2105,
            "fill_level": 55.2,
            "bin_type": "Public",
            "ward": "Thac Gian",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_008",
            "address": "Residential Area - Nguyen Chi Thanh",
            "latitude": 16.0645,
            "longitude": 108.2208,
            "fill_level": 41.7,
            "bin_type": "Residential",
            "ward": "Hai Chau I",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_009",
            "address": "Residential Area - 84 Le Loi Street",
            "latitude": 16.0712,
            "longitude": 108.2201,
            "fill_level": 73.5,
            "bin_type": "Commercial",
            "ward": "Thach Thang",
            "district": "Hai Chau"
        },
        {
            "bin_id": "BIN_QD1_010",
            "address": "523 Tran Phu Street",
            "latitude": 16.0760,
            "longitude": 108.2215,
            "fill_level": 59.8,
            "bin_type": "Public",
            "ward": "Thach Thang",
            "district": "Hai Chau"
        }
    ]
    
    created_bins = []
    for bin_data in bins_data:
        existing_bin = db.query(Bin).filter(Bin.bin_id == bin_data["bin_id"]).first()
        if existing_bin:
            print(f"  ✓ Bin '{bin_data['bin_id']}' already exists, updating coordinates & address")
            existing_bin.address = bin_data["address"]
            existing_bin.latitude = bin_data["latitude"]
            existing_bin.longitude = bin_data["longitude"]
            existing_bin.ward = bin_data["ward"]
            existing_bin.district = bin_data["district"]
            existing_bin.current_fill_level = bin_data["fill_level"]
            db.commit()
            bin_obj = existing_bin
        else:
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
            print(f"  ✓ Created bin '{bin_data['bin_id']}' - {bin_data['bin_type']}")
        
        created_bins.append(bin_obj)
    
    print(f"✓ Total bins created/loaded: {len(created_bins)}")
    
    # ============= STEP 4: Create collection history (link bins to route) =============
    # Remove existing history for this route to avoid duplicates
    existing_history = db.query(CollectionHistory).filter(
        CollectionHistory.route_id == route.id
    ).all()
    for h in existing_history:
        db.delete(h)
    db.commit()
    
    for idx, bin_obj in enumerate(created_bins, 1):
        history = CollectionHistory(
            bin_id=bin_obj.id,
            route_id=route.id,
            collection_time=datetime.utcnow() + timedelta(hours=idx),
            fill_level_before=bin_obj.current_fill_level,
            fill_level_after=max(0, bin_obj.current_fill_level - 30),  # Assume 30% collected
            waste_collected=50.0 * (bin_obj.current_fill_level / 100),  # Proportional to fill level
            notes=f"Stop {idx} in route sequence"
        )
        db.add(history)
    
    db.commit()
    print(f"✓ Created collection history for all bins in route")
    
    # ============= SUMMARY =============
    print("\n" + "="*60)
    print("✅ SEED DATA COMPLETED SUCCESSFULLY")
    print("="*60)
    print(f"\n📍 Driver Route Information:")
    print(f"   - Driver ID: {driver_id}")
    print(f"   - Driver Name: {driver.name}")
    print(f"   - Route ID: {route_id}")
    print(f"   - Route Name: {route.route_name}")
    print(f"   - Status: {route.status}")
    print(f"\n🗑️  Bins in Route (Hai Chau, Da Nang):")
    print(f"   - Total Bins: {len(created_bins)}")
    print(f"   - Location: Hai Chau District, Da Nang City")
    print(f"   - Latitude Range: 16.0595 - 16.0722")
    print(f"   - Longitude Range: 108.2105 - 108.2255")
    print(f"\n📱 Android App Testing:")
    print(f"   - Login as: {driver_id} / password123")
    print(f"   - Call: GET /api/driver/route/sequence")
    print(f"   - Expected: JSON with {len(created_bins)} bins")
    print(f"   - Map Display: Bins distributed in District 1 area")
    print("="*60 + "\n")

if __name__ == "__main__":
    try:
        seed_driver_route()
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
