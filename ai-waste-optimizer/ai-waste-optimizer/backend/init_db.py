#!/usr/bin/env python
"""
Database Initialization Script for AI Waste Optimizer
Creates tables and seeds initial data for development.
"""

import os
import sys
from datetime import datetime, timedelta
import random

# Add project root to path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
sys.path.insert(0, project_root)

from backend.database import engine, Base, SessionLocal
from backend.models.models import (
    User, Bin, CollectionRoute, CollectionHistory, 
    Feedback, Notification, KPI, UserRole
)
from backend.auth.auth import get_password_hash

def init_database():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("? Database tables created successfully")

def seed_users(db_session):
    """Seed initial users."""
    print("\nSeeding users...")
    
    # Check if users already exist
    existing = db_session.query(User).first()
    if existing:
        print("? Users already exist, skipping...")
        return
    
    users_data = [
        {
            "email": "admin.an@wasteoptimizer.com",
            "username": "admin_an",
            "full_name": "Admin An",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "phone": "+84905123456",
            "address": "Hai Chau District, Danang"
        },
        {
            "email": "dispatcher.duy@wasteoptimizer.com",
            "username": "dispatcher_duy",
            "full_name": "Dispatcher Duy",
            "password": "manager123",
            "role": UserRole.MANAGER,
            "phone": "+84905654321",
            "address": "Son Tra District, Danang"
        },
        {
            "email": "driver.dat@wasteoptimizer.com",
            "username": "driver_dat",
            "full_name": "Driver Dat",
            "password": "driver123",
            "role": UserRole.DRIVER,
            "phone": "+84905888999",
            "address": "Ngu Hanh Son District, Danang"
        }
    ]
    
    for data in users_data:
        user = User(
            email=data["email"],
            username=data["username"],
            full_name=data["full_name"],
            hashed_password=get_password_hash(data["password"]),
            role=data["role"],
            phone=data["phone"],
            address=data["address"],
            is_active=True
        )
        db_session.add(user)
    
    db_session.commit()
    print(f"? Created {len(users_data)} users")

def seed_bins(db_session):
    """Seed initial 30 bins across 3 districts."""
    print("\nSeeding 30 bins...")
    
    existing = db_session.query(Bin).first()
    if existing:
        print("? Bins already exist, skipping...")
        return
    
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

    bins = []
    for b_id, lat, lng, addr, fill in hc_bins:
        bins.append(Bin(
            bin_id=b_id, latitude=lat, longitude=lng, address=addr,
            ward="Ward 1", district="Hai Chau", capacity=1000.0,
            current_fill_level=fill, bin_type="general", status="active"
        ))
    for b_id, lat, lng, addr, fill in st_bins:
        bins.append(Bin(
            bin_id=b_id, latitude=lat, longitude=lng, address=addr,
            ward="Ward 2", district="Son Tra", capacity=1000.0,
            current_fill_level=fill, bin_type="recyclable", status="active"
        ))
    for b_id, lat, lng, addr, fill in lc_bins:
        bins.append(Bin(
            bin_id=b_id, latitude=lat, longitude=lng, address=addr,
            ward="Ward 3", district="Lien Chieu", capacity=1000.0,
            current_fill_level=fill, bin_type="organic", status="active"
        ))
    
    db_session.add_all(bins)
    db_session.commit()
    print(f"? Created {len(bins)} bins")

