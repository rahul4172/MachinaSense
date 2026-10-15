"""
MachinaSense — Intelligent Industrial Fault Detection & Predictive Maintenance
Main FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.ml.pipeline import inference_service

# Routers
from app.api.health import router as health_router
from app.api.machines import router as machines_router
from app.api.alerts import router as alerts_router
from app.api.inference import router as inference_router
from app.api.datasets import router as datasets_router
from app.api.evaluations import router as evaluations_router
from app.api.simulation import router as simulation_router
from app.api.drift import router as drift_router
from app.api.edge import router as edge_router
from app.api.telemetry import router as telemetry_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and check model status
    print("[MachinaSense] Initializing SQLite database...")
    init_db()
    print("[MachinaSense] Verifying ML model status...")
    if inference_service.is_loaded:
        print("[MachinaSense] ML Inference Pipeline is READY.")
    else:
        print(f"[MachinaSense] WARNING: Model loading failed: {inference_service.last_load_error}")
    yield
    # Shutdown
    print("[MachinaSense] Application shutdown.")

app = FastAPI(
    title="MachinaSense API",
    description="Intelligent Industrial Fault Detection and Predictive Maintenance Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(machines_router, prefix=settings.API_V1_STR)
app.include_router(alerts_router, prefix=settings.API_V1_STR)
app.include_router(inference_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(evaluations_router, prefix=settings.API_V1_STR)
app.include_router(simulation_router, prefix=settings.API_V1_STR)
app.include_router(drift_router, prefix=settings.API_V1_STR)
app.include_router(edge_router, prefix=settings.API_V1_STR)
app.include_router(telemetry_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "MachinaSense",
        "tagline": "Intelligent Industrial Fault Detection & Predictive Maintenance",
        "version": "1.0.0",
        "api_docs": "/docs",
        "model_status": "READY" if inference_service.is_loaded else "OFFLINE"
    }
