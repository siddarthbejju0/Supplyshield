import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from backend.app.config import DATA_DIR, PROJECT_ROOT

class DataLoader:
    _instance = None
    
    def __init__(self):
        self.company_name: str = "My Company"
        self.is_custom_data: bool = True
        self.suppliers_df = pd.DataFrame()
        self.inventory_df = pd.DataFrame()
        self.purchase_orders_df = pd.DataFrame()
        self.demand_history_df = pd.DataFrame()
        self.supplier_options_df = pd.DataFrame()
        self.clear_workspace("My Company")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def reload(self):
        self.load_all()

    def set_company_name(self, name: str):
        self.company_name = name

    def load_all(self):
        self.company_name = "Northstar Retail"
        self.is_custom_data = False
        suppliers_path = DATA_DIR / "suppliers.csv"
        inventory_path = DATA_DIR / "inventory.csv"
        po_path = DATA_DIR / "purchase_orders.csv"
        demand_path = DATA_DIR / "demand_history.csv"
        options_path = DATA_DIR / "supplier_product_options.csv"

        if not suppliers_path.exists():
            raise FileNotFoundError(f"Missing required dataset: {suppliers_path}")
        if not inventory_path.exists():
            raise FileNotFoundError(f"Missing required dataset: {inventory_path}")
        if not po_path.exists():
            raise FileNotFoundError(f"Missing required dataset: {po_path}")
        if not demand_path.exists():
            raise FileNotFoundError(f"Missing required dataset: {demand_path}")
        if not options_path.exists():
            raise FileNotFoundError(f"Missing required dataset: {options_path}")

        # Load and coerce safely
        self.suppliers_df = pd.read_csv(suppliers_path)
        self.suppliers_df["standard_lead_time_days"] = pd.to_numeric(self.suppliers_df.get("standard_lead_time_days", 7), errors="coerce").fillna(7).astype(int)
        self.suppliers_df["quoted_unit_cost"] = pd.to_numeric(self.suppliers_df.get("quoted_unit_cost", 0.0), errors="coerce").fillna(0.0)
        self.suppliers_df["historical_on_time_rate_pct"] = pd.to_numeric(self.suppliers_df.get("historical_on_time_rate_pct", 90.0), errors="coerce").fillna(90.0)
        self.suppliers_df["historical_defect_rate_pct"] = pd.to_numeric(self.suppliers_df.get("historical_defect_rate_pct", 1.0), errors="coerce").fillna(1.0)
        self.suppliers_df["capacity_units_per_day"] = pd.to_numeric(self.suppliers_df.get("capacity_units_per_day", 1000), errors="coerce").fillna(1000).astype(int)
        self.suppliers_df["minimum_order_quantity"] = pd.to_numeric(self.suppliers_df.get("minimum_order_quantity", 100), errors="coerce").fillna(100).astype(int)
        self.suppliers_df["financial_risk_score"] = pd.to_numeric(self.suppliers_df.get("financial_risk_score", 25.0), errors="coerce").fillna(25.0)
        self.suppliers_df["sustainability_score"] = pd.to_numeric(self.suppliers_df.get("sustainability_score", 75.0), errors="coerce").fillna(75.0)

        self.inventory_df = pd.read_csv(inventory_path)
        self.inventory_df["current_stock_units"] = pd.to_numeric(self.inventory_df.get("current_stock_units", 0), errors="coerce").fillna(0).astype(int)
        self.inventory_df["average_daily_demand_units"] = pd.to_numeric(self.inventory_df.get("average_daily_demand_units", 1.0), errors="coerce").fillna(1.0)
        self.inventory_df["demand_std_dev_units"] = pd.to_numeric(self.inventory_df.get("demand_std_dev_units", 0.0), errors="coerce").fillna(0.0)
        self.inventory_df["reorder_point_units"] = pd.to_numeric(self.inventory_df.get("reorder_point_units", 0), errors="coerce").fillna(0).astype(int)
        self.inventory_df["safety_stock_units"] = pd.to_numeric(self.inventory_df.get("safety_stock_units", 0), errors="coerce").fillna(0).astype(int)
        self.inventory_df["unit_value"] = pd.to_numeric(self.inventory_df.get("unit_value", 10.0), errors="coerce").fillna(10.0)
        self.inventory_df["target_service_level_pct"] = pd.to_numeric(self.inventory_df.get("target_service_level_pct", 95.0), errors="coerce").fillna(95.0)

        self.purchase_orders_df = pd.read_csv(po_path)
        self.purchase_orders_df["quantity_ordered"] = pd.to_numeric(self.purchase_orders_df.get("quantity_ordered", 0), errors="coerce").fillna(0).astype(int)
        self.purchase_orders_df["quantity_received"] = pd.to_numeric(self.purchase_orders_df.get("quantity_received", 0), errors="coerce").fillna(0).astype(int)
        self.purchase_orders_df["unit_cost"] = pd.to_numeric(self.purchase_orders_df.get("unit_cost", 0.0), errors="coerce").fillna(0.0)
        if "actual_delivery_date" in self.purchase_orders_df.columns:
            self.purchase_orders_df["actual_delivery_date"] = self.purchase_orders_df["actual_delivery_date"].fillna("")
        else:
            self.purchase_orders_df["actual_delivery_date"] = ""

        self.demand_history_df = pd.read_csv(demand_path)
        self.demand_history_df["units_sold"] = pd.to_numeric(self.demand_history_df.get("units_sold", 0.0), errors="coerce").fillna(0.0)
        self.demand_history_df["demand_forecast_units"] = pd.to_numeric(self.demand_history_df.get("demand_forecast_units", 0.0), errors="coerce").fillna(0.0)

        self.supplier_options_df = pd.read_csv(options_path)
        self.supplier_options_df["lead_time_days"] = pd.to_numeric(self.supplier_options_df.get("lead_time_days", 7), errors="coerce").fillna(7).astype(int)
        self.supplier_options_df["expedited_lead_time_days"] = pd.to_numeric(self.supplier_options_df.get("expedited_lead_time_days", 3), errors="coerce").fillna(3).astype(int)
        self.supplier_options_df["unit_cost"] = pd.to_numeric(self.supplier_options_df.get("unit_cost", 0.0), errors="coerce").fillna(0.0)
        self.supplier_options_df["expedited_freight_premium_per_unit"] = pd.to_numeric(self.supplier_options_df.get("expedited_freight_premium_per_unit", 5.0), errors="coerce").fillna(5.0)
        self.supplier_options_df["switching_cost"] = pd.to_numeric(self.supplier_options_df.get("switching_cost", 0.0), errors="coerce").fillna(0.0)

    def import_custom_dataset(self, file_type: str, df: pd.DataFrame, company_name: Optional[str] = None):
        """
        Dynamically hot-swaps a dataset in memory and updates calculations live.
        """
        if company_name:
            self.company_name = company_name
        self.is_custom_data = True

        if file_type == "suppliers":
            self.suppliers_df = df
        elif file_type == "inventory":
            self.inventory_df = df
        elif file_type == "purchase_orders":
            self.purchase_orders_df = df
        elif file_type == "demand_history":
            self.demand_history_df = df
        elif file_type == "supplier_product_options":
            self.supplier_options_df = df

    def reset_to_demo(self):
        """
        Resets data back to default Northstar Retail dataset.
        """
        self.company_name = "Northstar Retail"
        self.is_custom_data = False
        self.load_all()

    def clear_workspace(self, company_name: str = "New Company"):
        """
        Clears all in-memory datasets to provide a 100% blank workspace for new companies.
        """
        self.company_name = company_name
        self.is_custom_data = True
        self.suppliers_df = pd.DataFrame(columns=[
            "supplier_id", "supplier_name", "country", "category",
            "standard_lead_time_days", "quoted_unit_cost", "historical_on_time_rate_pct",
            "historical_defect_rate_pct", "capacity_units_per_day", "minimum_order_quantity",
            "financial_risk_score", "sustainability_score"
        ])
        self.inventory_df = pd.DataFrame(columns=[
            "product_id", "product_name", "category", "supplier_id",
            "current_stock_units", "average_daily_demand_units", "demand_std_dev_units",
            "reorder_point_units", "safety_stock_units", "unit_value", "target_service_level_pct"
        ])
        self.purchase_orders_df = pd.DataFrame(columns=[
            "purchase_order_id", "supplier_id", "product_id",
            "quantity_ordered", "quantity_received", "unit_cost",
            "order_date", "expected_delivery_date", "actual_delivery_date", "status"
        ])
        self.demand_history_df = pd.DataFrame(columns=[
            "date", "product_id", "units_sold", "demand_forecast_units"
        ])
        self.supplier_options_df = pd.DataFrame(columns=[
            "product_id", "supplier_id", "lead_time_days",
            "expedited_lead_time_days", "unit_cost", "expedited_freight_premium_per_unit", "switching_cost"
        ])


def get_data_loader() -> DataLoader:
    return DataLoader.get_instance()
