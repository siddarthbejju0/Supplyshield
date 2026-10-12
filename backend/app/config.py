import os
from pathlib import Path

# Resolve base directories safely
BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
DATA_DIR = Path(os.getenv("DATA_DIR", PROJECT_ROOT / "data"))

# Reference date for the synthetic business snapshot
SCENARIO_CUTOFF_DATE = "2026-09-30"

# Currency
CURRENCY_CODE = "GBP"
CURRENCY_SYMBOL = "£"

# Risk Scoring Weights (Must total 1.0)
RISK_WEIGHTS = {
    "on_time_performance": 0.35,
    "delay_severity": 0.20,
    "defect_rate": 0.15,
    "financial_risk": 0.15,
    "supplier_dependency": 0.15,
}

# Validation: ensure weights sum to 1.0
assert abs(sum(RISK_WEIGHTS.values()) - 1.0) < 1e-6, "Risk weights must sum to 1.0"
