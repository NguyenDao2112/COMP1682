# models/models.py - Database models
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from backend.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    DRIVER = "driver"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    phone = Column(String(20))
    address = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    feedbacks = relationship("Feedback", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Bin(Base):
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String(50), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500))
    ward = Column(String(100))
    district = Column(String(100))
    capacity = Column(Float, default=1000.0)  # in liters
    current_fill_level = Column(Float, default=0.0)  # percentage 0-100
    temperature = Column(Float, default=25.0)  # Celsius (for fire detection)
    battery_level = Column(Float, default=100.0)  # percentage 0-100
    bin_type = Column(String(50), default="general")  # general, recyclable, organic, hazardous
    status = Column(String(50), default="active")  # active, maintenance, broken
    last_collected = Column(DateTime)
    next_scheduled = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    collection_history = relationship("CollectionHistory", back_populates="bin")

class CollectionRoute(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String(50), unique=True, index=True, nullable=False)
    route_name = Column(String(200))
    vehicle_id = Column(String(50))
    driver_name = Column(String(200))
    total_distance = Column(Float)  # in km
    estimated_time = Column(Float)  # in minutes
    status = Column(String(50), default="pending")  # pending, in_progress, completed
    scheduled_date = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    collection_history = relationship("CollectionHistory", back_populates="route")

class CollectionHistory(Base):
    __tablename__ = "collection_history"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(Integer, ForeignKey("bins.id"))
    route_id = Column(Integer, ForeignKey("routes.id"))
    collection_time = Column(DateTime, default=datetime.utcnow)
    fill_level_before = Column(Float)
    fill_level_after = Column(Float)
    waste_collected = Column(Float)  # in kg
    notes = Column(Text)

    # Relationships
    bin = relationship("Bin", back_populates="collection_history")
    route = relationship("CollectionRoute", back_populates="collection_history")

class Feedback(Base):
    __tablename__ = "feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50))  # complaint, suggestion, compliment, incident
    status = Column(String(50), default="pending")  # pending, reviewed, resolved
    image_url = Column(String(500))
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="feedbacks")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    notification_type = Column(String(50))  # bin_full, route_update, feedback_reply, system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class DriverStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    ON_DUTY = "On Duty"

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(128), nullable=False)
    status = Column(SQLEnum(DriverStatus), default=DriverStatus.ACTIVE)
    current_route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    phone = Column(String(20))
    email = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    current_route = relationship("CollectionRoute", foreign_keys=[current_route_id])

class KPI(Base):
    __tablename__ = "kpis"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    total_waste_collected = Column(Float)  # in kg
    total_distance_traveled = Column(Float)  # in km
    total_bins_collected = Column(Integer)
    average_fill_level = Column(Float)
    efficiency_score = Column(Float)  # percentage
    co2_saved = Column(Float)  # in kg
    cost_savings = Column(Float)  # in currency
    created_at = Column(DateTime, default=datetime.utcnow)
