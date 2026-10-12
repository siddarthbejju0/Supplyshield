from fastapi import APIRouter, HTTPException
from backend.app.schemas import MitigationRequest, MitigationComparisonResponse
from backend.app.services.mitigation_service import MitigationService

router = APIRouter(prefix="/api/mitigation", tags=["Mitigation"])

@router.post("/compare", response_model=MitigationComparisonResponse)
def compare_mitigation_strategies(request: MitigationRequest) -> MitigationComparisonResponse:
    try:
        return MitigationService.compare_strategies(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mitigation calculation error: {str(e)}")
