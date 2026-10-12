from typing import List, Dict, Any, Optional
import pandas as pd
from backend.app.data_loader import get_data_loader
from backend.app.schemas import InventoryItem, InventorySummary

def calculate_days_of_cover(current_stock: float, average_daily_demand: float) -> Optional[float]:
    """
    Days of Cover = Current Stock Units / Average Daily Demand Units
    Returns None if demand <= 0 to avoid division by zero.
    """
    if average_daily_demand <= 0:
        return None
    return round(current_stock / average_daily_demand, 1)

def calculate_lead_time_demand(average_daily_demand: float, lead_time_days: int) -> float:
    """
    Expected Lead-Time Demand = Average Daily Demand * Supplier Lead Time (Days)
    """
    return round(average_daily_demand * lead_time_days, 1)

def calculate_shortfall(expected_lead_time_demand: float, current_stock: float) -> float:
    """
    Potential Lead-Time Shortfall = max(0, Expected Lead-Time Demand - Available Stock)
    """
    return round(max(0.0, expected_lead_time_demand - current_stock), 1)

def classify_inventory_risk(
    days_of_cover: Optional[float],
    lead_time_days: int,
    current_stock: int,
    reorder_point: int,
    safety_stock: int
) -> tuple[str, str]:
    """
    Classifies inventory into Critical, High, Moderate, Low based on coverage vs replenishment lead time.
    Returns (risk_level, rationale).
    """
    if days_of_cover is None:
        return "Low", "Negligible or zero daily demand recorded; minimal stockout risk."

    if current_stock <= 0:
        return "Critical", f"Stock depleted (0 units). Immediate stockout in effect."
    
    if days_of_cover < lead_time_days:
        return "Critical", f"Stock covers {days_of_cover} days, which is less than replenishment lead time ({lead_time_days} days). High likelihood of stockout before new orders arrive."
    
    if days_of_cover < (lead_time_days * 1.4) or current_stock <= safety_stock:
        return "High", f"Stock coverage ({days_of_cover} days) is near lead time ({lead_time_days} days) or stock is at/below safety threshold ({safety_stock} units)."
    
    if current_stock <= reorder_point:
        return "Moderate", f"Current stock ({current_stock} units) has reached or dropped below reorder point ({reorder_point} units). Reorder cycle should be triggered."
    
    return "Low", f"Healthy stock level ({days_of_cover} days cover) comfortably exceeds reorder point ({reorder_point} units)."

def determine_recommended_action(
    risk_level: str,
    days_of_cover: Optional[float],
    lead_time_days: int,
    current_stock: int,
    reorder_point: int,
    has_excess: bool
) -> str:
    """
    Rule-based actionable operational recommendation for supply chain managers.
    """
    if risk_level == "Critical":
        return f"URGENT: Expedite open purchase orders or trigger emergency alternative sourcing immediately. Current stock covers only {days_of_cover} days vs {lead_time_days}d lead time."
    elif risk_level == "High":
        return f"Issue replenishment purchase order immediately. Review safety stock and check supplier delivery lead time reliability."
    elif risk_level == "Moderate":
        return f"Schedule standard replenishment cycle. Current inventory ({current_stock} units) is near reorder point ({reorder_point} units)."
    elif has_excess:
        return f"Review inventory holding costs. Stock coverage exceeds 75 days ({days_of_cover} days). Consider promotional clearance or delaying forward orders."
    else:
        return "Maintain regular monitoring schedule. Current inventory and demand velocity are well-balanced."


