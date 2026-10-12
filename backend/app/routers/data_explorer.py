from fastapi import APIRouter, HTTPException, Response, UploadFile, File, Form
from typing import Optional, Dict, Any
import io
import pandas as pd
from backend.app.schemas import DataExplorerResponse
from backend.app.services.data_quality_service import DataQualityService
from backend.app.data_loader import get_data_loader
from backend.app.config import DATA_DIR

router = APIRouter(prefix="/api/data-explorer", tags=["Data Explorer"])

@router.get("/quality", response_model=DataExplorerResponse)
def get_data_quality():
    return DataQualityService.inspect_datasets()

@router.get("/company-info")
def get_company_info() -> Dict[str, Any]:
    loader = get_data_loader()
    return {
        "company_name": loader.company_name,
        "is_custom_data": loader.is_custom_data,
        "suppliers_count": len(loader.suppliers_df),
        "inventory_count": len(loader.inventory_df),
        "purchase_orders_count": len(loader.purchase_orders_df),
        "demand_history_count": len(loader.demand_history_df),
        "sourcing_options_count": len(loader.supplier_options_df),
    }

@router.post("/upload")
async def upload_dataset(
    file_type: str = Form(..., description="suppliers, inventory, purchase_orders, demand_history, supplier_product_options"),
    company_name: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    valid_types = [
        "suppliers",
        "inventory",
        "purchase_orders",
        "demand_history",
        "supplier_product_options"
    ]
    if file_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file_type '{file_type}'. Must be one of: {', '.join(valid_types)}"
        )

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    # Validation requirements per file type
    required_cols = {
        "suppliers": ["supplier_id", "supplier_name", "standard_lead_time_days"],
        "inventory": ["product_id", "product_name", "supplier_id", "current_stock_units", "average_daily_demand_units"],
        "purchase_orders": ["purchase_order_id", "supplier_id", "product_id", "order_date", "expected_delivery_date"],
        "demand_history": ["date", "product_id", "units_sold"],
        "supplier_product_options": ["product_id", "supplier_id", "lead_time_days", "unit_cost"]
    }

    missing_cols = [c for c in required_cols[file_type] if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"CSV missing mandatory columns for {file_type}: {', '.join(missing_cols)}"
        )

    loader = get_data_loader()
    loader.import_custom_dataset(file_type, df, company_name=company_name)

    return {
        "status": "success",
        "message": f"Successfully ingested {len(df)} records into live {file_type} catalog for '{loader.company_name}'.",
        "records_ingested": len(df),
        "columns": list(df.columns),
        "company_name": loader.company_name
    }

@router.post("/reset-demo")
@router.post("/reset-demo/")
@router.post("/load-sample")
@router.post("/load-sample/")
def reset_demo_data():
    loader = get_data_loader()
    loader.reset_to_demo()
    return {
        "status": "success",
        "message": "Loaded Northstar Retail sample dataset.",
        "company_name": loader.company_name
    }

@router.post("/clear")
@router.post("/clear/")
def clear_workspace(company_name: Optional[str] = None):
    loader = get_data_loader()
    loader.clear_workspace(company_name or "New Company")
    return {
        "status": "success",
        "message": "Workspace cleared. Ready for custom company data ingestion.",
        "company_name": loader.company_name
    }

@router.get("/export/{filename}")
def export_csv(filename: str):
    valid_files = [
        "suppliers.csv",
        "inventory.csv",
        "purchase_orders.csv",
        "demand_history.csv",
        "supplier_product_options.csv"
    ]
    if filename not in valid_files:
        raise HTTPException(status_code=400, detail="Invalid dataset requested for export.")
    
    file_path = DATA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Requested dataset file not found.")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
