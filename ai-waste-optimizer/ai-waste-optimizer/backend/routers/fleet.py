# backend/routers/fleet.py - Fleet/Vehicle API endpoints
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend.database import get_db
from backend.auth.auth import get_current_user

router = APIRouter(prefix="/api/fleet", tags=["fleet"])

# In-memory queue for incidents/requests
import datetime
incidents_queue = [
    { "id": 'REQ-101', "time": '5 mins ago', "type": 'PROVISION_REQUEST', "message": 'Manager requests provisioning of new Driver (Le Van C) and Vehicle (TRUCK_003).', "status": 'warning' },
    { "id": 'INC-901', "time": '10 mins ago', "type": 'HARDWARE_FAILURE', "message": 'IoT Sensor offline at Central Park Bin #4', "status": 'critical' },
    { "id": 'INC-902', "time": '25 mins ago', "type": 'CAPACITY_OVERFLOW', "message": 'Bin #12 at Times Square exceeded 95% threshold', "status": 'warning' }
]

@router.get("/incidents")
def get_incidents():
    return incidents_queue

@router.post("/incidents")
def create_incident(incident: dict):
    # simple mock logic to add incident
    import uuid
    new_incident = {
        "id": f"REQ-{str(uuid.uuid4())[:4].upper()}",
        "time": "Just now",
        "type": incident.get("type", "SYSTEM_ALERT"),
        "message": incident.get("message", ""),
        "status": incident.get("status", "warning")
    }
    incidents_queue.insert(0, new_incident)
    return new_incident

@router.delete("/incidents/{incident_id}")
def delete_incident(incident_id: str):
    global incidents_queue
    incidents_queue = [inc for inc in incidents_queue if inc["id"] != incident_id]
    return {"message": "Incident deleted"}

# Pydantic models
class VehicleBase(BaseModel):
    vehicle_id: str
    type: str
    capacity: int
    driver_name: str
    driver_id: Optional[str] = None
    location: str
    fuel: int = 100
    status: str = "idle"
    lat: float = 16.0544
    lng: float = 108.2022

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    driver_name: Optional[str] = None
    location: Optional[str] = None
    fuel: Optional[int] = None
    status: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    assigned_route: Optional[str] = None
    route_progress: Optional[int] = None
    current_bin: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int
    assigned_route: Optional[str] = None
    route_progress: int = 0
    current_bin: int = 0

    class Config:
        from_attributes = True

# In-memory storage for demo (replace with database in production)
vehicles_db = [
    {"id": 1, "vehicle_id": "TRK-001", "type": "Compactor", "capacity": 8000, "driver_name": "Nguyen Van A", "location": "Hai Chau Depot", "fuel": 85, "status": "active", "lat": 16.0544, "lng": 108.2022, "assigned_route": "Route A1", "route_progress": 0, "current_bin": 0},
    {"id": 2, "vehicle_id": "TRK-002", "type": "Garbage Truck", "capacity": 5000, "driver_name": "Tran Van B", "location": "Thanh Khe Depot", "fuel": 45, "status": "active", "lat": 16.0700, "lng": 108.2200, "assigned_route": "Route B2", "route_progress": 50, "current_bin": 2},
    {"id": 3, "vehicle_id": "TRK-003", "type": "Recycling Truck", "capacity": 3000, "driver_name": "Le Van C", "location": "Lien Chieu Depot", "fuel": 90, "status": "idle", "lat": 16.0800, "lng": 108.2300, "assigned_route": None, "route_progress": 0, "current_bin": 0},
    {"id": 4, "vehicle_id": "TRK-004", "type": "Container Truck", "capacity": 12000, "driver_name": "Pham Van D", "location": "Son Tra Depot", "fuel": 15, "status": "active", "lat": 16.0400, "lng": 108.1900, "assigned_route": "Route D1", "route_progress": 75, "current_bin": 2},
    {"id": 5, "vehicle_id": "TRK-005", "type": "Compactor", "capacity": 8000, "driver_name": "Hoang Van E", "location": "Ngu Hanh Son Depot", "fuel": 30, "status": "maintenance", "lat": 16.0900, "lng": 108.2400, "assigned_route": None, "route_progress": 0, "current_bin": 0},
    {"id": 6, "vehicle_id": "TRK-006", "type": "Garbage Truck", "capacity": 5000, "driver_name": "Vo Van F", "location": "Hai Chau Depot", "fuel": 75, "status": "idle", "lat": 16.0600, "lng": 108.2050, "assigned_route": None, "route_progress": 0, "current_bin": 0},
]

