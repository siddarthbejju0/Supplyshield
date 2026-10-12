from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from backend.app.services.supplier_service import SupplierService
from backend.app.schemas import SupplierItem
from backend.app.data_loader import get_data_loader

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierItem])
def get_suppliers() -> List[SupplierItem]:
    return SupplierService.get_suppliers()

@router.get("/{supplier_id}")
def get_supplier_detail(supplier_id: str):
    supplier = SupplierService.get_supplier_by_id(supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail=f"Supplier '{supplier_id}' not found")
    
    loader = get_data_loader()
    po_df = loader.purchase_orders_df
    inv_df = loader.inventory_df

    # Orders for this supplier
    s_pos = po_df[po_df["supplier_id"].str.lower() == supplier_id.lower()].sort_values("order_date", ascending=False)
    
    # Products supplied
    s_prods = inv_df[inv_df["supplier_id"].str.lower() == supplier_id.lower()]

    return {
        "supplier": supplier,
        "purchase_orders": s_pos.to_dict(orient="records"),
        "products": s_prods.to_dict(orient="records")
    }

@router.get("/compare/batch")
def compare_suppliers(ids: str = Query(..., description="Comma-separated supplier IDs")):
    supplier_id_list = [s.strip().upper() for s in ids.split(",") if s.strip()]
    all_sups = SupplierService.get_suppliers()
    matched = [s for s in all_sups if s.supplier_id.upper() in supplier_id_list]
    if not matched:
        raise HTTPException(status_code=404, detail="No matching suppliers found for comparison.")
    return matched
