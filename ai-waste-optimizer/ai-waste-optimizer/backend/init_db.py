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
            "email": "admin@wasteoptimizer.com",
            "username": "admin",
            "full_name": "Admin User",
            "password": "admin123",
            "role": UserRole.ADMIN,
            "phone": "+84123456789",
            "address": "123 Admin Street"
        },
        {
            "email": "manager@wasteoptimizer.com",
            "username": "manager",
            "full_name": "Manager User",
            "password": "manager123",
            "role": UserRole.MANAGER,
            "phone": "+84123456788",
            "address": "456 Manager Avenue"
        },
        {
            "email": "user@wasteoptimizer.com",
            "username": "user",
            "full_name": "Regular User",
            "password": "user123",
            "role": UserRole.USER,
            "phone": "+84123456787",
            "address": "789 User Road"
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
    """Seed initial bins."""
    print("\nSeeding bins...")
    
    existing = db_session.query(Bin).first()
    if existing:
        print("? Bins already exist, skipping...")
        return
    
    districts = ["Hai Chau", "Thanh Khe", "Son Tra", "Ngu Hanh Son", "Lien Chieu"]
    wards = ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7", "Ward 8", "Ward 9", "Ward 10"]
    bin_types = ["general", "recyclable", "organic", "hazardous"]
    statuses = ["active", "active", "active", "maintenance"]  # Mostly active
    
    random.seed(42)  # Reproducible
    
    bins = []
    for i in range(1, 51):  # 50 bins
        district = random.choice(districts)
        lat = round(random.uniform(16.04, 16.08), 6)
        lng = round(random.uniform(108.20, 108.25), 6)
        
        bin_obj = Bin(
            bin_id=f"BIN-{i:04d}",
            latitude=lat,
            longitude=lng,
            address=f"{random.choice(wards)}, {district} District",
            ward=random.choice(wards),
            district=district,
            capacity=round(random.uniform(500, 2000), 1),
            current_fill_level=round(random.uniform(0, 95), 1),
            bin_type=random.choice(bin_types),
            status=random.choice(statuses),
            last_collected=datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            next_scheduled=datetime.utcnow() + timedelta(days=random.randint(1, 14))
        )
        bins.append(bin_obj)
    
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
