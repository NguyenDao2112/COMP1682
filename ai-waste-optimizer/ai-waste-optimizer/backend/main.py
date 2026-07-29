# main.py - AI Waste Optimizer API
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Determine project root directory
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

# Add project root to path
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import modules directly from router modules
from backend.database import engine, Base
from backend.routers.auth import router as auth_router
from backend.routers.bins import router as bins_router
from backend.routers.routes import router as routes_router
from backend.routers.feedback import router as feedback_router
from backend.routers.notifications import router as notifications_router
from backend.routers.users import router as users_router
from backend.routers.fleet import router as fleet_router
from backend.routers.driver import router as driver_router
from backend.routers.iot import router as iot_router
from backend.routers.health import router as health_router
from backend.routers.config import router as config_router

# Create database tables (only once on startup)
Base.metadata.create_all(bind=engine)

import traceback
from fastapi.responses import JSONResponse

app = FastAPI(
    title="AI Waste Optimizer API",
    description="API for Smart Waste Collection System",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": traceback.format_exc()}
    )

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(bins_router)
app.include_router(routes_router)
app.include_router(feedback_router)
app.include_router(notifications_router)
app.include_router(users_router)
app.include_router(fleet_router)
app.include_router(driver_router)
app.include_router(iot_router)
app.include_router(health_router)
app.include_router(config_router)

@app.get("/")
def root():
    return {"message": "AI Waste Optimizer API is running", "version": "1.0.0"}

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "database": "connected"}

