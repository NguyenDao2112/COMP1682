# schemas/schemas.py - Pydantic schemas for request/response validation
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    DRIVER = "driver"

class DriverStatus(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    ON_DUTY = "On Duty"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = None
    role: UserRole = UserRole.USER
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Bin schemas
class BinBase(BaseModel):
    bin_id: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    capacity: float = 1000.0
    current_fill_level: float = 0.0
    bin_type: str = "general"
    status: str = "active"

class BinCreate(BinBase):
    pass

class BinUpdate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    capacity: Optional[float] = None
    current_fill_level: Optional[float] = None
    bin_type: Optional[str] = None
    status: Optional[str] = None
    last_collected: Optional[datetime] = None
    next_scheduled: Optional[datetime] = None

class BinResponse(BinBase):
    id: int
    last_collected: Optional[datetime] = None
    next_scheduled: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Route schemas
class RouteBase(BaseModel):
    route_id: str
    route_name: Optional[str] = None
    vehicle_id: Optional[str] = None
    driver_name: Optional[str] = None
    total_distance: Optional[float] = None
    estimated_time: Optional[float] = None
    status: str = "pending"

class RouteCreate(RouteBase):
    scheduled_date: Optional[datetime] = None

class RouteUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    driver_name: Optional[str] = None
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class RouteResponse(RouteBase):
    id: int
    scheduled_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    path: Optional[List[List[float]]] = None

    class Config:
        from_attributes = True

# Feedback schemas
class FeedbackBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = "suggestion"
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None

class FeedbackResponse(FeedbackBase):
    id: int
    user_id: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Notification schemas
class NotificationBase(BaseModel):
    title: str
    content: str
    notification_type: str = "system"

class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None

class NotificationResponse(NotificationBase):
    id: int
    user_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# KPI schemas
class KPIBase(BaseModel):
    total_waste_collected: Optional[float] = None
    total_distance_traveled: Optional[float] = None
    total_bins_collected: Optional[int] = None
    average_fill_level: Optional[float] = None
    efficiency_score: Optional[float] = None
    co2_saved: Optional[float] = None
    cost_savings: Optional[float] = None

class KPICreate(KPIBase):
    date: Optional[datetime] = None

class KPIResponse(KPIBase):
    id: int
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard stats
class DashboardStats(BaseModel):
    total_bins: int
    active_bins: int
    full_bins: int
    total_routes: int
    active_routes: int
    pending_routes: int
    completed_routes: int
    active_vehicles: int
    total_users: int
    total_feedback: int
    pending_feedback: int
    today_waste_collected: float
    today_distance_traveled: float
    efficiency_score: float

# Driver schemas
class DriverBase(BaseModel):
    driver_id: str = Field(..., min_length=3, max_length=128)
    name: str = Field(..., min_length=1, max_length=128)
    status: DriverStatus = DriverStatus.INACTIVE
    phone: Optional[str] = None
    email: Optional[str] = None
    current_route_id: Optional[int] = None

class DriverCreate(DriverBase):
    password: str = Field(..., min_length=6)

class DriverLogin(BaseModel):
    driver_id: str
    password: str

class DriverResponse(DriverBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DriverTokenResponse(BaseModel):
    token: str
    driver_name: Optional[str] = None

class DriverRouteBin(BaseModel):
    """Bin object for driver route sequence (for Android app)"""
    id: str = Field(..., description="Bin ID")
    location_name: str = Field(..., description="Location/Address name")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    current_fill_level: float = Field(..., ge=0, le=100, description="Fill level percentage (0-100)")
    bin_type: str = Field(..., description="Bin type: Commercial, Residential, or Public")
    zone: str = Field(..., description="Zone name (e.g., Zone 1, Zone 4)")
    collection_status: str = Field("pending", description="Status: pending or completed")

class DriverRouteSequenceResponse(BaseModel):
    """Response for GET /api/driver/route/sequence"""
    route_id: Optional[str] = None
    status: Optional[str] = None
    district: Optional[str] = None
    vehicle_id: Optional[str] = None
    total_stops: int = 0
    completed_stops: int = 0
    route: List[DriverRouteBin] = Field(default_factory=list, description="List of bins in the route")

