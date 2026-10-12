from typing import List, Dict, Any, Optional
import pandas as pd
from backend.app.data_loader import get_data_loader
from backend.app.schemas import (
    MitigationRequest,
    MitigationStrategyOption,
    MitigationComparisonResponse
)

class MitigationService:
    @staticmethod
    def compare_strategies(req: MitigationRequest) -> MitigationComparisonResponse:
        loader = get_data_loader()
        inv_df = loader.inventory_df
        sup_df = loader.suppliers_df
        opts_df = loader.supplier_options_df

        prod_matches = inv_df[inv_df["product_id"] == req.product_id]
        if prod_matches.empty:
            raise ValueError(f"Product {req.product_id} not found in inventory dataset.")

        prod = prod_matches.iloc[0]
        p_id = prod["product_id"]
        p_name = prod["product_name"]
        unit_val = float(prod["unit_value"])
        current_stock = int(prod["current_stock_units"])
        daily_demand = float(prod["average_daily_demand_units"])
        primary_sup_id = prod["supplier_id"]

        # Primary supplier info
        sup_matches = sup_df[sup_df["supplier_id"] == primary_sup_id]
        primary_lead_time = int(sup_matches.iloc[0]["standard_lead_time_days"]) if not sup_matches.empty else 14
        primary_unit_cost = float(sup_matches.iloc[0]["quoted_unit_cost"]) if not sup_matches.empty else unit_val * 0.5

        # Shortage units to mitigate: use requested shortage, or calculate lead-time shortfall
        if req.shortage_units is not None and req.shortage_units > 0:
            target_shortage = float(req.shortage_units)
        else:
            lead_time_demand = daily_demand * primary_lead_time
            target_shortage = max(10.0, round(lead_time_demand - current_stock, 1))

        shortage_val = round(target_shortage * unit_val, 2)

        # Options for this product from supplier_product_options.csv
        p_opts = opts_df[opts_df["product_id"] == p_id]
        alt_opts = p_opts[p_opts["supplier_id"] != primary_sup_id]

        options: List[MitigationStrategyOption] = []

        # -------------------------------------------------------------
        # 1. Strategy: Wait for Normal Replenishment
        # -------------------------------------------------------------
        options.append(MitigationStrategyOption(
            strategy_key="WAIT_NORMAL",
            strategy_name="Wait for Normal Replenishment",
            description="Take no expedited action; await scheduled delivery via standard procurement channels.",
            is_feasible=True,
            feasibility_notes="Always operationally available, but leaves high customer stockout risk unresolved.",
            incremental_cost=0.0,
            units_covered=0.0,
            remaining_shortage_units=target_shortage,
            replenishment_time_days=primary_lead_time,
            cost_per_unit_protected=0.0,
            service_impact_score=25.0,  # Low service level
            risk_level="High",
            key_assumptions=[
                "Zero additional procurement spend required",
                f"Full shortfall of {target_shortage} units remains unmitigated for {primary_lead_time} days",
                "Assumes primary supplier meets standard lead-time commitment without further slippage"
            ]
        ))

        # -------------------------------------------------------------
        # 2. Strategy: Expedite Existing Order
        # -------------------------------------------------------------
        # Expedited lead time is typically half standard lead time
        expedite_lead_time = max(2, int(primary_lead_time * 0.5))
        # Premium: default £8.00/unit or custom
        premium_per_unit = req.custom_expedite_premium_pct if req.custom_expedite_premium_pct is not None else 8.50
        expedite_cost = round(target_shortage * premium_per_unit, 2)
        
        # Days saved = primary_lead_time - expedite_lead_time
        days_saved = primary_lead_time - expedite_lead_time
        units_protected_by_expedite = min(target_shortage, round(days_saved * daily_demand, 1))
        remaining_expedite_shortage = max(0.0, round(target_shortage - units_protected_by_expedite, 1))
        cost_per_unit_expedite = round(expedite_cost / max(1.0, units_protected_by_expedite), 2)

        options.append(MitigationStrategyOption(
            strategy_key="EXPEDITE_PO",
            strategy_name="Expedite Existing Supplier Order",
            description=f"Upgrade open PO to express freight, compressing lead time from {primary_lead_time}d to {expedite_lead_time}d.",
            is_feasible=True,
            feasibility_notes=f"Feasible assuming carrier express capacity is available on short notice.",
            incremental_cost=expedite_cost,
            units_covered=units_protected_by_expedite,
            remaining_shortage_units=remaining_expedite_shortage,
            replenishment_time_days=expedite_lead_time,
            cost_per_unit_protected=cost_per_unit_expedite,
            service_impact_score=78.0,
            risk_level="Moderate",
            key_assumptions=[
                f"Express air/priority freight premium of £{premium_per_unit:.2f} per unit",
                f"Reduces delivery wait time by {days_saved} days",
                f"Covers {units_protected_by_expedite} urgent units before stock depletion"
            ]
        ))

        # -------------------------------------------------------------
        # 3. Strategy: Alternative Supplier Sourcing
        # -------------------------------------------------------------
        if not alt_opts.empty:
            alt_row = alt_opts.iloc[0]
            alt_sup_id = alt_row["supplier_id"]
            alt_sup_matches = sup_df[sup_df["supplier_id"] == alt_sup_id]
            alt_name = alt_sup_matches.iloc[0]["supplier_name"] if not alt_sup_matches.empty else alt_sup_id
            alt_lead_time = int(alt_row["lead_time_days"])
            alt_unit_cost = float(alt_row["unit_cost"])
            alt_switching_cost = float(alt_row["switching_cost"])

            unit_cost_delta = max(0.0, alt_unit_cost - primary_unit_cost)
            incremental_alt_cost = round(alt_switching_cost + (target_shortage * unit_cost_delta), 2)
            
            # Alternative supplier delivery covers the full remaining demand after alt lead time
            alt_covered = target_shortage
            alt_cost_per_unit = round(incremental_alt_cost / max(1.0, alt_covered), 2)

            options.append(MitigationStrategyOption(
                strategy_key="ALT_SUPPLIER",
                strategy_name=f"Source via Alternative Supplier ({alt_name})",
                description=f"Issue purchase contract to pre-qualified alternative partner ({alt_name}) with {alt_lead_time}d lead time.",
                is_feasible=True,
                feasibility_notes=f"Supplier is pre-qualified. Lead time is {alt_lead_time} days.",
                incremental_cost=incremental_alt_cost,
                units_covered=alt_covered,
                remaining_shortage_units=0.0,
                replenishment_time_days=alt_lead_time,
                cost_per_unit_protected=alt_cost_per_unit,
                service_impact_score=92.0,
                risk_level="Low" if alt_lead_time <= primary_lead_time else "Moderate",
                key_assumptions=[
                    f"One-off onboarding/tooling switching cost: £{alt_switching_cost:,.2f}",
                    f"Unit cost difference: £{unit_cost_delta:.2f}/unit compared to primary contract",
                    f"Alternative vendor has available daily capacity to fulfil {int(target_shortage)} units"
                ]
            ))
        else:
            # Infeasible option
            options.append(MitigationStrategyOption(
                strategy_key="ALT_SUPPLIER",
                strategy_name="Source via Alternative Supplier",
                description="Purchase from secondary supplier.",
                is_feasible=False,
                feasibility_notes="No qualified alternative supplier identified in catalog for this SKU.",
                incremental_cost=0.0,
                units_covered=0.0,
                remaining_shortage_units=target_shortage,
                replenishment_time_days=99,
                cost_per_unit_protected=0.0,
                service_impact_score=0.0,
                risk_level="Critical",
                key_assumptions=["Single-sourced component; dual-sourcing agreement not established."]
            ))

        # -------------------------------------------------------------
        # 4. Strategy: Internal Stock Buffer Transfer
        # -------------------------------------------------------------
        # Can transfer regional stock or draw down safety buffer: fast (2 days), handling cost £2.00/unit
        buffer_transfer_units = min(target_shortage, round(current_stock * 0.4 + 50.0, 1))
        transfer_cost = round(buffer_transfer_units * 2.20, 2)
        remaining_transfer_shortage = max(0.0, round(target_shortage - buffer_transfer_units, 1))
        cost_per_unit_transfer = round(transfer_cost / max(1.0, buffer_transfer_units), 2)

        options.append(MitigationStrategyOption(
            strategy_key="INTERNAL_TRANSFER",
            strategy_name="Inter-Depot Stock Transfer / Buffer Allocation",
            description="Reallocate regional reserve inventory or safety buffer from sister distribution hub (2-day transfer).",
            is_feasible=buffer_transfer_units > 0,
            feasibility_notes=f"Covers {buffer_transfer_units} units from regional depot buffer.",
            incremental_cost=transfer_cost,
            units_covered=buffer_transfer_units,
            remaining_shortage_units=remaining_transfer_shortage,
            replenishment_time_days=2,
            cost_per_unit_protected=cost_per_unit_transfer,
            service_impact_score=85.0 if remaining_transfer_shortage == 0 else 65.0,
            risk_level="Low",
            key_assumptions=[
                "Intra-network logistics transit time: 48 hours",
                "Internal handling & freight transfer fee: £2.20 per unit",
                f"Max available uncommitted buffer across other facilities is {buffer_transfer_units} units"
            ]
        ))

        # -------------------------------------------------------------
        # 5. Strategy: Hybrid Dual-Response
        # -------------------------------------------------------------
        # Combine transfer (immediate) + expedite remaining
        hybrid_transfer = buffer_transfer_units
        hybrid_expedite_units = max(0.0, target_shortage - hybrid_transfer)
        hybrid_cost = round((hybrid_transfer * 2.20) + (hybrid_expedite_units * premium_per_unit), 2)
        hybrid_cost_per_unit = round(hybrid_cost / max(1.0, target_shortage), 2)

        options.append(MitigationStrategyOption(
            strategy_key="HYBRID_SPLIT",
            strategy_name="Hybrid Dual-Response (Transfer + Express Expedite)",
            description=f"Deploy {hybrid_transfer} units immediately via inter-depot transfer, and express-expedite remaining {hybrid_expedite_units} units.",
            is_feasible=True,
            feasibility_notes="Blended mitigation balancing immediate stock coverage and cost control.",
            incremental_cost=hybrid_cost,
            units_covered=target_shortage,
            remaining_shortage_units=0.0,
            replenishment_time_days=expedite_lead_time,
            cost_per_unit_protected=hybrid_cost_per_unit,
            service_impact_score=95.0,
            risk_level="Low",
            key_assumptions=[
                f"Phase 1: Transfer {hybrid_transfer} units within 48h to prevent immediate line-stop",
                f"Phase 2: Expedite balance of {hybrid_expedite_units} units via primary vendor",
                "Eliminates 100% of projected stockout exposure with minimal delay"
            ]
        ))

        # Budget check & Recommendation selection
        budget_met = True
        if req.max_budget is not None and req.max_budget > 0:
            for opt in options:
                if opt.incremental_cost > req.max_budget:
                    opt.is_feasible = False
                    opt.feasibility_notes += f" Exceeds user budget constraint (£{req.max_budget:,.2f})."

        # Select recommended strategy:
        # Filter feasible options that cover demand with best balance of cost and service
        feasible_opts = [o for o in options if o.is_feasible and o.strategy_key != "WAIT_NORMAL"]
        
        if not feasible_opts:
            recommended_key = "WAIT_NORMAL"
            rationale = "No expedited or alternative mitigation strategy falls within current budget constraints. The business must wait for standard replenishment and notify downstream sales channels."
            budget_met = False
        else:
            # Sort by lowest remaining shortage, then by lowest incremental cost
            feasible_opts.sort(key=lambda x: (x.remaining_shortage_units, x.incremental_cost))
            best_opt = feasible_opts[0]
            recommended_key = best_opt.strategy_key
            rationale = (
                f"Recommended strategy is '{best_opt.strategy_name}' (Cost: £{best_opt.incremental_cost:,.2f}). "
                f"It achieves {best_opt.service_impact_score:.0f}% service protection, eliminating {best_opt.units_covered} units of shortage "
                f"at £{best_opt.cost_per_unit_protected:.2f}/unit protected."
            )

        return MitigationComparisonResponse(
            product_id=p_id,
            product_name=p_name,
            unit_value=unit_val,
            current_stock=current_stock,
            projected_shortage_units=target_shortage,
            shortage_value_at_risk=shortage_val,
            options=options,
            recommended_strategy_key=recommended_key,
            recommendation_rationale=rationale,
            budget_constraint_met=budget_met
        )
