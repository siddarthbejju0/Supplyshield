from fastapi import APIRouter, HTTPException
from backend.app.schemas import SimulationRequest, SimulationResponse
from backend.app.services.simulation_service import SimulationService

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.post("/run", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest) -> SimulationResponse:
    try:
        return SimulationService.run_simulation(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
