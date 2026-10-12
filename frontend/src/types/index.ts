export interface HealthResponse {
  status: string;
  message: string;
  scenario_cutoff_date: string;
  data_loaded: boolean;
  version: string;
}

export interface InventoryItem {
  product_id: string;
  product_name: string;
  category: string;
  supplier_id: string;
  supplier_name?: string;
  current_stock_units: number;
  average_daily_demand_units: number;
  demand_std_dev_units: number;
  reorder_point_units: number;
  safety_stock_units: number;
  unit_value: number;
  target_service_level_pct: number;
  criticality: string;
  days_of_cover?: number | null;
  lead_time_days: number;
  expected_lead_time_demand: number;
  stockout_shortfall_units: number;
  stockout_exposure_value: number;
  inventory_value: number;
  risk_level: 'Critical' | 'High' | 'Moderate' | 'Low';
  risk_rationale: string;
  recommended_action: string;
  has_excess_stock: boolean;
}

export interface InventorySummary {
  total_products: number;
  total_inventory_units: number;
  total_inventory_value: number;
  total_exposure_value: number;
  critical_count: number;
  high_risk_count: number;
  moderate_risk_count: number;
  low_risk_count: number;
  excess_stock_count: number;
}

export interface SupplierRiskBreakdown {
  on_time_risk: number;
  delay_risk: number;
  defect_risk: number;
  financial_risk: number;
  dependency_risk: number;
  total_risk_score: number;
  risk_band: 'Low' | 'Moderate' | 'High' | 'Critical';
  weights_used: Record<string, number>;
}

export interface SupplierItem {
  supplier_id: string;
  supplier_name: string;
  country: string;
  category: string;
  standard_lead_time_days: number;
  quoted_unit_cost: number;
  historical_on_time_rate_pct: number;
  historical_defect_rate_pct: number;
  capacity_units_per_day: number;
  minimum_order_quantity: number;
  financial_risk_score: number;
  sustainability_score: number;
  calculated_on_time_rate_pct?: number | null;
  data_sufficiency: string;
  average_actual_lead_time_days?: number | null;
  average_delay_days?: number | null;
  total_completed_orders: number;
  late_completed_orders: number;
  open_orders_count: number;
  open_delayed_orders_count: number;
  products_supplied_count: number;
  tied_inventory_value: number;
  inventory_value_share_pct: number;
  single_source_product_count: number;
  risk_breakdown: SupplierRiskBreakdown;
  risk_score: number;
  risk_band: 'Low' | 'Moderate' | 'High' | 'Critical';
  actionable_recommendations: string[];
}

export interface OverviewKpis {
  total_active_products: number;
  total_inventory_units: number;
  total_inventory_value: number;
  critical_or_high_risk_products: number;
  average_supplier_on_time_rate_pct: number;
  open_delayed_purchase_orders: number;
  estimated_inventory_exposure_value: number;
}

export interface CategoryBreakdown {
  category: string;
  total_products: number;
  total_value: number;
  critical_products: number;
}

export interface RiskDistribution {
  risk_level: string;
  count: number;
  percentage: number;
  total_value: number;
}

export interface OverviewAlert {
  id: string;
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  description: string;
  target_page: string;
  target_id?: string;
}

export interface OverviewResponse {
  kpis: OverviewKpis;
  risk_distribution: RiskDistribution[];
  category_breakdown: CategoryBreakdown[];
  alerts: OverviewAlert[];
  executive_summary: string;
  last_updated: string;
}

export interface DailyTrajectoryPoint {
  day: number;
  date: string;
  baseline_stock: number;
  scenario_stock: number;
  unmet_demand_units: number;
  cumulative_unmet_units: number;
}

export interface SimulationRequest {
  supplier_id?: string;
  product_id?: string;
  disruption_duration_days?: number;
  demand_multiplier?: number;
  stock_reduction_pct?: number;
  allow_open_po_arrivals?: boolean;
  scenario_name?: string;
}

export interface ProductSimulationResult {
  product_id: string;
  product_name: string;
  supplier_id: string;
  initial_stock: number;
  scenario_daily_demand: number;
  days_until_stockout?: number | null;
  total_unmet_units: number;
  unmet_demand_value: number;
  stocks_out_during_scenario: boolean;
  trajectory: DailyTrajectoryPoint[];
}

export interface SimulationResponse {
  scenario_name: string;
  disruption_duration_days: number;
  demand_multiplier: number;
  stock_reduction_pct: number;
  allow_open_po_arrivals: boolean;
  total_products_affected: number;
  products_stocking_out_count: number;
  total_unmet_units: number;
  total_unmet_value: number;
  product_results: ProductSimulationResult[];
  aggregated_trajectory: DailyTrajectoryPoint[];
  key_drivers_summary: string;
}

export interface MitigationStrategyOption {
  strategy_key: string;
  strategy_name: string;
  description: string;
  is_feasible: boolean;
  feasibility_notes: string;
  incremental_cost: number;
  units_covered: number;
  remaining_shortage_units: number;
  replenishment_time_days: number;
  cost_per_unit_protected: number;
  service_impact_score: number;
  risk_level: string;
  key_assumptions: string[];
}

export interface MitigationRequest {
  product_id: string;
  shortage_units?: number;
  disruption_duration_days?: number;
  custom_expedite_premium_pct?: number;
  custom_alternative_supplier_id?: string;
  max_budget?: number;
}

export interface MitigationComparisonResponse {
  product_id: string;
  product_name: string;
  unit_value: number;
  current_stock: number;
  projected_shortage_units: number;
  shortage_value_at_risk: number;
  options: MitigationStrategyOption[];
  recommended_strategy_key: string;
  recommendation_rationale: string;
  budget_constraint_met: boolean;
}

export interface DatasetMetadata {
  dataset_name: string;
  filename: string;
  record_count: number;
  column_count: number;
  columns: string[];
  missing_values_count: number;
  sample_records: Record<string, any>[];
}

export interface DataQualityCheck {
  check_name: string;
  dataset: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  details: string;
}

export interface DataExplorerResponse {
  datasets: DatasetMetadata[];
  quality_checks: DataQualityCheck[];
  data_quality_score: number;
}
