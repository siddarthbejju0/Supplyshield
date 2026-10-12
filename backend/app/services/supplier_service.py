from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime
from backend.app.config import RISK_WEIGHTS, SCENARIO_CUTOFF_DATE
from backend.app.data_loader import get_data_loader
from backend.app.schemas import SupplierItem, SupplierRiskBreakdown

def calculate_on_time_rate(completed_orders_df: pd.DataFrame) -> tuple[Optional[float], str]:
    """
    On-Time Delivery Rate = (On-Time Completed Orders / Completed Orders) * 100
    Returns (rate, sufficiency_string).
    """
    total = len(completed_orders_df)
    if total < 3:
        return None, f"Insufficient history ({total} orders)"
    
    # An order is on time if actual_delivery_date <= expected_delivery_date
    on_time = 0
    for _, row in completed_orders_df.iterrows():
        act = str(row.get("actual_delivery_date", "")).strip()
        exp = str(row.get("expected_delivery_date", "")).strip()
        if act and exp and act <= exp:
            on_time += 1
            
    rate = round((on_time / total) * 100.0, 1)
    return rate, f"Calculated from {total} completed POs"

def calculate_lead_time_metrics(completed_orders_df: pd.DataFrame) -> tuple[Optional[float], Optional[float], int]:
    """
    Returns (avg_actual_lead_time_days, avg_delay_days, late_completed_count)
    """
    if completed_orders_df.empty:
        return None, None, 0

    lead_times = []
    delays = []
    late_count = 0

    for _, row in completed_orders_df.iterrows():
        act_str = str(row.get("actual_delivery_date", "")).strip()
        exp_str = str(row.get("expected_delivery_date", "")).strip()
        ord_str = str(row.get("order_date", "")).strip()

        if act_str and ord_str:
            try:
                act_dt = datetime.strptime(act_str, "%Y-%m-%d")
                ord_dt = datetime.strptime(ord_str, "%Y-%m-%d")
                lead_times.append((act_dt - ord_dt).days)
            except ValueError:
                pass

        if act_str and exp_str:
            try:
                act_dt = datetime.strptime(act_str, "%Y-%m-%d")
                exp_dt = datetime.strptime(exp_str, "%Y-%m-%d")
                delay = (act_dt - exp_dt).days
                if delay > 0:
                    delays.append(delay)
                    late_count += 1
                else:
                    delays.append(0)
            except ValueError:
                pass

    avg_lead_time = round(sum(lead_times) / len(lead_times), 1) if lead_times else None
    avg_delay = round(sum(delays) / len(delays), 1) if delays else 0.0

    return avg_lead_time, avg_delay, late_count

def calculate_supplier_risk_score(
    on_time_rate: Optional[float],
    historical_on_time: float,
    avg_delay_days: Optional[float],
    defect_rate_pct: float,
    financial_risk: float,
    inventory_share_pct: float
) -> tuple[SupplierRiskBreakdown, float, str]:
    """
    0-100 explainable supplier risk score.
    Higher values consistently signify HIGHER RISK.
    """
    # 1. Delivery Risk: 100 - on_time_rate
    effective_on_time = on_time_rate if on_time_rate is not None else historical_on_time
    on_time_risk = max(0.0, min(100.0, 100.0 - effective_on_time))

    # 2. Delay Severity Risk: normalized against 10 days max benchmark
    effective_delay = avg_delay_days if avg_delay_days is not None else 0.0
    delay_risk = max(0.0, min(100.0, (effective_delay / 8.0) * 100.0))

    # 3. Defect Rate Risk: normalized against 4.0% max benchmark
    defect_risk = max(0.0, min(100.0, (defect_rate_pct / 4.0) * 100.0))

    # 4. Financial Risk: already 0-100
    fin_risk = max(0.0, min(100.0, financial_risk))

    # 5. Dependency Risk: share of inventory value (e.g. 25% share = high risk)
    dependency_risk = max(0.0, min(100.0, inventory_share_pct * 3.5))

    # Weighted calculation
    w = RISK_WEIGHTS
    total = (
        w["on_time_performance"] * on_time_risk +
        w["delay_severity"] * delay_risk +
        w["defect_rate"] * defect_risk +
        w["financial_risk"] * fin_risk +
        w["supplier_dependency"] * dependency_risk
    )
    total_score = round(total, 1)

    if total_score >= 60.0:
        band = "Critical"
    elif total_score >= 42.0:
        band = "High"
    elif total_score >= 25.0:
        band = "Moderate"
    else:
        band = "Low"

    breakdown = SupplierRiskBreakdown(
        on_time_risk=round(on_time_risk, 1),
        delay_risk=round(delay_risk, 1),
        defect_risk=round(defect_risk, 1),
        financial_risk=round(fin_risk, 1),
        dependency_risk=round(dependency_risk, 1),
        total_risk_score=total_score,
        risk_band=band,
        weights_used=w
    )

    return breakdown, total_score, band

