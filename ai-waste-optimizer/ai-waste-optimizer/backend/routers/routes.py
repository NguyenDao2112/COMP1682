# routers/routes.py - Routes API routes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models.models import CollectionRoute, User, CollectionHistory
from backend.schemas.schemas import RouteCreate, RouteUpdate, RouteResponse
from backend.auth.auth import get_current_active_user, require_manager

router = APIRouter(prefix="/api/routes", tags=["Routes"])

@router.get("", response_model=List[RouteResponse])
def get_routes(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    scheduled_date: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all routes with optional filters."""
    query = db.query(CollectionRoute)
    
    if status_filter:
        query = query.filter(CollectionRoute.status == status_filter)
    if scheduled_date:
        query = query.filter(CollectionRoute.scheduled_date == scheduled_date)
    if search:
        query = query.filter(
            (CollectionRoute.route_id.ilike(f"%{search}%")) |
            (CollectionRoute.route_name.ilike(f"%{search}%")) |
            (CollectionRoute.driver_name.ilike(f"%{search}%"))
        )
    
    routes = query.offset(skip).limit(limit).all()
    
    # Populate path coordinates for map visualization
    for route in routes:
        history_records = db.query(CollectionHistory).filter(CollectionHistory.route_id == route.id).all()
        route.path = [[h.bin.latitude, h.bin.longitude] for h in history_records if h.bin]
        
    return routes

@router.post("/optimize", response_model=dict)
def optimize_routes(db: Session = Depends(get_db), current_user: User = Depends(require_manager)):
    """Run VRP to optimize each active route individually without mixing districts."""
    from backend.models.models import Bin, CollectionHistory
    import math
    
    active_routes = db.query(CollectionRoute).filter(CollectionRoute.status.in_(["pending", "in_progress"])).all()
    if not active_routes:
        return {"status": "error", "message": "No active routes to optimize"}
        
    depot_lat, depot_lon = 16.0600, 108.2100
    optimized_count = 0
    
    for route_obj in active_routes:
        histories = db.query(CollectionHistory).filter(CollectionHistory.route_id == route_obj.id).all()
        if not histories:
            continue
            
        bins = [h.bin for h in histories if h.bin]
        if not bins:
            continue
            
        # Optimize sequence using Nearest Neighbor (Pure Python fallback)
        unvisited = [(b.id, b.latitude, b.longitude) for b in bins]
        current_loc = (depot_lat, depot_lon)
        optimized_bin_ids = []
        
        while unvisited:
            # Find nearest
            nearest = min(unvisited, key=lambda b: math.hypot(b[1] - current_loc[0], b[2] - current_loc[1]))
            optimized_bin_ids.append(nearest[0])
            current_loc = (nearest[1], nearest[2])
            unvisited.remove(nearest)
            
        # Update sequence in DB
        db.query(CollectionHistory).filter(CollectionHistory.route_id == route_obj.id).delete(synchronize_session=False)
        
        for idx, bin_id in enumerate(optimized_bin_ids):
            new_hist = CollectionHistory(
                route_id=route_obj.id,
                bin_id=bin_id,
                notes=f"Stop {idx + 1}",
                fill_level_before=next((b.current_fill_level for b in bins if b.id == bin_id), 0.0),
                fill_level_after=0.0
            )
            db.add(new_hist)
            
        optimized_count += 1
        
    db.commit()
    return {"status": "success", "message": "Routes optimized successfully", "vehicles_routed": optimized_count}

@router.post("/swap-trucks")
def swap_trucks(payload: dict, db: Session = Depends(get_db)):
    """Swap drivers and vehicles between two geographical routes."""
    try:
        route_id_1 = payload.get("route_id_1")
        route_id_2 = payload.get("route_id_2")
        if not route_id_1 or not route_id_2:
            raise HTTPException(status_code=400, detail="Missing route ids")
            
        r1 = db.query(CollectionRoute).filter(CollectionRoute.id == route_id_1).first()
        r2 = db.query(CollectionRoute).filter(CollectionRoute.id == route_id_2).first()
        if not r1 or not r2:
            raise HTTPException(status_code=404, detail="Route not found")
            
        from backend.models.models import Driver, CollectionHistory
        d1 = db.query(Driver).filter(Driver.name == r1.driver_name).first()
        d2 = db.query(Driver).filter(Driver.name == r2.driver_name).first()
        
        # Swap ONLY driver names between the two routes
        r1.driver_name, r2.driver_name = r2.driver_name, r1.driver_name
        
        # Swap the current_route_id for the drivers so their app updates
        if d1 and d2:
            d1.current_route_id, d2.current_route_id = r2.id, r1.id
        
        # Reset all stops to "pending" so driver app shows fresh collection tasks
        db.query(CollectionHistory).filter(CollectionHistory.route_id.in_([r1.id, r2.id])).update(
            {"collection_time": None}, synchronize_session=False
        )
            
        db.commit()
        return {"message": "Drivers swapped successfully"}
    except Exception as e:
        db.rollback()
        import traceback
        return {"detail": traceback.format_exc(), "error": str(e)}

@router.get("/{route_id}", response_model=RouteResponse)
def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific route by ID."""
    route = db.query(CollectionRoute).filter(CollectionRoute.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    # Populate path coordinates for map visualization
    history_records = db.query(CollectionHistory).filter(CollectionHistory.route_id == route.id).all()
    route.path = [[h.bin.latitude, h.bin.longitude] for h in history_records if h.bin]
    
    return route

@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
def create_route(
    route: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new route (admin/manager only)."""
    db_route = CollectionRoute(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.put("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: int,
    route_update: RouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a route (admin/manager only)."""
    route = db.query(CollectionRoute).filter(CollectionRoute.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    update_data = route_update.dict(exclude_unset=True)
    old_status = route.status
    for key, value in update_data.items():
        setattr(route, key, value)
        
    # If route is being marked as completed, mark all bins as collected
    if update_data.get("status") == "completed" and old_status != "completed":
        from backend.models.models import CollectionHistory
        from datetime import datetime
        history = db.query(CollectionHistory).filter(CollectionHistory.route_id == route.id).all()
        for h in history:
            h.fill_level_after = 0.0
            h.collection_time = datetime.utcnow()
            
    # If route is being reverted from completed to in_progress, reassign the driver and reset bins
    if old_status == "completed" and route.status == "in_progress":
        from backend.models.models import CollectionHistory
        
        # Safely attempt to reassign driver (drivers table might not exist)
        try:
            from backend.models.models import Driver, DriverStatus
            driver = db.query(Driver).filter(Driver.name == route.driver_name).first()
            if driver:
                driver.current_route_id = route.id
                driver.status = DriverStatus.ON_DUTY
        except Exception:
            pass # Ignore if table doesn't exist
            
        # Reset bins to pending
        history = db.query(CollectionHistory).filter(CollectionHistory.route_id == route.id).all()
        for h in history:
            h.fill_level_after = h.fill_level_before if h.fill_level_before is not None else 80.0
            h.collection_time = None
    
    db.commit()
    db.refresh(route)
    return route

@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete a route (admin/manager only)."""
    route = None
    if str(route_id).isdigit():
        route = db.query(CollectionRoute).filter(CollectionRoute.id == int(route_id)).first()
        
    if not route:
        # fallback to finding by string id if someone passes route_id string
        route = db.query(CollectionRoute).filter(CollectionRoute.route_id == str(route_id)).first()
        
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
        
    from backend.models.models import Driver, DriverStatus, CollectionHistory, User
    
    # Reset driver or delete if it's the demo driver
    driver = db.query(Driver).filter(Driver.current_route_id == route.id).first()
    if driver:
        # Also delete the associated User
        user = db.query(User).filter(User.username == driver.driver_id).first()
        if user:
            db.delete(user)
        db.delete(driver)
        
    # Delete associated history
    db.query(CollectionHistory).filter(CollectionHistory.route_id == route.id).delete()
    
    db.delete(route)
    db.commit()
    return None

@router.post("/{route_id}/start", response_model=RouteResponse)
def start_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Start a route."""
    route = db.query(CollectionRoute).filter(CollectionRoute.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    if route.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Route can only be started from pending status"
        )
    
    route.status = "in_progress"
    route.started_at = datetime.utcnow()
    db.commit()
    db.refresh(route)
    return route

@router.post("/{route_id}/complete", response_model=RouteResponse)
def complete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Complete a route."""
    route = db.query(CollectionRoute).filter(CollectionRoute.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Route not found"
        )
    
    if route.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Route can only be completed from in_progress status"
        )
    
    route.status = "completed"
    route.completed_at = datetime.utcnow()
    
    # Mark all bins as collected
    from backend.models.models import CollectionHistory
    history = db.query(CollectionHistory).filter(CollectionHistory.route_id == route_id).all()
    for h in history:
        h.fill_level_after = 0.0
        h.collection_time = datetime.utcnow()
    
    # Also find any driver assigned to this route and clear it
    from backend.models.models import Driver, DriverStatus
    driver = db.query(Driver).filter(Driver.current_route_id == route_id).first()
    if driver:
        driver.current_route_id = None
        driver.status = DriverStatus.ACTIVE
        
    db.commit()
    db.refresh(route)
    return route

@router.get("/map/all", response_model=List[dict])
def get_routes_for_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all routes with coordinates for map display."""
    routes = db.query(CollectionRoute).filter(
        CollectionRoute.status.in_(["pending", "in_progress"])
    ).all()
    return [
        {
            "id": route.id,
            "route_id": route.route_id,
            "route_name": route.route_name,
            "vehicle_id": route.vehicle_id,
            "driver_name": route.driver_name,
            "status": route.status,
            "scheduled_date": route.scheduled_date.isoformat() if route.scheduled_date else None
        }
        for route in routes
    ]

@router.post("/{driver_id}/assign", status_code=status.HTTP_200_OK)
def assign_new_route(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Simulate manager assigning a new route to a driver with 10 bins."""
    from backend.models.models import Driver, CollectionRoute, Bin, CollectionHistory, DriverStatus
    import uuid
    from datetime import timedelta
    
    driver = None
    if driver_id.isdigit():
        driver = db.query(Driver).filter(Driver.id == int(driver_id)).first()
    if not driver:
        driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
        
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    # Generate unique route ID
    unique_suffix = str(uuid.uuid4())[:6].upper()
    route_id = f"ROUTE_QD1_{unique_suffix}"
    
    driver_name_lower = driver.name.lower()
    
    base_lat = 16.0600
    base_lng = 108.2100
    district = "Hai Chau"
    vehicle = "TRUCK_001"
    
    if "tran van b" in driver_name_lower or "b" in driver_name_lower:
        base_lat = 16.0680
        base_lng = 108.1800
        district = "Thanh Khe"
        vehicle = "TRUCK_002"
    elif "tuan" in driver_name_lower or "tuấn" in driver_name_lower:
        base_lat = 16.0850
        base_lng = 108.2300
        district = "Son Tra"
        vehicle = "TRUCK_003"
    else:
        hash_val = sum(ord(c) for c in driver_name_lower)
        base_lat = 16.0500 + (hash_val % 100) * 0.0005
        base_lng = 108.2000 + (hash_val % 100) * 0.0005
        district = "Cam Le"
        vehicle = f"TRUCK_{100 + (hash_val % 900)}"
        
    route_name = f"{district} Route {unique_suffix}"
    
    route = CollectionRoute(
        route_id=route_id,
        route_name=route_name,
        vehicle_id=vehicle,
        driver_name=driver.name,
        total_distance=12.5,
        estimated_time=180,
        status="in_progress",
        scheduled_date=datetime.utcnow()
    )
    db.add(route)
    db.flush() # flush to get route.id without committing
    
    # Update driver
    driver.current_route_id = route.id
    driver.status = DriverStatus.ON_DUTY
    
    # Generate 10 distinct bins for this route
    route_bins = []
    import random
    for i in range(1, 11):
        lat = base_lat + (i * 0.0005) + random.uniform(-0.001, 0.001)
        lng = base_lng + (i * 0.001) + random.uniform(-0.001, 0.001)
        b = Bin(
            bin_id=f"BIN_{unique_suffix}_{i}",
            address=f"Stop {i}, {district}",
            latitude=lat,
            longitude=lng,
            ward=district,
            district=f"{district}, Da Nang",
            capacity=1000.0,
            current_fill_level=random.uniform(70.0, 100.0),
            bin_type="Commercial",
            status="active"
        )
        db.add(b)
        route_bins.append(b)
    db.flush()
        
    # Create history
    for idx, bin_obj in enumerate(route_bins, 1):
        # Reset fill level
        import random
        bin_obj.current_fill_level = random.uniform(70.0, 100.0)
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
    
    return {"status": "success", "message": f"Assigned new route {route_id} to {driver.name}", "route_id": route_id}


