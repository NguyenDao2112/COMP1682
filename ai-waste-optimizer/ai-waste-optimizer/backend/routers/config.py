from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/config", tags=["config"])

# In-memory store for AI Config for simplicity
global_ai_config = {
    "fuelPriority": 70,
    "speedPriority": 30,
    "co2Penalty": 15,
    "maxWaitTime": 45,
    "fuelCost": 1.25,
    "carbonCreditPrice": 45.0,
    "maxTruckLoad": 10000
}

class AIConfigModel(BaseModel):
    fuelPriority: int
    speedPriority: int
    co2Penalty: int
    maxWaitTime: int
    fuelCost: float
    carbonCreditPrice: float
    maxTruckLoad: int

@router.get("/")
def get_config():
    return global_ai_config

@router.post("/")
def update_config(config: AIConfigModel):
    global global_ai_config
    global_ai_config.update(config.dict())
    return {"status": "success", "message": "AI Configuration updated successfully", "data": global_ai_config}
