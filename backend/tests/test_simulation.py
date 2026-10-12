import pytest
from backend.app.schemas import SimulationRequest
from backend.app.services.simulation_service import SimulationService

def test_simulation_long_disruption_produces_unmet_demand():
    # Simulate high-risk SKU-ELC-002 (stock is 280, daily demand 50)
    # At 50 units/day, 280 units runs out in day 6!
    req = SimulationRequest(
        product_id="SKU-ELC-002",
        disruption_duration_days=14,
        demand_multiplier=1.0,
        stock_reduction_pct=0.0,
        allow_open_po_arrivals=False
    )
    res = SimulationService.run_simulation(req)
    assert res.total_products_affected == 1
    assert res.products_stocking_out_count == 1
    assert res.total_unmet_units > 0
    assert len(res.aggregated_trajectory) == 14

    # Check trajectory: stock should never be negative
    for pt in res.aggregated_trajectory:
        assert pt.scenario_stock >= 0.0

    prod_res = res.product_results[0]
    assert prod_res.stocks_out_during_scenario is True
    assert prod_res.days_until_stockout is not None
    assert prod_res.days_until_stockout <= 7

def test_simulation_short_disruption_safe_product():
    # SKU-HOM-004 has 1400 units, daily demand 15 (93 days cover!)
    # A 7-day disruption should NOT cause stockout
    req = SimulationRequest(
        product_id="SKU-HOM-004",
        disruption_duration_days=7,
        demand_multiplier=1.0,
        stock_reduction_pct=0.0
    )
    res = SimulationService.run_simulation(req)
    assert res.products_stocking_out_count == 0
    assert res.total_unmet_units == 0.0
    prod_res = res.product_results[0]
    assert prod_res.stocks_out_during_scenario is False
    assert prod_res.days_until_stockout is None

def test_simulation_demand_multiplier_effect():
    # Compare 1.0 vs 1.5 demand multiplier on SKU-ELC-002
    req_base = SimulationRequest(product_id="SKU-ELC-002", disruption_duration_days=14, demand_multiplier=1.0)
    res_base = SimulationService.run_simulation(req_base)

    req_surge = SimulationRequest(product_id="SKU-ELC-002", disruption_duration_days=14, demand_multiplier=1.5)
    res_surge = SimulationService.run_simulation(req_surge)

    # Surge demand should cause greater unmet units
    assert res_surge.total_unmet_units > res_base.total_unmet_units

def test_simulation_supplier_scope():
    # SUP001 supplies 2 products in catalog (SKU-ELC-001, SKU-ELC-004)
    req = SimulationRequest(
        supplier_id="SUP001",
        disruption_duration_days=10
    )
    res = SimulationService.run_simulation(req)
    assert res.total_products_affected == 2