def generate_supplier_recommendations(
    supplier_name: str,
    risk_band: str,
    on_time_rate: Optional[float],
    avg_delay_days: Optional[float],
    open_delayed_count: int,
    single_source_count: int,
    share_pct: float
) -> List[str]:
    recs = []
    if open_delayed_count > 0:
        recs.append(f"Immediate Action: Escalate {open_delayed_count} overdue purchase order(s) past expected delivery date.")
    
    if on_time_rate is not None and on_time_rate < 80.0:
        recs.append(f"Quality & SLA Review: On-time delivery ({on_time_rate}%) is below the 85% operating standard. Demand formal root-cause analysis.")
    
    if avg_delay_days is not None and avg_delay_days > 3.0:
        recs.append(f"Buffer Adjustment: Average delay is {avg_delay_days} days. Increase internal replenishment safety lead times by at least {int(avg_delay_days + 1)} days.")
    
    if single_source_count > 0:
        recs.append(f"Resilience Vulnerability: {single_source_count} product(s) are solely dependent on {supplier_name} with no qualified secondary supplier.")
    
    if share_pct > 20.0:
        recs.append(f"Concentration Risk: Accounts for {share_pct}% of total retail inventory value. Evaluate dual-sourcing strategy to avoid single point of failure.")

    if not recs:
        recs.append("Performance stable: Maintain regular Quarterly Business Reviews (QBR) and vendor scorecards.")

    return recs


class SupplierService:
    @staticmethod
    def get_suppliers() -> List[SupplierItem]:
        loader = get_data_loader()
        sup_df = loader.suppliers_df.copy()
        po_df = loader.purchase_orders_df.copy()
        inv_df = loader.inventory_df.copy()
        opts_df = loader.supplier_options_df.copy()

        # Calculate total inventory value across all products
        inv_df["item_val"] = inv_df["current_stock_units"] * inv_df["unit_value"]
        total_global_inv_val = max(1.0, inv_df["item_val"].sum())

        suppliers: List[SupplierItem] = []

        for _, row in sup_df.iterrows():
            s_id = row["supplier_id"]
            s_name = row["supplier_name"]

            # Orders for this supplier
            s_pos = po_df[po_df["supplier_id"] == s_id]
            completed_pos = s_pos[s_pos["status"] == "COMPLETED"]
            open_pos = s_pos[s_pos["status"] == "OPEN"]
            delayed_open_pos = s_pos[s_pos["status"] == "DELAYED"]

            # Metrics
            on_time_rate, sufficiency = calculate_on_time_rate(completed_pos)
            avg_lead_time, avg_delay, late_count = calculate_lead_time_metrics(completed_pos)

            # Tied inventory
            s_inv = inv_df[inv_df["supplier_id"] == s_id]
            products_count = len(s_inv)
            tied_val = round(s_inv["item_val"].sum(), 2)
            share_pct = round((tied_val / total_global_inv_val) * 100.0, 1)

            # Single source count (products where no alternative exists in supplier_product_options)
            single_source_count = 0
            for p_id in s_inv["product_id"]:
                alt_options = opts_df[(opts_df["product_id"] == p_id) & (opts_df["supplier_id"] != s_id)]
                if alt_options.empty:
                    single_source_count += 1

            # Risk Score
            breakdown, risk_score, risk_band = calculate_supplier_risk_score(
                on_time_rate=on_time_rate,
                historical_on_time=float(row["historical_on_time_rate_pct"]),
                avg_delay_days=avg_delay,
                defect_rate_pct=float(row["historical_defect_rate_pct"]),
                financial_risk=float(row["financial_risk_score"]),
                inventory_share_pct=share_pct
            )

            recs = generate_supplier_recommendations(
                supplier_name=s_name,
                risk_band=risk_band,
                on_time_rate=on_time_rate,
                avg_delay_days=avg_delay,
                open_delayed_count=len(delayed_open_pos),
                single_source_count=single_source_count,
                share_pct=share_pct
            )

            suppliers.append(SupplierItem(
                supplier_id=s_id,
                supplier_name=s_name,
                country=row["country"],
                category=row["category"],
                standard_lead_time_days=int(row["standard_lead_time_days"]),
                quoted_unit_cost=float(row["quoted_unit_cost"]),
                historical_on_time_rate_pct=float(row["historical_on_time_rate_pct"]),
                historical_defect_rate_pct=float(row["historical_defect_rate_pct"]),
                capacity_units_per_day=int(row["capacity_units_per_day"]),
                minimum_order_quantity=int(row["minimum_order_quantity"]),
                financial_risk_score=float(row["financial_risk_score"]),
                sustainability_score=float(row["sustainability_score"]),
                calculated_on_time_rate_pct=on_time_rate,
                data_sufficiency=sufficiency,
                average_actual_lead_time_days=avg_lead_time,
                average_delay_days=avg_delay,
                total_completed_orders=len(completed_pos),
                late_completed_orders=late_count,
                open_orders_count=len(open_pos),
                open_delayed_orders_count=len(delayed_open_pos),
                products_supplied_count=products_count,
                tied_inventory_value=tied_val,
                inventory_value_share_pct=share_pct,
                single_source_product_count=single_source_count,
                risk_breakdown=breakdown,
                risk_score=risk_score,
                risk_band=risk_band,
                actionable_recommendations=recs
            ))

        return suppliers

    @staticmethod
    def get_supplier_by_id(supplier_id: str) -> Optional[SupplierItem]:
        suppliers = SupplierService.get_suppliers()
        for s in suppliers:
            if s.supplier_id.lower() == supplier_id.lower():
                return s
        return None
