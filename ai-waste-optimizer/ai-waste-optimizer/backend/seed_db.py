import os
import sys

# Determine project root directory
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from backend.database import SessionLocal, engine, Base
from backend.models.models import Bin, Driver, CollectionRoute, DriverStatus, User
from backend.auth.auth import get_password_hash

def seed():
    print("Starting database seed/fix...")
    db = SessionLocal()
    
    # 0. Seed Users
    if not db.query(User).filter(User.email == "admin@aiwaste.com").first():
        db.add(User(
            username="admin",
            email="admin@aiwaste.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Admin",
            role="admin",
            is_active=True
        ))
        
    if not db.query(User).filter(User.email == "manager@wasteoptimizer.com").first():
        db.add(User(
            username="manager",
            email="manager@wasteoptimizer.com",
            hashed_password=get_password_hash("manager123"),
            full_name="Operations Manager",
            role="manager",
            is_active=True
        ))
    db.commit()

    # 1. Fix Drivers: Set all to ACTIVE
    drivers = db.query(Driver).all()
    count = 0
    for d in drivers:
        if d.status == DriverStatus.INACTIVE or d.status == "Inactive":
            d.status = DriverStatus.ACTIVE
            count += 1
    
    if count > 0:
        print(f"Fixed {count} drivers, set to ACTIVE.")
        
    # 2. Add some dummy routes if none exist
    routes = db.query(CollectionRoute).all()
    if not routes:
        print("No routes found. Creating dummy routes...")
        r1 = CollectionRoute(
            route_id="RT-001",
            route_name="Hai Chau Route",
            vehicle_id="DX-1001",
            driver_name="Nguyen Van Tuan",
            status="in_progress"
        )
        r2 = CollectionRoute(
            route_id="RT-002",
            route_name="Son Tra Route",
            vehicle_id="DX-1002",
            driver_name="Tran Van B",
            status="completed"
        )
        db.add_all([r1, r2])
        
    db.commit()
    db.close()
    print("Database seed/fix complete.")

if __name__ == "__main__":
    seed()
