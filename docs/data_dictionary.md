# SupplyShield AI — Data Dictionary

This document details the schema, data types, business definitions, and validation rules for all CSV datasets in SupplyShield AI.

---

## 1. `suppliers.csv`
Master registry of Northstar Retail's primary vendors.

| Column | Type | Example | Description | Range / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `supplier_id` | String | `SUP001` | Unique primary identifier for the supplier. | Format `SUP###`, unique, non-null. |
| `supplier_name` | String | `Apex Logistics & Components` | Registered legal business trading name. | Non-empty string. |
| `country` | String | `United Kingdom` | Geographic location of manufacturing or distribution hub. | Country name (e.g. UK, Germany, Sweden, Taiwan, Vietnam). |
| `category` | String | `Electronics & Hardware` | Primary supply industry / commodity segment. | Categorical (Electronics, Packaging, Home & Kitchen, etc.). |
| `standard_lead_time_days`| Integer | `7` | Contractual replenishment delivery latency in days. | `> 0`, typically 5 to 45 days. |
| `quoted_unit_cost` | Float | `42.50` | Contractual benchmark baseline unit cost in GBP (£). | `> 0.0`. |
| `historical_on_time_rate_pct`| Float | `94.2` | Vendor self-reported historical on-time delivery percentage. | `0.0` to `100.0%`. |
| `historical_defect_rate_pct` | Float | `0.8` | Contractual baseline quality defect rate percentage. | `0.0` to `10.0%`. |
| `capacity_units_per_day` | Integer | `2500` | Supplier maximum daily manufacturing/shipping throughput. | `> 0`. |
| `minimum_order_quantity` | Integer | `100` | Minimum purchase order batch size (MOQ). | `> 0`. |
| `financial_risk_score` | Float | `18.0` | Credit assessment risk score (0 = lowest risk, 100 = extreme risk). | `0.0` to `100.0`. |
| `sustainability_score` | Float | `85.0` | Environmental, Social, and Governance (ESG) index score. | `0.0` to `100.0`. |

---

## 2. `inventory.csv`
Retail inventory catalog, current distribution hub stock, and demand parameters.

| Column | Type | Example | Description | Range / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | String | `SKU-ELC-001` | Unique Stock Keeping Unit (SKU) identifier. | Format `SKU-###-###`, unique, non-null. |
| `product_name` | String | `Wireless IoT Sensor Hub` | Commercial consumer/retail catalog title. | Non-empty string. |
| `category` | String | `Electronics & Hardware` | Retail merchandising department category. | Matches catalog categories. |
| `supplier_id` | String | `SUP001` | Foreign key referencing primary contracted supplier. | Must exist in `suppliers.csv`. |
| `current_stock_units` | Integer | `450` | Physical on-hand inventory across distribution centers. | `\ge 0`. |
| `average_daily_demand_units`| Float | `45.0` | 90-day mean daily sales velocity (units/day). | `> 0.0`. |
| `demand_std_dev_units` | Float | `8.5` | Standard deviation of daily sales velocity. | `\ge 0.0`. |
| `reorder_point_units` | Integer | `400` | Inventory threshold that triggers replenishment PO. | `\ge 0`. |
| `safety_stock_units` | Integer | `85` | Dedicated safety buffer maintained against demand surges. | `\ge 0`. |
| `unit_value` | Float | `75.00` | Valuation price per unit in GBP (£). | `> 0.0`. |
| `target_service_level_pct` | Float | `95.0` | Target order fill-rate percentage. | `80.0` to `99.9%`. |
| `criticality` | String | `High` | Commercial importance (Critical, High, Medium, Low). | Categorical. |

---

## 3. `purchase_orders.csv`
Order execution history used to calculate actual vendor delivery reliability and delays.

| Column | Type | Example | Description | Range / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `purchase_order_id` | String | `PO-2026-1001` | Unique purchase order tracking number. | Unique primary key. |
| `supplier_id` | String | `SUP001` | Foreign key referencing fulfilling supplier. | Must exist in `suppliers.csv`. |
| `product_id` | String | `SKU-ELC-001` | Foreign key referencing ordered product SKU. | Must exist in `inventory.csv`. |
| `order_date` | Date | `2026-08-15` | Date the purchase order was formally placed. | Format `YYYY-MM-DD`. |
| `expected_delivery_date` | Date | `2026-08-22` | Contractual delivery commitment date. | Format `YYYY-MM-DD`. |
| `actual_delivery_date` | Date | `2026-08-22` | Date goods arrived at distribution center (null if open). | Format `YYYY-MM-DD` or empty. |
| `quantity_ordered` | Integer | `500` | Total units requisitioned. | `\ge \text{MOQ}`. |
| `quantity_received` | Integer | `500` | Total units inspected and received into inventory. | `\ge 0`. |
| `unit_cost` | Float | `42.50` | Contract price per unit in GBP (£). | `> 0.0`. |
| `status` | String | `COMPLETED` | Order state (`COMPLETED`, `OPEN`, `DELAYED`). | Categorical. |

---

## 4. `demand_history.csv`
Daily retail sales timeseries and forecast benchmark observations for past 90 days.

| Column | Type | Example | Description | Range / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `date` | Date | `2026-07-03` | Calendar observation date. | Format `YYYY-MM-DD`. |
| `product_id` | String | `SKU-ELC-001` | Foreign key referencing product catalog. | Must exist in `inventory.csv`. |
| `units_sold` | Float | `48.2` | Actual units sold/consumed on observation date. | `\ge 0.0`. |
| `demand_forecast_units` | Float | `46.0` | Pre-season model projected demand forecast. | `\ge 0.0`. |

---

## 5. `supplier_product_options.csv`
Sourcing feasibility matrix and switching cost parameters for mitigation planning.

| Column | Type | Example | Description | Range / Validation |
| :--- | :--- | :--- | :--- | :--- |
| `product_id` | String | `SKU-ELC-002` | Foreign key referencing product catalog. | Must exist in `inventory.csv`. |
| `supplier_id` | String | `SUP004` | Foreign key referencing alternative vendor. | Must exist in `suppliers.csv`. |
| `is_primary` | Boolean | `False` | Whether this vendor is the primary contractual supplier. | Boolean (`True` / `False`). |
| `lead_time_days` | Integer | `12` | Standard delivery lead time under secondary contract. | `> 0`. |
| `expedited_lead_time_days` | Integer | `6` | Compressed lead time under priority express freight. | `> 0`. |
| `unit_cost` | Float | `38.00` | Unit price under secondary agreement in GBP (£). | `> 0.0`. |
| `expedited_freight_premium_per_unit` | Float | `12.00` | Surcharge per unit for express expedited transport. | `\ge 0.0`. |
| `switching_cost` | Float | `1500.00` | One-time qualification/tooling switching expense (£). | `\ge 0.0`. |
| `status` | String | `Qualified Alternative` | Sourcing readiness status. | Categorical. |