class InventoryService:
    @staticmethod
    def get_inventory_items(
        category: Optional[str] = None,
        risk_level: Optional[str] = None,
        supplier_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[InventoryItem]:
        loader = get_data_loader()
        inv_df = loader.inventory_df.copy()
        sup_df = loader.suppliers_df.copy()

        # Merge supplier details for lead time & supplier name
        merged = inv_df.merge(
            sup_df[["supplier_id", "supplier_name", "standard_lead_time_days"]],
            on="supplier_id",
            how="left"
        )
        merged["standard_lead_time_days"] = merged["standard_lead_time_days"].fillna(7).astype(int)

        items: List[InventoryItem] = []

        for _, row in merged.iterrows():
            current_stock = int(row["current_stock_units"])
            daily_demand = float(row["average_daily_demand_units"])
            lead_time = int(row["standard_lead_time_days"])
            reorder_point = int(row["reorder_point_units"])
            safety_stock = int(row["safety_stock_units"])
            unit_val = float(row["unit_value"])

            doc = calculate_days_of_cover(current_stock, daily_demand)
            ltd = calculate_lead_time_demand(daily_demand, lead_time)
            shortfall = calculate_shortfall(ltd, current_stock)
            exposure_val = round(shortfall * unit_val, 2)
            inv_val = round(current_stock * unit_val, 2)
            has_excess = doc is not None and doc > 75.0

            r_level, rationale = classify_inventory_risk(doc, lead_time, current_stock, reorder_point, safety_stock)
            action = determine_recommended_action(r_level, doc, lead_time, current_stock, reorder_point, has_excess)

            item = InventoryItem(
                product_id=row["product_id"],
                product_name=row["product_name"],
                category=row["category"],
                supplier_id=row["supplier_id"],
                supplier_name=row.get("supplier_name", row["supplier_id"]),
                current_stock_units=current_stock,
                average_daily_demand_units=daily_demand,
                demand_std_dev_units=float(row["demand_std_dev_units"]),
                reorder_point_units=reorder_point,
                safety_stock_units=safety_stock,
                unit_value=unit_val,
                target_service_level_pct=float(row["target_service_level_pct"]),
                criticality=row["criticality"],
                days_of_cover=doc,
                lead_time_days=lead_time,
                expected_lead_time_demand=ltd,
                stockout_shortfall_units=shortfall,
                stockout_exposure_value=exposure_val,
                inventory_value=inv_val,
                risk_level=r_level,
                risk_rationale=rationale,
                recommended_action=action,
                has_excess_stock=has_excess
            )
            items.append(item)

        # Filters
        if category and category.lower() != "all":
            items = [i for i in items if i.category.lower() == category.lower()]
        if risk_level and risk_level.lower() != "all":
            items = [i for i in items if i.risk_level.lower() == risk_level.lower()]
        if supplier_id and supplier_id.lower() != "all":
            items = [i for i in items if i.supplier_id.lower() == supplier_id.lower()]
        if search:
            q = search.lower().strip()
            items = [i for i in items if q in i.product_name.lower() or q in i.product_id.lower()]

        return items

    @staticmethod
    def get_inventory_summary() -> InventorySummary:
        items = InventoryService.get_inventory_items()
        total_units = sum(i.current_stock_units for i in items)
        total_val = round(sum(i.inventory_value for i in items), 2)
        total_exp = round(sum(i.stockout_exposure_value for i in items), 2)

        critical_c = sum(1 for i in items if i.risk_level == "Critical")
        high_c = sum(1 for i in items if i.risk_level == "High")
        mod_c = sum(1 for i in items if i.risk_level == "Moderate")
        low_c = sum(1 for i in items if i.risk_level == "Low")
        excess_c = sum(1 for i in items if i.has_excess_stock)

        return InventorySummary(
            total_products=len(items),
            total_inventory_units=total_units,
            total_inventory_value=total_val,
            total_exposure_value=total_exp,
            critical_count=critical_c,
            high_risk_count=high_c,
            moderate_risk_count=mod_c,
            low_risk_count=low_c,
            excess_stock_count=excess_c
        )

    @staticmethod
    def get_product_by_id(product_id: str) -> Optional[InventoryItem]:
        items = InventoryService.get_inventory_items()
        for item in items:
            if item.product_id.lower() == product_id.lower():
                return item
        return None
