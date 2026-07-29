# routers/driver.py - Driver authentication and management routes
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import get_db, settings
from backend.models.models import Driver
from backend.schemas.schemas import (
    DriverCreate, DriverLogin, DriverResponse, DriverTokenResponse,
    DriverRouteBin, DriverRouteSequenceResponse
)
from backend.auth.auth import get_password_hash, verify_password, create_access_token
from jose import jwt, JWTError

router = APIRouter(prefix="/api/driver", tags=["Driver"])

def get_current_driver(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Driver:
    """Extract and verify JWT token from Authorization header."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        driver_id: str = payload.get("sub")
        if driver_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if driver is None:
        raise credentials_exception
    if not driver.is_active:
        raise HTTPException(status_code=400, detail="Driver account is inactive")
    
    return driver

def optimize_route_sequence(history_records):
    """
    Sort history records using Nearest Neighbor TSP algorithm to minimize distance.
    """
    if not history_records:
        return []
    
    # Filter records that actually have a bin and coordinates
    valid_records = [h for h in history_records if h.bin and h.bin.latitude and h.bin.longitude]
    invalid_records = [h for h in history_records if not (h.bin and h.bin.latitude and h.bin.longitude)]
    
    if len(valid_records) <= 1:
        return history_records
    
    # Start at the southernmost bin (lowest latitude) as a logical starting point
    start_record = min(valid_records, key=lambda x: x.bin.latitude)
    
    optimized = [start_record]
    remaining = [r for r in valid_records if r != start_record]
    
    current = start_record
    while remaining:
        curr_lat = current.bin.latitude
        curr_lon = current.bin.longitude
        
        # Simple Euclidean distance squared
        closest = min(
            remaining,
            key=lambda x: (x.bin.latitude - curr_lat)**2 + (x.bin.longitude - curr_lon)**2
        )
        optimized.append(closest)
        remaining.remove(closest)
        current = closest
        
    return optimized + invalid_records

@router.post("/register", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def register_driver(driver: DriverCreate, db: Session = Depends(get_db)):
    """Register a new driver account."""
    # Check if driver_id already exists
    db_driver = db.query(Driver).filter(Driver.driver_id == driver.driver_id).first()
    if db_driver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver ID already registered"
        )
    
    # Hash password and create driver
    hashed_password = get_password_hash(driver.password)
    db_driver = Driver(
        driver_id=driver.driver_id,
        name=driver.name,
        hashed_password=hashed_password,
        status=driver.status,
        phone=driver.phone,
        email=driver.email,
        current_route_id=driver.current_route_id
    )
    db.add(db_driver)
    db.commit()
    db.refresh(db_driver)
    return db_driver

@router.post("/login", response_model=DriverTokenResponse)
def login_driver(
    credentials: DriverLogin,
    db: Session = Depends(get_db)
):
    """
    Driver login endpoint.
    Returns JSON with token in format: {"token": "JWT_STRING"}
    """
    driver = db.query(Driver).filter(
        (Driver.driver_id == credentials.driver_id) | (Driver.email == credentials.driver_id)
    ).first()
    
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not verify_password(credentials.password, driver.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not driver.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver account is inactive"
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": driver.driver_id},
        expires_delta=access_token_expires
    )
    
    # Return token in format: {"token": "...", "driver_name": "..."}
    return DriverTokenResponse(token=access_token, driver_name=driver.name)

@router.post("/seed", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def seed_driver(db: Session = Depends(get_db)):
    """
    Create sample driver for testing.
    driver_id: driver001
    password: password123
    name: Nguyen Van A
    """
    # Check if driver001 already exists
    existing = db.query(Driver).filter(Driver.driver_id == "driver001").first()
    if existing:
        return existing
    
    hashed_password = get_password_hash("password123")
    driver = Driver(
        driver_id="driver001",
        name="Nguyen Van A",
        hashed_password=hashed_password,
        status="Inactive",
        phone="0912345678",
        email="driver001@example.com"
    )
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver

@router.get("/me", response_model=DriverResponse)
def get_driver_profile(current_driver: Driver = Depends(get_current_driver)):
    """Get current driver profile."""
    return current_driver

@router.put("/status/{new_status}", response_model=DriverResponse)
def update_driver_status(
    new_status: str,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Update driver status.
    Status options: Active, Inactive, On Duty
    """
    if new_status not in ("Active", "Inactive", "On Duty"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be: Active, Inactive, or On Duty"
        )
    
    current_driver.status = new_status
    db.commit()
    db.refresh(current_driver)
    return current_driver

@router.get("/route/sequence", response_model=DriverRouteSequenceResponse)
def get_route_sequence(
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Get waste bins sequence for current driver's route.
    Returns list of bins with location coordinates in format expected by Android app.
    """
    from backend.models.models import Bin, CollectionHistory, CollectionRoute
    
    # Priority 1: Check for an active IN_PROGRESS route assigned to this driver
    active_route = db.query(CollectionRoute).filter(
        (CollectionRoute.driver_name == current_driver.name) | 
        (CollectionRoute.driver_name == current_driver.driver_id),
        CollectionRoute.status == "in_progress"
    ).first()

    if active_route:
        route_id_to_fetch = active_route.id
    else:
        route_id_to_fetch = current_driver.current_route_id

    # Priority 2: If still no route, check for any pending or completed route for this driver
    if not route_id_to_fetch:
        any_route = db.query(CollectionRoute).filter(
            (CollectionRoute.driver_name == current_driver.name) | 
            (CollectionRoute.driver_name == current_driver.driver_id)
        ).first()
        if any_route:
            route_id_to_fetch = any_route.id
            
    if not route_id_to_fetch:
        return DriverRouteSequenceResponse(route=[])
    
    route_obj = db.query(CollectionRoute).filter(CollectionRoute.id == route_id_to_fetch).first()
    
    # Get all bins in the current driver's route, preserving the AI-optimized sequence from the database
    history_records = db.query(CollectionHistory).filter(
        CollectionHistory.route_id == route_id_to_fetch
    ).order_by(CollectionHistory.id.asc()).all()
    
    route_sequence = []
    completed_stops = 0
    total_stops = len(history_records)
    
    for h in history_records:
        if h.bin:
            is_collected = (h.fill_level_after == 0.0 and h.collection_time is not None)
            if is_collected:
                completed_stops += 1
                
            bin_obj = DriverRouteBin(
                id=h.bin.bin_id,
                location_name=h.bin.address or f"Bin {h.bin.bin_id}",
                latitude=h.bin.latitude,
                longitude=h.bin.longitude,
                current_fill_level=h.bin.current_fill_level,
                bin_type=h.bin.bin_type,
                zone=h.bin.district or "Zone 1",  # Use district as zone
                collection_status="completed" if is_collected else "pending"
            )
            route_sequence.append(bin_obj)
            
    return DriverRouteSequenceResponse(
        route_id=route_obj.route_id if route_obj else "ROUTE",
        status=route_obj.status if route_obj else "pending",
        district=route_obj.route_name or "District 1",
        vehicle_id=route_obj.vehicle_id if route_obj else None,
        total_stops=total_stops,
        completed_stops=completed_stops,
        route=route_sequence
    )

@router.get("/route/{route_id}/details", response_model=DriverRouteSequenceResponse)
def get_route_details(
    route_id: str,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    """
    Get waste bins sequence for a specific route ID.
    Supports either integer ID or string route_id.
    """
    from backend.models.models import Bin, CollectionHistory, CollectionRoute
    
    # Try finding by integer id first, then string route_id
    route_obj = None
    if route_id.isdigit():
        route_obj = db.query(CollectionRoute).filter(CollectionRoute.id == int(route_id)).first()
    
    if not route_obj:
        route_obj = db.query(CollectionRoute).filter(CollectionRoute.route_id == route_id).first()
        
    if not route_obj:
        raise HTTPException(status_code=404, detail="Route not found")
        
    # Get all bins in the route, preserving the AI-optimized sequence from the database
    history_records = db.query(CollectionHistory).filter(
        CollectionHistory.route_id == route_obj.id
    ).order_by(CollectionHistory.id.asc()).all()
    # Removed local optimize_route_sequence to strictly respect Manager's AI assignment
    
    route_sequence = []
    completed_stops = 0
    total_stops = len(history_records)
    
    for h in history_records:
        if h.bin:
            is_collected = h.fill_level_after == 0.0
            if is_collected:
                completed_stops += 1
                
            bin_obj = DriverRouteBin(
                id=h.bin.bin_id,
                location_name=h.bin.address or f"Bin {h.bin.bin_id}",
                latitude=h.bin.latitude,
                longitude=h.bin.longitude,
                current_fill_level=h.bin.current_fill_level,
                bin_type=h.bin.bin_type,
                zone=h.bin.district or "Zone 1",
                collection_status="completed" if is_collected else "pending"
            )
            route_sequence.append(bin_obj)
            
    return DriverRouteSequenceResponse(
        route_id=route_obj.route_id,
        status=route_obj.status,
        district=route_obj.route_name or "District 1",
        vehicle_id=route_obj.vehicle_id,
        total_stops=total_stops,
        completed_stops=completed_stops,
        route=route_sequence
    )

@router.post("/route/{route_id}/bin/{bin_id}/collect", status_code=status.HTTP_200_OK)
@router.post("/bin/{bin_id}/collect", status_code=status.HTTP_200_OK)
def collect_bin(
    bin_id: str,
    route_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    """Mark a bin as collected, reset fill level to 0, and record history."""
    from backend.models.models import Bin, CollectionHistory
    from datetime import datetime
    
    if not current_driver.current_route_id:
        raise HTTPException(status_code=400, detail="Driver is not assigned to any route")
        
    bin_obj = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")
        
    fill_before = bin_obj.current_fill_level
    waste = (bin_obj.capacity * fill_before / 100.0) if bin_obj.capacity else 0.0
    
    # Find the history record for this bin and route to update it
    history = db.query(CollectionHistory).filter(
        CollectionHistory.bin_id == bin_obj.id,
        CollectionHistory.route_id == current_driver.current_route_id
    ).first()
    
    if history:
        history.fill_level_before = fill_before
        history.fill_level_after = 0.0
        history.waste_collected = waste
        history.collection_time = datetime.utcnow()
        history.notes = "Collected by driver (updated)"
    else:
        history = CollectionHistory(
            bin_id=bin_obj.id,
            route_id=current_driver.current_route_id,
            fill_level_before=fill_before,
            fill_level_after=0.0,
            waste_collected=waste,
            collection_time=datetime.utcnow(),
            notes="Collected by driver"
        )
        db.add(history)
        
    # Reset bin fill level in the database
    bin_obj.current_fill_level = 0.0
    bin_obj.last_collected = datetime.utcnow()
    
    db.commit()
    return {"status": "success", "message": f"Bin {bin_id} marked as collected"}

@router.post("/route/complete", status_code=status.HTTP_200_OK)
def complete_driver_route(
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    """Complete the driver's current route."""
    from backend.models.models import CollectionRoute
    from datetime import datetime
    
    if not current_driver.current_route_id:
        raise HTTPException(status_code=400, detail="Driver is not assigned to any route")
        
    route = db.query(CollectionRoute).filter(CollectionRoute.id == current_driver.current_route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
        
    route.status = "completed"
    route.completed_at = datetime.utcnow()
    # Reset driver route and set status to Active
    from backend.models.models import DriverStatus
    current_driver.status = DriverStatus.ACTIVE
    current_driver.current_route_id = None
    
    db.commit()
    return {"status": "success", "message": "Route completed successfully"}
