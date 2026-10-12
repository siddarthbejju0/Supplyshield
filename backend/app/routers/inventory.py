from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from backend.app.services.inventory_service import InventoryService
from backend.app.schemas import InventoryItem, InventorySummary
from backend.app.data_loader import get_data_loader

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("")
def get_inventory(
    category: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    supplier_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    items = InventoryService.get_inventory_items(
        category=category,
        risk_level=risk_level,
        supplier_id=supplier_id,
        search=search
    )
    summary = InventoryService.get_inventory_summary()
    return {
        "items": items,
        "summary": summary
    }

@router.get("/categories")
def get_categories() -> List[str]:
    loader = get_data_loader()
    return sorted(list(loader.inventory_df["category"].dropna().unique()))

@router.get("/{product_id}")
def get_product_detail(product_id: str) -> InventoryItem:
    item = InventoryService.get_product_by_id(product_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return item

@router.get("/{product_id}/demand-history")
def get_product_demand_history(product_id: str) -> List[Dict[str, Any]]:
    loader = get_data_loader()
    df = loader.demand_history_df
    matches = df[df["product_id"].str.lower() == product_id.lower()].sort_values("date")
    if matches.empty:
        raise HTTPException(status_code=404, detail=f"No demand history found for '{product_id}'")
    return matches[["date", "units_sold", "demand_forecast_units"]].to_dict(orient="records")
