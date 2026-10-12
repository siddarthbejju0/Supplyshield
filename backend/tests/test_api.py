def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["data_loaded"] is True

def test_overview_endpoint(client):
    res = client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "kpis" in data
    assert data["kpis"]["total_active_products"] == 24
    assert len(data["risk_distribution"]) == 4
    assert len(data["category_breakdown"]) > 0
    assert len(data["alerts"]) > 0
    assert "executive_summary" in data

def test_inventory_endpoint(client):
    res = client.get("/api/inventory")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 24
    assert "summary" in data

    # Test filtering
    res_filtered = client.get("/api/inventory?risk_level=Critical")
    assert res_filtered.status_code == 200
    filtered_items = res_filtered.json()["items"]
    assert all(i["risk_level"] == "Critical" for i in filtered_items)

def test_inventory_detail_and_demand_history(client):
    res = client.get("/api/inventory/SKU-ELC-001")
    assert res.status_code == 200
    assert res.json()["product_id"] == "SKU-ELC-001"

    hist_res = client.get("/api/inventory/SKU-ELC-001/demand-history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) == 90
    assert "units_sold" in hist[0]
    assert "demand_forecast_units" in hist[0]

def test_suppliers_endpoint(client):
    res = client.get("/api/suppliers")
    assert res.status_code == 200
    sups = res.json()
    assert len(sups) == 10
    
    # Detail
    detail_res = client.get("/api/suppliers/SUP001")
    assert detail_res.status_code == 200
    d_data = detail_res.json()
    assert "purchase_orders" in d_data
    assert "products" in d_data

def test_simulation_endpoint(client):
    payload = {
        "product_id": "SKU-ELC-002",
        "disruption_duration_days": 14,
        "demand_multiplier": 1.15,
        "stock_reduction_pct": 10.0,
        "allow_open_po_arrivals": False
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["disruption_duration_days"] == 14
    assert data["total_products_affected"] == 1
    assert "aggregated_trajectory" in data

def test_mitigation_endpoint(client):
    payload = {
        "product_id": "SKU-ELC-002",
        "shortage_units": 400.0,
        "disruption_duration_days": 14
    }
    res = client.post("/api/mitigation/compare", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["options"]) >= 4
    assert "recommended_strategy_key" in data

def test_data_quality_endpoint(client):
    res = client.get("/api/data-explorer/quality")
    assert res.status_code == 200
    data = res.json()
    assert len(data["datasets"]) == 5
    assert data["data_quality_score"] >= 90.0

def test_methodology_endpoint(client):
    res = client.get("/api/methodology")
    assert res.status_code == 200
    data = res.json()
    assert "inventory_formulas" in data
    assert "supplier_formulas" in data
    assert "risk_weights" in data