def seed_routes(db_session):
    """Seed initial collection routes."""
    print("\nSeeding routes...")
    
    existing = db_session.query(CollectionRoute).first()
    if existing:
        print("? Routes already exist, skipping...")
        return
    
    vehicles = ["TRK-001", "TRK-002", "TRK-003", "TRK-004", "TRK-005"]
    drivers = ["Nguyen Van A", "Tran Van B", "Le Van C", "Pham Van D", "Hoang Van E"]
    statuses = ["pending", "pending", "in_progress", "completed"]
    
    routes = []
    for i in range(1, 21):  # 20 routes
        scheduled = datetime.utcnow() + timedelta(days=random.randint(0, 30))
        route = CollectionRoute(
            route_id=f"RT-{i:04d}",
            route_name=f"Route {chr(64 + (i // 2) + 1)}-{i}",
            vehicle_id=random.choice(vehicles),
            driver_name=random.choice(drivers),
            total_distance=round(random.uniform(10, 50), 1),
            estimated_time=round(random.uniform(120, 480), 1),
            status=random.choice(statuses),
            scheduled_date=scheduled,
            started_at=scheduled - timedelta(hours=2) if i > 10 else None,
            completed_at=scheduled - timedelta(hours=1) if i > 15 else None,
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        routes.append(route)
    
    db_session.add_all(routes)
    db_session.commit()
    print(f"? Created {len(routes)} routes")

def seed_collection_history(db_session):
    """Seed collection history."""
    print("\nSeeding collection history...")
    
    existing = db_session.query(CollectionHistory).first()
    if existing:
        print("? Collection history already exists, skipping...")
        return
    
    bins = db_session.query(Bin).all()
    routes = db_session.query(CollectionRoute).all()
    
    if not bins or not routes:
        print("? Skipping: need bins and routes first")
        return
    
    histories = []
    for i in range(100):
        history = CollectionHistory(
            bin_id=random.choice(bins).id,
            route_id=random.choice(routes).id,
            collection_time=datetime.utcnow() - timedelta(days=random.randint(0, 60)),
            fill_level_before=round(random.uniform(50, 100), 1),
            fill_level_after=round(random.uniform(0, 20), 1),
            waste_collected=round(random.uniform(50, 500), 1),
            notes=random.choice(["Normal collection", "Overflow detected", "Scheduled pickup", ""])
        )
        histories.append(history)
    
    db_session.add_all(histories)
    db_session.commit()
    print(f"? Created {len(histories)} collection history records")

def seed_feedback(db_session):
    """Seed feedback."""
    print("\nSeeding feedback...")
    
    existing = db_session.query(Feedback).first()
    if existing:
        print("? Feedback already exists, skipping...")
        return
    
    users = db_session.query(User).all()
    categories = ["complaint", "suggestion", "compliment", "incident"]
    statuses_list = ["pending", "reviewed", "resolved"]
    
    if not users:
        print("? Skipping: need users first")
        return
    
    feedbacks = []
    for i in range(30):
        feedback = Feedback(
            user_id=random.choice(users).id,
            title=f"Feedback #{i+1}: {random.choice(['Issue', 'Suggestion', 'Compliment'])}",
            content=f"This is sample feedback content for item {i+1}. " * 3,
            category=random.choice(categories),
            status=random.choice(statuses_list),
            latitude=round(random.uniform(16.04, 16.08), 6),
            longitude=round(random.uniform(108.20, 108.25), 6),
            address=f"Sample Address {i+1}",
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        feedbacks.append(feedback)
    
    db_session.add_all(feedbacks)
    db_session.commit()
    print(f"? Created {len(feedbacks)} feedback items")

def seed_notifications(db_session):
    """Seed notifications."""
    print("\nSeeding notifications...")
    
    existing = db_session.query(Notification).first()
    if existing:
        print("? Notifications already exist, skipping...")
        return
    
    users = db_session.query(User).all()
    
    if not users:
        print("? Skipping: need users first")
        return
    
    notifications = []
    for user in users:
        for i in range(5):
            notification = Notification(
                user_id=user.id,
                title=f"Notification for {user.username} #{i+1}",
                content=f"This is a sample notification message for {user.username}.",
                notification_type=random.choice(["bin_full", "route_update", "feedback_reply", "system"]),
                is_read=random.choice([True, False, False]),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 14))
            )
            notifications.append(notification)
    
    db_session.add_all(notifications)
    db_session.commit()
    print(f"? Created {len(notifications)} notifications")

def seed_kpis(db_session):
    """Seed KPI data."""
    print("\nSeeding KPI data...")
    
    existing = db_session.query(KPI).first()
    if existing:
        print("? KPI data already exists, skipping...")
        return
    
    kpis = []
    for i in range(30):  # 30 days of KPI data
        kpi = KPI(
            date=datetime.utcnow().date() - timedelta(days=i),
            total_waste_collected=round(random.uniform(1000, 5000), 1),
            total_distance_traveled=round(random.uniform(200, 800), 1),
            total_bins_collected=random.randint(20, 50),
            average_fill_level=round(random.uniform(40, 75), 1),
            efficiency_score=round(random.uniform(70, 95), 1),
            co2_saved=round(random.uniform(50, 200), 1),
            cost_savings=round(random.uniform(1000, 5000), 1),
            created_at=datetime.utcnow() - timedelta(days=i)
        )
        kpis.append(kpi)
    
    db_session.add_all(kpis)
    db_session.commit()
    print(f"? Created {len(kpis)} KPI records")

def main():
    """Main initialization function."""
    print("=" * 60)
    print("  AI Waste Optimizer - Database Initialization")
    print("=" * 60)
    
    db_session = SessionLocal()
    
    try:
        init_database()
        seed_users(db_session)
        seed_bins(db_session)
        seed_routes(db_session)
        seed_collection_history(db_session)
        seed_feedback(db_session)
        seed_notifications(db_session)
        seed_kpis(db_session)
        
        print("\n" + "=" * 60)
        print("  ? Database initialization complete!")
        print("=" * 60)
        print("\nDefault credentials:")
        print("  Admin:  admin@wasteoptimizer.com / admin123")
        print("  Manager: manager@wasteoptimizer.com / manager123")
        print("  User:   user@wasteoptimizer.com / user123")
        print()
        
    except Exception as e:
        print(f"\n? Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db_session.close()

if __name__ == "__main__":
    main()
