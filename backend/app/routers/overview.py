from fastapi import APIRouter
from typing import List
from backend.app.services.inventory_service import InventoryService
from backend.app.services.supplier_service import SupplierService
from backend.app.schemas import (
    OverviewResponse,
    OverviewKpis,
    CategoryBreakdown,
    RiskDistribution,
    OverviewAlert
)
from backend.app.config import SCENARIO_CUTOFF_DATE

router = APIRouter(prefix="/api/overview", tags=["Overview"])

@router.get("", response_model=OverviewResponse)
@router.get("/", response_model=OverviewResponse)
def get_overview_dashboard():
    inv_items = InventoryService.get_inventory_items()
    suppliers = SupplierService.get_suppliers()

    # Calculate KPIs
    total_products = len(inv_items)
    total_units = sum(i.current_stock_units for i in inv_items)
    total_val = round(sum(i.inventory_value for i in inv_items), 2)
    total_exposure = round(sum(i.stockout_exposure_value for i in inv_items), 2)
    
    crit_or_high = sum(1 for i in inv_items if i.risk_level in ["Critical", "High"])

    valid_on_times = [s.calculated_on_time_rate_pct for s in suppliers if s.calculated_on_time_rate_pct is not None]
    avg_on_time = round(sum(valid_on_times) / len(valid_on_times), 1) if valid_on_times else 90.0

    open_delayed_pos = sum(s.open_delayed_orders_count for s in suppliers)

    kpis = OverviewKpis(
        total_active_products=total_products,
        total_inventory_units=total_units,
        total_inventory_value=total_val,
        critical_or_high_risk_products=crit_or_high,
        average_supplier_on_time_rate_pct=avg_on_time,
        open_delayed_purchase_orders=open_delayed_pos,
        estimated_inventory_exposure_value=total_exposure
    )

    # Risk Distribution
    risk_counts = {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0}
    risk_vals = {"Critical": 0.0, "High": 0.0, "Moderate": 0.0, "Low": 0.0}

    for item in inv_items:
        r = item.risk_level
        risk_counts[r] = risk_counts.get(r, 0) + 1
        risk_vals[r] = round(risk_vals.get(r, 0.0) + item.inventory_value, 2)

    risk_dist: List[RiskDistribution] = []
    for r_level in ["Critical", "High", "Moderate", "Low"]:
        cnt = risk_counts.get(r_level, 0)
        pct = round((cnt / max(1, total_products)) * 100.0, 1)
        risk_dist.append(RiskDistribution(
            risk_level=r_level,
            count=cnt,
            percentage=pct,
            total_value=risk_vals.get(r_level, 0.0)
        ))

    # Category Breakdown
    cat_map = {}
    for item in inv_items:
        c = item.category
        if c not in cat_map:
            cat_map[c] = {"count": 0, "value": 0.0, "critical": 0}
        cat_map[c]["count"] += 1
        cat_map[c]["value"] += item.inventory_value
        if item.risk_level in ["Critical", "High"]:
            cat_map[c]["critical"] += 1

    cat_breakdown: List[CategoryBreakdown] = []
    for c_name, data in cat_map.items():
        cat_breakdown.append(CategoryBreakdown(
            category=c_name,
            total_products=data["count"],
            total_value=round(data["value"], 2),
            critical_products=data["critical"]
        ))
    cat_breakdown.sort(key=lambda x: x.total_value, reverse=True)

    # Dynamic Alerts from actual data
    alerts: List[OverviewAlert] = []
    alert_idx = 1

    # Alert on Critical stockout exposure
    critical_items = [i for i in inv_items if i.risk_level == "Critical"]
    for crit in critical_items[:3]:
        alerts.append(OverviewAlert(
            id=f"ALT-{alert_idx:03d}",
            severity="Critical",
            title=f"Stockout Imminent: {crit.product_name}",
            description=f"Days of cover ({crit.days_of_cover}d) is significantly lower than supplier lead time ({crit.lead_time_days}d). Shortfall value: £{crit.stockout_exposure_value:,.2f}.",
            target_page="inventory",
            target_id=crit.product_id
        ))
        alert_idx += 1

    # Alert on Delayed Open POs
    delayed_sups = [s for s in suppliers if s.open_delayed_orders_count > 0]
    for s in delayed_sups[:2]:
        alerts.append(OverviewAlert(
            id=f"ALT-{alert_idx:03d}",
            severity="Warning",
            title=f"Overdue Purchase Orders: {s.supplier_name}",
            description=f"Supplier has {s.open_delayed_orders_count} purchase order(s) past expected arrival date with average historical delay of {s.average_delay_days} days.",
            target_page="suppliers",
            target_id=s.supplier_id
        ))
        alert_idx += 1

    # Alert on High concentration
    high_conc_sups = [s for s in suppliers if s.inventory_value_share_pct >= 18.0]
    for s in high_conc_sups[:1]:
        alerts.append(OverviewAlert(
            id=f"ALT-{alert_idx:03d}",
            severity="Info",
            title=f"Inventory Concentration: {s.supplier_name}",
            description=f"Supplier accounts for {s.inventory_value_share_pct}% of total retail stock value (£{s.tied_inventory_value:,.2f}).",
            target_page="suppliers",
            target_id=s.supplier_id
        ))
        alert_idx += 1

    # Rule-based Executive Summary
    from backend.app.data_loader import get_data_loader
    loader = get_data_loader()
    company = loader.company_name

    if total_products == 0:
        summary = (
            f"Welcome to {company}'s SupplyShield workspace. No inventory or supplier datasets have been ingested yet. "
            f"Import your company CSV files to unlock real-time risk intelligence, stockout predictions, and mitigation planning."
        )
    else:
        summary = (
            f"{company} currently manages {total_products} active product lines across {len(suppliers)} suppliers, "
            f"with total inventory holding value of £{total_val:,.2f}. "
            f"{crit_or_high} products are in Critical or High vulnerability tiers, driving an estimated £{total_exposure:,.2f} "
            f"in lead-time stockout exposure. "
            f"{open_delayed_pos} purchase orders are currently overdue. "
            f"Management recommended focus: prioritize replenishment and expedited logistics for critical lines, "
            f"and execute supplier SLA reviews on underperforming shipping lanes."
        )

    return OverviewResponse(
        kpis=kpis,
        risk_distribution=risk_dist,
        category_breakdown=cat_breakdown,
        alerts=alerts,
        executive_summary=summary,
        last_updated=SCENARIO_CUTOFF_DATE
    )
