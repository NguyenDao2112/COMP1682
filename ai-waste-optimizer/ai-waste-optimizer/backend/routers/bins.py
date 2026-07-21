# routers/bins.py - Bins API routes
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db
from backend.models.models import Bin, User
from backend.schemas.schemas import BinCreate, BinUpdate, BinResponse, DashboardStats
from backend.auth.auth import get_current_active_user, require_admin, require_manager

router = APIRouter(prefix="/api/bins", tags=["Bins"])

@router.get("", response_model=List[BinResponse])
def get_bins(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    bin_type: Optional[str] = None,
    district: Optional[str] = None,
    min_fill: Optional[float] = None,
    max_fill: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all bins with optional filters."""
    query = db.query(Bin)
    
    if status_filter:
        query = query.filter(Bin.status == status_filter)
    if bin_type:
        query = query.filter(Bin.bin_type == bin_type)
    if district:
        query = query.filter(Bin.district == district)
    if min_fill is not None:
        query = query.filter(Bin.current_fill_level >= min_fill)
    if max_fill is not None:
        query = query.filter(Bin.current_fill_level <= max_fill)
    if search:
        query = query.filter(
            (Bin.bin_id.ilike(f"%{search}%")) |
            (Bin.address.ilike(f"%{search}%"))
        )
    
    bins = query.offset(skip).limit(limit).all()
    return bins

@router.get("/{bin_id}", response_model=BinResponse)
def get_bin(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific bin by ID."""
    bin = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bin not found"
        )
    return bin

@router.post("", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
def create_bin(
    bin: BinCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new bin (admin/manager only)."""
    # Check if bin_id already exists
    existing_bin = db.query(Bin).filter(Bin.bin_id == bin.bin_id).first()
    if existing_bin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bin ID already exists"
        )
    
    db_bin = Bin(**bin.dict())
    db.add(db_bin)
    db.commit()
    db.refresh(db_bin)
    return db_bin

@router.put("/{bin_id}", response_model=BinResponse)
def update_bin(
    bin_id: int,
    bin_update: BinUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a bin (admin/manager only)."""
    bin = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bin not found"
        )
    
    update_data = bin_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(bin, key, value)
    
    db.commit()
    db.refresh(bin)
    return bin

@router.delete("/{bin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bin(
    bin_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a bin (admin only)."""
    bin = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bin not found"
        )
    
    db.delete(bin)
    db.commit()
    return None

@router.get("/stats/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics."""
    from backend.models.models import CollectionRoute, Feedback
    
    total_bins = db.query(Bin).count()
    active_bins = db.query(Bin).filter(Bin.status == "active").count()
    full_bins = db.query(Bin).filter(Bin.current_fill_level >= 80).count()
    
    total_routes = db.query(CollectionRoute).count()
    active_routes = db.query(CollectionRoute).filter(CollectionRoute.status == "in_progress").count()
    pending_routes = db.query(CollectionRoute).filter(CollectionRoute.status == "pending").count()
    completed_routes = db.query(CollectionRoute).filter(CollectionRoute.status == "completed").count()
    
    from backend.models.models import Driver
    active_vehicles = db.query(Driver).filter(Driver.status == "On Duty").count()
    
    total_users = db.query(User).count()
    total_feedback = db.query(Feedback).count()
    pending_feedback = db.query(Feedback).filter(Feedback.status == "pending").count()
    
    return DashboardStats(
        total_bins=total_bins,
        active_bins=active_bins,
        full_bins=full_bins,
        total_routes=total_routes,
        active_routes=active_routes,
        pending_routes=pending_routes,
        completed_routes=completed_routes,
        active_vehicles=active_vehicles,
        total_users=total_users,
        total_feedback=total_feedback,
        pending_feedback=pending_feedback,
        today_waste_collected=0.0,
        today_distance_traveled=0.0,
        efficiency_score=85.5
    )

@router.get("/map/all", response_model=List[dict])
def get_bins_for_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all bins with coordinates for map display."""
    bins = db.query(Bin).filter(Bin.status == "active").all()
    return [
        {
            "id": bin.id,
            "bin_id": bin.bin_id,
            "lat": bin.latitude,
            "lng": bin.longitude,
            "fill_level": bin.current_fill_level,
            "temperature": bin.temperature,
            "battery_level": bin.battery_level,
            "type": bin.bin_type,
            "address": bin.address,
            "district": bin.district
        }
        for bin in bins
    ]
