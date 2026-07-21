from backend.database import SessionLocal
from backend.models.models import User, Driver
from backend.auth.auth import get_password_hash

def sync_drivers_to_users():
    db = SessionLocal()
    try:
        drivers = db.query(Driver).all()
        for driver in drivers:
            user = db.query(User).filter(User.username == driver.driver_id).first()
            if not user:
                print(f"Creating user for driver {driver.name} ({driver.driver_id})")
                new_user = User(
                    email=f"{driver.driver_id}@ai-waste.com",
                    username=driver.driver_id,
                    full_name=driver.name,
                    hashed_password=get_password_hash("driver123"),
                    role="driver",
                    phone="0901234567"
                )
                db.add(new_user)
        db.commit()
        print("Sync complete.")
    finally:
        db.close()

if __name__ == "__main__":
    sync_drivers_to_users()
