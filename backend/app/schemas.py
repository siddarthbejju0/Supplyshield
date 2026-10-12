from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Health
class HealthResponse(BaseModel):
    status: str
    message: str
    scenario_cutoff_date: str
    data_loaded: bool
    version: str = "1.0.0"

# Inventory
class InventoryItem(BaseModel):
    product_id: str
    product_name: str
    category: str
    supplier_id: str
    supplier_name: Optional[str] = None
    current_stock_units: int
    average_daily_demand_units: float
    demand_std_dev_units: float
    reorder_point_units: int
    safety_stock_units: int
    unit_value: float
    target_service_level_pct: float
    criticality: str
    
    # Calculated fields
    days_of_cover: Optional[float] = None
    lead_time_days: int
    expected_lead_time_demand: float
    stockout_shortfall_units: float
    stockout_exposure_value: float
    inventory_value: float
    risk_level: str  # Critical, High, Moderate, Low
    risk_rationale: str
    recommended_action: str
    has_excess_stock: bool

class InventorySummary(BaseModel):
    total_products: int
    total_inventory_units: int
    total_inventory_value: float
    total_exposure_value: float
    critical_count: int
    high_risk_count: int
    moderate_risk_count: int
    low_risk_count: int
    excess_stock_count: int

# Supplier
class SupplierRiskBreakdown(BaseModel):
    on_time_risk: float
    delay_risk: float
    defect_risk: float
    financial_risk: float
    dependency_risk: float
    total_risk_score: float
    risk_band: str  # Low, Moderate, High, Critical
    weights_used: Dict[str, float]

class SupplierItem(BaseModel):
    supplier_id: str
    supplier_name: str
    country: str
    category: str
    standard_lead_time_days: int
    quoted_unit_cost: float
    historical_on_time_rate_pct: float
    historical_defect_rate_pct: float
    capacity_units_per_day: int
    minimum_order_quantity: int
    financial_risk_score: float
    sustainability_score: float
    
    # Calculated from POs
    calculated_on_time_rate_pct: Optional[float] = None
    data_sufficiency: str  # e.g. "Calculated from 8 POs" or "Insufficient history"
    average_actual_lead_time_days: Optional[float] = None
    average_delay_days: Optional[float] = None
    total_completed_orders: int
    late_completed_orders: int
    open_orders_count: int
    open_delayed_orders_count: int
    
    # Dependency & Concentration
    products_supplied_count: int
    tied_inventory_value: float
    inventory_value_share_pct: float
    single_source_product_count: int
    
    # Risk Score
    risk_breakdown: SupplierRiskBreakdown
    risk_score: float
    risk_band: str
    actionable_recommendations: List[str]

# Overview
class OverviewKpis(BaseModel):
    total_active_products: int
    total_inventory_units: int
    total_inventory_value: float
    critical_or_high_risk_products: int
    average_supplier_on_time_rate_pct: float
    open_delayed_purchase_orders: int
    estimated_inventory_exposure_value: float

class CategoryBreakdown(BaseModel):
    category: str
    total_products: int
    total_value: float
    critical_products: int

class RiskDistribution(BaseModel):
    risk_level: str
    count: int
    percentage: float
    total_value: float

class OverviewAlert(BaseModel):
    id: str
    severity: str  # Critical, Warning, Info
    title: str
    description: str
    target_page: str
    target_id: Optional[str] = None

class OverviewResponse(BaseModel):
    kpis: OverviewKpis
    risk_distribution: List[RiskDistribution]
    category_breakdown: List[CategoryBreakdown]
    alerts: List[OverviewAlert]
    executive_summary: str
    last_updated: str

# Simulation
class SimulationRequest(BaseModel):
    supplier_id: Optional[str] = None  # Specific supplier or None for all
    product_id: Optional[str] = None   # Specific product or None for supplier's products
    disruption_duration_days: int = Field(default=14, ge=1, le=120)
    demand_multiplier: float = Field(default=1.10, ge=0.5, le=3.0)
    stock_reduction_pct: float = Field(default=0.0, ge=0.0, le=90.0)
    allow_open_po_arrivals: bool = Field(default=False)
    scenario_name: Optional[str] = "Supplier Disruption with 10% Demand Surge"

class DailyTrajectoryPoint(BaseModel):
    day: int
    date: str
    baseline_stock: float
    scenario_stock: float
    unmet_demand_units: float
    cumulative_unmet_units: float

class ProductSimulationResult(BaseModel):
    product_id: str
    product_name: str
    supplier_id: str
    initial_stock: float
    scenario_daily_demand: float
    days_until_stockout: Optional[int]
    total_unmet_units: float
    unmet_demand_value: float
    stocks_out_during_scenario: bool
    trajectory: List[DailyTrajectoryPoint]

class SimulationResponse(BaseModel):
    scenario_name: str
    disruption_duration_days: int
    demand_multiplier: float
    stock_reduction_pct: float
    allow_open_po_arrivals: bool
    total_products_affected: int
    products_stocking_out_count: int
    total_unmet_units: float
    total_unmet_value: float
    product_results: List[ProductSimulationResult]
    aggregated_trajectory: List[DailyTrajectoryPoint]
    key_drivers_summary: str

# Mitigation
class MitigationRequest(BaseModel):
    product_id: str
    shortage_units: Optional[float] = None  # If None, use lead-time shortfall
    disruption_duration_days: int = Field(default=14, ge=1, le=90)
    custom_expedite_premium_pct: Optional[float] = None
    custom_alternative_supplier_id: Optional[str] = None
    max_budget: Optional[float] = None

class MitigationStrategyOption(BaseModel):
    strategy_key: str
    strategy_name: str
    description: str
    is_feasible: bool
    feasibility_notes: str
    incremental_cost: float
    units_covered: float
    remaining_shortage_units: float
    replenishment_time_days: int
    cost_per_unit_protected: float
    service_impact_score: float  # 0 to 100
    risk_level: str
    key_assumptions: List[str]

class MitigationComparisonResponse(BaseModel):
    product_id: str
    product_name: str
    unit_value: float
    current_stock: int
    projected_shortage_units: float
    shortage_value_at_risk: float
    options: List[MitigationStrategyOption]
    recommended_strategy_key: str
    recommendation_rationale: str
    budget_constraint_met: bool

# Data Explorer & Quality
class DataQualityCheck(BaseModel):
    check_name: str
    dataset: str
    status: str  # PASS, WARNING, FAIL
    details: str

class DatasetMetadata(BaseModel):
    dataset_name: str
    filename: str
    record_count: int
    column_count: int
    columns: List[str]
    missing_values_count: int
    sample_records: List[Dict[str, Any]]

class DataExplorerResponse(BaseModel):
    datasets: List[DatasetMetadata]
    quality_checks: List[DataQualityCheck]
    data_quality_score: float