@router.get("/", response_model=List[VehicleResponse])
async def get_vehicles(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all vehicles/drivers"""
    from backend.models.models import Driver, CollectionRoute
    drivers = db.query(Driver).offset(skip).limit(limit).all()
    
    result = []
    for d in drivers:
        route_progress = 0
        assigned_route = None
        if d.current_route_id:
            route = db.query(CollectionRoute).filter(CollectionRoute.id == d.current_route_id).first()
            if route:
                assigned_route = route.route_id
                if route.status == "completed":
                    route_progress = 100
                elif route.status == "in_progress":
                    route_progress = 50
        
        result.append({
            "id": d.id,
            "vehicle_id": "TRUCK_" + str(d.id).zfill(3),
            "type": "Garbage Truck",
            "capacity": 5000,
            "driver_name": d.name,
            "driver_id": d.driver_id,
            "location": "Hai Chau Depot",
            "fuel": 85,
            "status": d.status.value if hasattr(d.status, 'value') else str(d.status),
            "lat": 16.0544,
            "lng": 108.2022,
            "assigned_route": assigned_route,
            "route_progress": route_progress,
            "current_bin": 0
        })
    return result

@router.post("/provision-request", status_code=200)
async def handle_provision_request(
    db: Session = Depends(get_db)
):
    """Admin endpoint to approve manager's request to add Driver 3 and TRUCK_003."""
    from backend.models.models import Driver, CollectionRoute, DriverStatus
    from backend.auth.auth import get_password_hash
    
    # Create Le Van C Driver if not exists
    driver3 = db.query(Driver).filter(Driver.driver_id == "driver008").first()
    if not driver3:
        driver3 = Driver(
            driver_id="driver008",
            name="Le Van C",
            hashed_password=get_password_hash("driver123"),
            status=DriverStatus.ACTIVE
        )
        db.add(driver3)
        db.commit()
        db.refresh(driver3)
        
    # Also create a User record for the driver app login
    from backend.models.models import User
    user3 = db.query(User).filter(User.username == "driver008").first()
    if not user3:
        user3 = User(
            email="levanc@ai-waste.com",
            username="driver008",
            full_name="Le Van C",
            hashed_password=get_password_hash("driver123"),
            role="driver",
            phone="0901234567"
        )
        db.add(user3)
        db.commit()
        
    # Check if there is an Unassigned route we can take over
    route3 = db.query(CollectionRoute).filter(CollectionRoute.driver_name == "Unassigned").first()
    if route3:
        route3.driver_name = "Le Van C"
        route3.vehicle_id = "TRUCK_003"
        db.commit()
        db.refresh(route3)
    else:
        # Create Route if no unassigned route exists
        route3 = db.query(CollectionRoute).filter(CollectionRoute.route_id == "ROUTE_008").first()
        if not route3:
            route3 = CollectionRoute(
                route_id="ROUTE_008",
                route_name="New City Route",
                vehicle_id="TRUCK_003",
                driver_name="Le Van C",
                status="pending"
            )
            db.add(route3)
            db.commit()
            db.refresh(route3)
        
        # Link driver to route
        driver3.current_route_id = route3.id
        db.commit()
        
        # Generate 10 distinct bins for Lien Chieu
        from backend.models.models import Bin, CollectionHistory
        import random
        from datetime import timedelta, datetime
        
        base_lat = 16.0800
        base_lng = 108.2300
        district = "Lien Chieu"
        
        route_bins = []
        for i in range(1, 11):
            lat = base_lat + (i * 0.0005) + random.uniform(-0.001, 0.001)
            lng = base_lng + (i * 0.001) + random.uniform(-0.001, 0.001)
            b = Bin(
                bin_id=f"BIN_LC_{i}",
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
            
        # Create history for these bins linked to ROUTE_003
        for idx, bin_obj in enumerate(route_bins, 1):
            bin_obj.current_fill_level = random.uniform(70.0, 100.0)
            history = CollectionHistory(
                bin_id=bin_obj.id,
                route_id=route3.id,
                collection_time=datetime.utcnow() + timedelta(hours=idx),
                fill_level_before=bin_obj.current_fill_level,
                fill_level_after=None,
                waste_collected=0,
                notes=f"Stop {idx} in {district} sequence"
            )
            db.add(history)
        db.commit()
        
    return {"message": "Provisioning successful. Driver 3 and TRUCK_003 deployed."}

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(
    vehicle_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get vehicle by ID"""
    for vehicle in vehicles_db:
        if vehicle["id"] == vehicle_id:
            return vehicle
    raise HTTPException(status_code=404, detail="Vehicle not found")

@router.post("/", response_model=VehicleResponse)
async def create_vehicle(
    vehicle: VehicleCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new vehicle"""
    new_id = max([v["id"] for v in vehicles_db], default=0) + 1
    new_vehicle = {
        "id": new_id,
        **vehicle.model_dump(),
        "assigned_route": None,
        "route_progress": 0,
        "current_bin": 0
    }
    vehicles_db.append(new_vehicle)
    return new_vehicle

@router.put("/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(
    vehicle_id: int,
    vehicle: VehicleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update vehicle"""
    for i, v in enumerate(vehicles_db):
        if v["id"] == vehicle_id:
            update_data = vehicle.model_dump(exclude_unset=True)
            vehicles_db[i] = {**v, **update_data}
            return vehicles_db[i]
    raise HTTPException(status_code=404, detail="Vehicle not found")

@router.delete("/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete vehicle"""
    for i, v in enumerate(vehicles_db):
        if v["id"] == vehicle_id:
            vehicles_db.pop(i)
            return {"message": "Vehicle deleted successfully"}
    raise HTTPException(status_code=404, detail="Vehicle not found")

@router.post("/{vehicle_id}/dispatch")
async def dispatch_vehicle(
    vehicle_id: int,
    route: str,
    current_user: dict = Depends(get_current_user)
):
    """Dispatch vehicle to a route"""
    for i, v in enumerate(vehicles_db):
        if v["id"] == vehicle_id:
            vehicles_db[i] = {
                **v,
                "status": "active",
                "assigned_route": route,
                "route_progress": 0,
                "current_bin": 0
            }
            return vehicles_db[i]
    raise HTTPException(status_code=404, detail="Vehicle not found")

@router.post("/{vehicle_id}/complete")
async def complete_route(
    vehicle_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Mark route as completed"""
    for i, v in enumerate(vehicles_db):
        if v["id"] == vehicle_id:
            vehicles_db[i] = {
                **v,
                "status": "idle",
                "assigned_route": None,
                "route_progress": 0,
                "current_bin": 0
            }
            return vehicles_db[i]
    raise HTTPException(status_code=404, detail="Vehicle not found")