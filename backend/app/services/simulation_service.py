from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
from backend.app.config import SCENARIO_CUTOFF_DATE
from backend.app.data_loader import get_data_loader
from backend.app.schemas import (
    SimulationRequest,
    SimulationResponse,
    ProductSimulationResult,
    DailyTrajectoryPoint
)

class SimulationService:
    @staticmethod
    def run_simulation(req: SimulationRequest) -> SimulationResponse:
        loader = get_data_loader()
        inv_df = loader.inventory_df.copy()
        sup_df = loader.suppliers_df.copy()
        po_df = loader.purchase_orders_df.copy()

        # Scope filter
        if req.product_id:
            target_products = inv_df[inv_df["product_id"] == req.product_id]
        elif req.supplier_id and req.supplier_id.upper() != "ALL":
            target_products = inv_df[inv_df["supplier_id"] == req.supplier_id]
        else:
            # Default: if none specified, simulate all products
            target_products = inv_df

        if target_products.empty:
            raise ValueError(f"No products found for the given criteria (Supplier: {req.supplier_id}, Product: {req.product_id})")

        cutoff_dt = datetime.strptime(SCENARIO_CUTOFF_DATE, "%Y-%m-%d")
        duration = req.disruption_duration_days
        demand_mult = req.demand_multiplier
        stock_reduction = req.stock_reduction_pct / 100.0

        product_results: List[ProductSimulationResult] = []
        
        # Aggregated daily tracking
        agg_baseline = [0.0] * duration
        agg_scenario = [0.0] * duration
        agg_unmet = [0.0] * duration
        agg_dates = []

        for d in range(duration):
            cur_d = cutoff_dt + timedelta(days=d + 1)
            agg_dates.append(cur_d.strftime("%Y-%m-%d"))

        total_unmet_units_all = 0.0
        total_unmet_value_all = 0.0
        stockout_count = 0

        for _, prod_row in target_products.iterrows():
            p_id = prod_row["product_id"]
            p_name = prod_row["product_name"]
            s_id = prod_row["supplier_id"]
            base_demand = float(prod_row["average_daily_demand_units"])
            scenario_demand = round(base_demand * demand_mult, 1)
            unit_val = float(prod_row["unit_value"])
            initial_stock_full = float(prod_row["current_stock_units"])
            scenario_initial_stock = round(initial_stock_full * (1.0 - stock_reduction), 1)

            # Open PO arrivals if enabled and NOT from disrupted supplier
            # (Disruption assumes supplier cannot deliver during disruption)
            open_pos = po_df[(po_df["product_id"] == p_id) & (po_df["status"].isin(["OPEN", "DELAYED"]))]
            
            product_trajectory: List[DailyTrajectoryPoint] = []
            curr_scenario_stock = scenario_initial_stock
            curr_base_stock = initial_stock_full
            cum_unmet = 0.0
            stockout_day = None

            for day_idx in range(duration):
                cur_dt = cutoff_dt + timedelta(days=day_idx + 1)
                date_str = agg_dates[day_idx]

                # Arrivals check
                arrivals = 0.0
                if req.allow_open_po_arrivals:
                    # Only arrive if supplier is NOT the disrupted supplier
                    if not (req.supplier_id and s_id == req.supplier_id):
                        matching_pos = open_pos[open_pos["expected_delivery_date"] == date_str]
                        arrivals = float(matching_pos["quantity_ordered"].sum())

                # Baseline balance (standard demand, no disruption)
                curr_base_stock = max(0.0, curr_base_stock - base_demand)

                # Scenario balance
                curr_scenario_stock = curr_scenario_stock + arrivals
                if curr_scenario_stock >= scenario_demand:
                    served = scenario_demand
                    unmet = 0.0
                    curr_scenario_stock = round(curr_scenario_stock - scenario_demand, 1)
                else:
                    served = curr_scenario_stock
                    unmet = round(scenario_demand - curr_scenario_stock, 1)
                    curr_scenario_stock = 0.0
                    if stockout_day is None:
                        stockout_day = day_idx + 1

                cum_unmet = round(cum_unmet + unmet, 1)

                point = DailyTrajectoryPoint(
                    day=day_idx + 1,
                    date=date_str,
                    baseline_stock=round(curr_base_stock, 1),
                    scenario_stock=round(curr_scenario_stock, 1),
                    unmet_demand_units=unmet,
                    cumulative_unmet_units=cum_unmet
                )
                product_trajectory.append(point)

                # Aggregate
                agg_baseline[day_idx] += curr_base_stock
                agg_scenario[day_idx] += curr_scenario_stock
                agg_unmet[day_idx] += unmet

            total_p_unmet = cum_unmet
            unmet_val = round(total_p_unmet * unit_val, 2)
            total_unmet_units_all += total_p_unmet
            total_unmet_value_all += unmet_val

            stocks_out = stockout_day is not None
            if stocks_out:
                stockout_count += 1

            product_results.append(ProductSimulationResult(
                product_id=p_id,
                product_name=p_name,
                supplier_id=s_id,
                initial_stock=scenario_initial_stock,
                scenario_daily_demand=scenario_demand,
                days_until_stockout=stockout_day,
                total_unmet_units=total_p_unmet,
                unmet_demand_value=unmet_val,
                stocks_out_during_scenario=stocks_out,
                trajectory=product_trajectory
            ))

        # Build aggregated trajectory
        aggregated_points: List[DailyTrajectoryPoint] = []
        running_agg_unmet = 0.0
        for d_idx in range(duration):
            running_agg_unmet += agg_unmet[d_idx]
            aggregated_points.append(DailyTrajectoryPoint(
                day=d_idx + 1,
                date=agg_dates[d_idx],
                baseline_stock=round(agg_baseline[d_idx], 1),
                scenario_stock=round(agg_scenario[d_idx], 1),
                unmet_demand_units=round(agg_unmet[d_idx], 1),
                cumulative_unmet_units=round(running_agg_unmet, 1)
            ))

        # Sort product results by unmet value descending
        product_results.sort(key=lambda x: x.unmet_demand_value, reverse=True)

        # Build summary
        key_drivers = (
            f"Under this {duration}-day scenario with {int((demand_mult-1)*100)}% demand surge, "
            f"{stockout_count} of {len(product_results)} affected products encounter stockouts, "
            f"generating {int(total_unmet_units_all):,} unmet demand units (£{total_unmet_value_all:,.2f} indicative exposure). "
            + (f"Top exposure product is {product_results[0].product_name} (£{product_results[0].unmet_demand_value:,.2f})." if product_results else "")
        )

        return SimulationResponse(
            scenario_name=req.scenario_name or "Custom Simulation Scenario",
            disruption_duration_days=duration,
            demand_multiplier=demand_mult,
            stock_reduction_pct=req.stock_reduction_pct,
            allow_open_po_arrivals=req.allow_open_po_arrivals,
            total_products_affected=len(product_results),
            products_stocking_out_count=stockout_count,
            total_unmet_units=round(total_unmet_units_all, 1),
            total_unmet_value=round(total_unmet_value_all, 2),
            product_results=product_results,
            aggregated_trajectory=aggregated_points,
            key_drivers_summary=key_drivers
        )
