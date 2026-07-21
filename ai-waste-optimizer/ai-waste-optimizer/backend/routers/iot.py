from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import random

from backend.database import get_db
from backend.models.models import Bin

router = APIRouter(prefix="/api/iot", tags=["IoT Sensors"])

class SensorData(BaseModel):
    bin_id: str
    fill_level: float
    temperature: Optional[float] = 25.0
    battery_level: Optional[float] = 100.0

@router.post("/sensor-data", status_code=status.HTTP_200_OK)
def receive_sensor_data(data: SensorData, db: Session = Depends(get_db)):
    """
    Receive telemetry data from IoT Bin sensors (ESP32/Arduino).
    This endpoint does not require user authentication (JWT) since it's for hardware devices.
    """
    # Find the bin by string bin_id
    db_bin = db.query(Bin).filter(Bin.bin_id == data.bin_id).first()
    
    if not db_bin:
        # Auto-provision a new bin if it doesn't exist (useful for testing)
        # Scatter them around Da Nang (Base: 16.0600, 108.2100)
        base_lat = 16.0600
        base_lng = 108.2100
        random_lat = base_lat + random.uniform(-0.03, 0.03)
        random_lng = base_lng + random.uniform(-0.03, 0.03)
        
        db_bin = Bin(
            bin_id=data.bin_id,
            latitude=random_lat,
            longitude=random_lng,
            address="Auto-provisioned IoT Bin",
            district="Hai Chau",
            ward="Thach Thang",
            capacity=1000.0,
            bin_type="general",
            status="active"
        )
        db.add(db_bin)
    
    # Update the dynamic stats
    db_bin.current_fill_level = min(100.0, max(0.0, data.fill_level))
    if data.temperature is not None:
        db_bin.temperature = data.temperature
    if data.battery_level is not None:
        db_bin.battery_level = min(100.0, max(0.0, data.battery_level))
        
    db_bin.updated_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Data received successfully", "bin_id": data.bin_id, "status": "updated"}
