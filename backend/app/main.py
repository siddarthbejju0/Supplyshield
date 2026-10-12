from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import SCENARIO_CUTOFF_DATE
from backend.app.schemas import HealthResponse
from backend.app.data_loader import get_data_loader

from backend.app.routers import (
    overview,
    inventory,
    suppliers,
    simulation,
    mitigation,
    data_explorer,
    methodology
)

app = FastAPI(
    title="SupplyShield AI API",
    description="Interactive Supply Chain Risk Intelligence & Decision Support Platform for Northstar Retail (Illustrative Portfolio Demonstration)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(overview.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
app.include_router(simulation.router)
app.include_router(mitigation.router)
app.include_router(data_explorer.router)
app.include_router(methodology.router)

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    loader = get_data_loader()
    is_loaded = not loader.suppliers_df.empty and not loader.inventory_df.empty
    return HealthResponse(
        status="healthy",
        message="SupplyShield AI backend service operational.",
        scenario_cutoff_date=SCENARIO_CUTOFF_DATE,
        data_loaded=is_loaded,
        version="1.0.0"
    )
