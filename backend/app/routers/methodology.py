from fastapi import APIRouter
from typing import Dict, Any
from backend.app.config import RISK_WEIGHTS, SCENARIO_CUTOFF_DATE, CURRENCY_CODE, CURRENCY_SYMBOL

router = APIRouter(prefix="/api/methodology", tags=["Methodology"])

@router.get("")
def get_methodology() -> Dict[str, Any]:
    return {
        "title": "SupplyShield AI — Methodology, Formulas & Assumptions",
        "scenario_metadata": {
            "entity": "Northstar Retail (Fictional UK Retail Distributor)",
            "data_classification": "Synthetic Demonstrative Portfolio Dataset",
            "snapshot_date": SCENARIO_CUTOFF_DATE,
            "currency": f"{CURRENCY_CODE} ({CURRENCY_SYMBOL})"
        },
        "inventory_formulas": [
            {
                "metric": "Days of Cover (DOC)",
                "formula": "Current Stock Units / Average Daily Demand Units",
                "explanation": "Calculates the number of days existing on-hand stock can satisfy run-rate customer demand assuming no inbound arrivals. If demand is 0, DOC is flagged as N/A (infinite coverage)."
            },
            {
                "metric": "Expected Lead-Time Demand (LTD)",
                "formula": "Average Daily Demand Units * Supplier Replenishment Lead Time (Days)",
                "explanation": "Quantifies the quantity of stock required to fulfill normal customer orders during the supplier's standard lead-time window."
            },
            {
                "metric": "Potential Lead-Time Shortfall",
                "formula": "max(0, Expected Lead-Time Demand - Current Stock Units)",
                "explanation": "The projected stock deficit before replenishment arrives if reorders are triggered today."
            },
            {
                "metric": "Stockout Exposure Value",
                "formula": "Potential Lead-Time Shortfall * Unit Value (£)",
                "explanation": "Indicative monetary exposure of unfulfilled stock at retail inventory valuation."
            }
        ],
        "supplier_formulas": [
            {
                "metric": "On-Time Delivery Rate (OTD %)",
                "formula": "(On-Time Completed POs / Total Completed POs) * 100",
                "explanation": "Calculated strictly from purchase order execution records where actual delivery date <= expected delivery date. Requires minimum 3 completed orders."
            },
            {
                "metric": "Average Delay Days",
                "formula": "sum(max(0, Actual Delivery Date - Expected Delivery Date)) / Completed Late Orders",
                "explanation": "Average slippage observed on delayed shipments in days."
            },
            {
                "metric": "Supplier Risk Score (0-100)",
                "formula": "sum(Component Risk * Weight)",
                "explanation": "Normalized composite metric where higher scores represent higher operational risk."
            }
        ],
        "risk_weights": RISK_WEIGHTS,
        "risk_bands": {
            "Critical": "Score >= 60.0 (High delivery failure risk, significant lead time slippage, or deep dependency)",
            "High": "Score 42.0 to 59.9 (Frequent delays, low on-time performance, or elevated financial risk)",
            "Moderate": "Score 25.0 to 41.9 (Occasional minor slippage, acceptable SLA compliance)",
            "Low": "Score < 25.0 (High reliability, excellent on-time records, strong financial stability)"
        },
        "simulation_model": {
            "model_type": "Discrete Day-by-Day Balance Model",
            "equations": [
                "Available Stock(t) = max(0, Available Stock(t-1) + Arrivals(t) - Scenario Demand(t))",
                "Unmet Demand(t) = max(0, Scenario Demand(t) - (Available Stock(t-1) + Arrivals(t)))"
            ],
            "boundary_conditions": "Stock cannot drop below 0 units. Unmet demand is tracked distinctly and does not double-count."
        },
        "glossary": [
            {"term": "Days of Cover (DOC)", "definition": "A standard inventory metric estimating how long current inventory will last at current daily consumption rates."},
            {"term": "Lead Time", "definition": "The total latency elapsed between placing a purchase order and receiving goods ready for use."},
            {"term": "Safety Stock", "definition": "Buffer inventory maintained to protect against demand spikes and vendor delivery delays."},
            {"term": "Reorder Point (ROP)", "definition": "The inventory threshold level that triggers a replenishment purchase order (Lead Time Demand + Safety Stock)."},
            {"term": "Dual Sourcing", "definition": "The operational practice of splitting procurement across two independent suppliers to reduce disruption vulnerability."}
        ]
    }
