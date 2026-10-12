from typing import List, Dict, Any
import pandas as pd
from backend.app.data_loader import get_data_loader
from backend.app.schemas import (
    DataExplorerResponse,
    DatasetMetadata,
    DataQualityCheck
)

class DataQualityService:
    @staticmethod
    def inspect_datasets() -> DataExplorerResponse:
        loader = get_data_loader()
        
        datasets_info: List[DatasetMetadata] = []
        checks: List[DataQualityCheck] = []

        raw_dfs = {
            "suppliers.csv": ("Suppliers Master", loader.suppliers_df, "supplier_id"),
            "inventory.csv": ("Inventory & Demand", loader.inventory_df, "product_id"),
            "purchase_orders.csv": ("Purchase Orders History", loader.purchase_orders_df, "purchase_order_id"),
            "demand_history.csv": ("90-Day Demand Timeseries", loader.demand_history_df, None),
            "supplier_product_options.csv": ("Sourcing & Mitigation Matrix", loader.supplier_options_df, None)
        }

        passed_checks = 0
        total_checks = 0

        for filename, (name, df, pk) in raw_dfs.items():
            missing_count = int(df.isna().sum().sum())
            sample_records = df.head(10).to_dict(orient="records")

            # Clean any NaN in sample records for JSON compatibility
            cleaned_samples = []
            for rec in sample_records:
                cleaned_rec = {}
                for k, v in rec.items():
                    if pd.isna(v):
                        cleaned_rec[k] = ""
                    else:
                        cleaned_rec[k] = v
                cleaned_samples.append(cleaned_rec)

            datasets_info.append(DatasetMetadata(
                dataset_name=name,
                filename=filename,
                record_count=len(df),
                column_count=len(df.columns),
                columns=list(df.columns),
                missing_values_count=missing_count,
                sample_records=cleaned_samples
            ))

            # Quality Check 1: Missing values check
            total_checks += 1
            if missing_count == 0:
                passed_checks += 1
                checks.append(DataQualityCheck(
                    check_name="Null & Missing Value Audit",
                    dataset=filename,
                    status="PASS",
                    details=f"All {len(df)} records contain complete data (0 nulls)."
                ))
            else:
                checks.append(DataQualityCheck(
                    check_name="Null & Missing Value Audit",
                    dataset=filename,
                    status="WARNING",
                    details=f"Found {missing_count} null/empty values."
                ))

            # Quality Check 2: Primary Key Uniqueness
            if pk:
                total_checks += 1
                dupes = df[pk].duplicated().sum()
                if dupes == 0:
                    passed_checks += 1
                    checks.append(DataQualityCheck(
                        check_name="Primary Key Uniqueness",
                        dataset=filename,
                        status="PASS",
                        details=f"Primary key '{pk}' is 100% unique across all {len(df)} records."
                    ))
                else:
                    checks.append(DataQualityCheck(
                        check_name="Primary Key Uniqueness",
                        dataset=filename,
                        status="FAIL",
                        details=f"Detected {dupes} duplicate keys on '{pk}'."
                    ))

        # Referential Integrity Checks
        sup_ids = set(loader.suppliers_df["supplier_id"])
        prod_ids = set(loader.inventory_df["product_id"])

        # Check: Inventory -> Supplier
        total_checks += 1
        inv_orphans = set(loader.inventory_df["supplier_id"]) - sup_ids
        if not inv_orphans:
            passed_checks += 1
            checks.append(DataQualityCheck(
                check_name="Foreign Key Integrity (Inventory -> Suppliers)",
                dataset="inventory.csv",
                status="PASS",
                details="All products reference existing valid supplier IDs."
            ))
        else:
            checks.append(DataQualityCheck(
                check_name="Foreign Key Integrity (Inventory -> Suppliers)",
                dataset="inventory.csv",
                status="FAIL",
                details=f"Orphaned supplier IDs in inventory: {inv_orphans}"
            ))

        # Check: PO -> Supplier & Product
        total_checks += 1
        po_sup_orphans = set(loader.purchase_orders_df["supplier_id"]) - sup_ids
        po_prod_orphans = set(loader.purchase_orders_df["product_id"]) - prod_ids
        if not po_sup_orphans and not po_prod_orphans:
            passed_checks += 1
            checks.append(DataQualityCheck(
                check_name="Foreign Key Integrity (Purchase Orders)",
                dataset="purchase_orders.csv",
                status="PASS",
                details="All 86 purchase order records map cleanly to valid suppliers and products."
            ))
        else:
            checks.append(DataQualityCheck(
                check_name="Foreign Key Integrity (Purchase Orders)",
                dataset="purchase_orders.csv",
                status="FAIL",
                details=f"Unresolved PO references: {po_sup_orphans.union(po_prod_orphans)}"
            ))

        # Check: Demand History -> Product
        total_checks += 1
        demand_orphans = set(loader.demand_history_df["product_id"]) - prod_ids
        if not demand_orphans:
            passed_checks += 1
            checks.append(DataQualityCheck(
                check_name="Foreign Key Integrity (Demand History)",
                dataset="demand_history.csv",
                status="PASS",
                details="All 2,160 timeseries entries reference registered catalog SKUs."
            ))
        else:
            checks.append(DataQualityCheck(
                check_name="Foreign Key Integrity (Demand History)",
                dataset="demand_history.csv",
                status="FAIL",
                details=f"Unresolved demand SKUs: {demand_orphans}"
            ))

        # Numeric Range Validation
        total_checks += 1
        neg_demand = (loader.inventory_df["average_daily_demand_units"] < 0).sum()
        neg_stock = (loader.inventory_df["current_stock_units"] < 0).sum()
        if neg_demand == 0 and neg_stock == 0:
            passed_checks += 1
            checks.append(DataQualityCheck(
                check_name="Numeric Value Sanity (No negative stock/demand)",
                dataset="inventory.csv",
                status="PASS",
                details="Stock units and daily demand parameters are strictly non-negative."
            ))
        else:
            checks.append(DataQualityCheck(
                check_name="Numeric Value Sanity",
                dataset="inventory.csv",
                status="FAIL",
                details="Negative values detected in stock or demand."
            ))

        score = round((passed_checks / max(1, total_checks)) * 100.0, 1)

        return DataExplorerResponse(
            datasets=datasets_info,
            quality_checks=checks,
            data_quality_score=score
        )
