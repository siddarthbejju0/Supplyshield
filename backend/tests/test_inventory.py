import pytest
from backend.app.services.inventory_service import (
    calculate_days_of_cover,
    calculate_lead_time_demand,
    calculate_shortfall,
    classify_inventory_risk,
    InventoryService
)

def test_calculate_days_of_cover_normal():
    # 500 units / 50 demand = 10.0 days
    assert calculate_days_of_cover(500, 50) == 10.0

def test_calculate_days_of_cover_zero_demand():
    # Zero demand should return None instead of throwing ZeroDivisionError
    assert calculate_days_of_cover(500, 0) is None
    assert calculate_days_of_cover(500, -5) is None

def test_calculate_lead_time_demand():
    # 25 units/day * 14 days = 350 units
    assert calculate_lead_time_demand(25.0, 14) == 350.0

def test_calculate_shortfall():
    # Stock 200, LTD 350 -> Shortfall 150
    assert calculate_shortfall(350.0, 200.0) == 150.0
    # Stock 500, LTD 350 -> Shortfall 0
    assert calculate_shortfall(350.0, 500.0) == 0.0

def test_classify_inventory_risk():
    # Critical: days of cover (5d) < lead time (14d)
    level, rationale = classify_inventory_risk(
        days_of_cover=5.0,
        lead_time_days=14,
        current_stock=100,
        reorder_point=300,
        safety_stock=50
    )
    assert level == "Critical"
    assert "less than replenishment lead time" in rationale

    # High: days of cover (16d) < 1.4 * lead time (14 * 1.4 = 19.6d)
    level, _ = classify_inventory_risk(
        days_of_cover=16.0,
        lead_time_days=14,
        current_stock=250,
        reorder_point=300,
        safety_stock=50
    )
    assert level == "High"

    # Moderate: current_stock <= reorder_point
    level, _ = classify_inventory_risk(
        days_of_cover=25.0,
        lead_time_days=14,
        current_stock=280,
        reorder_point=300,
        safety_stock=50
    )
    assert level == "Moderate"

    # Low: ample stock
    level, _ = classify_inventory_risk(
        days_of_cover=45.0,
        lead_time_days=14,
        current_stock=600,
        reorder_point=300,
        safety_stock=50
    )
    assert level == "Low"

    # Depleted stock (0 units) is always Critical
    level, rationale = classify_inventory_risk(
        days_of_cover=0.0,
        lead_time_days=10,
        current_stock=0,
        reorder_point=100,
        safety_stock=20
    )
    assert level == "Critical"

def test_inventory_service_summary():
    summary = InventoryService.get_inventory_summary()
    assert summary.total_products == 24
    assert summary.total_inventory_units > 0
    assert summary.total_inventory_value > 0
    assert summary.critical_count + summary.high_risk_count + summary.moderate_risk_count + summary.low_risk_count == 24
