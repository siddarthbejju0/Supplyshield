import pytest
from backend.app.schemas import MitigationRequest
from backend.app.services.mitigation_service import MitigationService

def test_mitigation_strategies_comparison_with_alt_supplier():
    # SKU-ELC-002 has qualified alternative suppliers (Nordic Tech SUP004, Apex SUP001)
    req = MitigationRequest(
        product_id="SKU-ELC-002",
        shortage_units=500.0,
        disruption_duration_days=14
    )
    res = MitigationService.compare_strategies(req)
    assert res.product_id == "SKU-ELC-002"
    assert len(res.options) >= 4
    
    # Check that alt supplier strategy is marked feasible
    alt_opt = next(o for o in res.options if o.strategy_key == "ALT_SUPPLIER")
    assert alt_opt.is_feasible is True
    assert alt_opt.incremental_cost > 0.0

    # Recommended strategy is identified and feasible
    rec_opt = next(o for o in res.options if o.strategy_key == res.recommended_strategy_key)
    assert rec_opt.is_feasible is True

def test_mitigation_budget_constraint():
    # Set a tiny budget of £50.00
    req = MitigationRequest(
        product_id="SKU-ELC-002",
        shortage_units=500.0,
        max_budget=50.0
    )
    res = MitigationService.compare_strategies(req)
    # The expensive strategies should be disqualified by budget constraint
    alt_opt = next(o for o in res.options if o.strategy_key == "ALT_SUPPLIER")
    assert alt_opt.is_feasible is False
    assert "Exceeds user budget constraint" in alt_opt.feasibility_notes

def test_mitigation_invalid_product():
    req = MitigationRequest(product_id="SKU-NON-EXISTENT")
    with pytest.raises(ValueError):
        MitigationService.compare_strategies(req)
