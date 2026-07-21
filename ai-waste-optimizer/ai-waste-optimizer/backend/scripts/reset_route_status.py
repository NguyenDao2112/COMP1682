"""
reset_route_status.py - Reset collection status to 'pending' for all bins in current route.
Run from project root: python backend/scripts/reset_route_status.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.database import SessionLocal
from backend.models.models import CollectionHistory, Bin

db = SessionLocal()

def reset():
    histories = db.query(CollectionHistory).all()
    count = 0
    for h in histories:
        if h.fill_level_after is not None and h.fill_level_after < h.fill_level_before:
            h.fill_level_after = None
            count += 1
    db.commit()
    print(f"Reset {count} collected history records to pending.")

    # Also reset bin fill levels back to original values from history
    for h in histories:
        if h.bin and h.fill_level_before is not None:
            h.bin.current_fill_level = h.fill_level_before
    db.commit()
    print("Reset bin fill levels to pre-collection values.")

if __name__ == "__main__":
    try:
        reset()
    finally:
        db.close()
