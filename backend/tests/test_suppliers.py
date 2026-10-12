import pytest
import pandas as pd
from backend.app.config import RISK_WEIGHTS
from backend.app.services.supplier_service import (
    calculate_on_time_rate,
    calculate_lead_time_metrics,
    calculate_supplier_risk_score,
    SupplierService
)

def test_risk_weights_sum_to_one():
    assert sum(RISK_WEIGHTS.values()) == pytest.approx(1.0, 1e-6)

def test_on_time_rate_calculation():
    # 3 orders: 2 on-time, 1 late
    df = pd.DataFrame([
        {"actual_delivery_date": "2026-09-10", "expected_delivery_date": "2026-09-12"},
        {"actual_delivery_date": "2026-09-15", "expected_delivery_date": "2026-09-15"},
        {"actual_delivery_date": "2026-09-20", "expected_delivery_date": "2026-09-18"}  # late
    ])
    rate, sufficiency = calculate_on_time_rate(df)
    assert rate == 66.7
    assert "3 completed POs" in sufficiency

def test_on_time_rate_insufficient_history():
    df = pd.DataFrame([
        {"actual_delivery_date": "2026-09-10", "expected_delivery_date": "2026-09-12"}
    ])
    rate, sufficiency = calculate_on_time_rate(df)
    assert rate is None
    assert "Insufficient history" in sufficiency

def test_risk_score_directionality():
    # Supplier A: Excellent (100% on time, 0 delay, 0.5% defects, 10 fin risk, 5% share)
    breakdown_a, score_a, band_a = calculate_supplier_risk_score(
        on_time_rate=100.0,
        historical_on_time=100.0,
        avg_delay_days=0.0,
        defect_rate_pct=0.5,
        financial_risk=10.0,
        inventory_share_pct=5.0
    )

    # Supplier B: Terrible (60% on time, 6d delay, 3.5% defects, 60 fin risk, 25% share)
    breakdown_b, score_b, band_b = calculate_supplier_risk_score(
        on_time_rate=60.0,
        historical_on_time=60.0,
        avg_delay_days=6.0,
        defect_rate_pct=3.5,
        financial_risk=60.0,
        inventory_share_pct=25.0
    )

    # Higher score must mean HIGHER risk!
    assert score_b > score_a
    assert breakdown_b.on_time_risk > breakdown_a.on_time_risk
    assert breakdown_b.delay_risk > breakdown_a.delay_risk
    assert breakdown_b.defect_risk > breakdown_a.defect_risk
    assert breakdown_b.financial_risk > breakdown_a.financial_risk
    assert breakdown_b.dependency_risk > breakdown_a.dependency_risk
    assert band_a in ["Low", "Moderate"]
    assert band_b in ["High", "Critical"]

def test_supplier_service_integration():
    suppliers = SupplierService.get_suppliers()
    assert len(suppliers) == 10
    for s in suppliers:
        assert s.risk_score >= 0.0 and s.risk_score <= 100.0
        assert s.risk_band in ["Low", "Moderate", "High", "Critical"]
        assert len(s.actionable_recommendations) > 0
