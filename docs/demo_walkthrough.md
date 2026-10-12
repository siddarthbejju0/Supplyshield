# SupplyShield AI — Interactive Demo Walkthrough

Follow this scripted 5-minute walkthrough to showcase SupplyShield AI during interviews or demonstrations.

---

## Step 1: Executive Risk Overview (1 Minute)

1. **Launch the application** and land on the **Overview** page.
2. Point out the **Executive Operations Brief** at the top:
   > *"Northstar Retail currently manages 24 active product lines across 10 global suppliers, with total inventory valuation of £182,410. 5 products are in Critical or High vulnerability tiers, driving £38,420 in lead-time stockout exposure..."*
3. Highlight the 7 core KPI cards:
   * **Active SKUs:** 24
   * **Total Inventory Value:** £182,410 across distribution hubs
   * **At-Risk Products:** 5 SKUs (Critical or High)
   * **Lead-Time Shortfall Exposure:** £38,420
   * **Supplier OTD Rate:** Calculated historical average across completed purchase orders
   * **Overdue Purchase Orders:** 4 delayed orders
4. Review the charts:
   * **Inventory Risk Distribution (Donut):** Demonstrating the portfolio split.
   * **Inventory Holding Value by Category (Horizontal Bar):** Capital concentration.
   * **Quoted vs Actual Lead-Time Bar Chart:** Highlighting latency slippage on overseas vendors.
5. In the **Operational Vulnerability Alerts** panel on the right, click the top alert:
   * **"Stockout Imminent: Ultra-Fast USB-C Controller (SKU-ELC-002)"**.
   * Notice that clicking automatically navigates to the **Inventory Intelligence** page and opens the detail modal for that specific SKU!

---

## Step 2: Inventory Intelligence & SKU Drilldown (1 Minute)

1. Review the **Product Detail Modal** for `SKU-ELC-002`:
   * **Days of Cover:** 5.6 days cover (280 stock ÷ 50 units/day demand).
   * **Replenishment Lead Time:** 35 days (FarEast Precision Micro Ltd in Taiwan).
   * **Vulnerability:** Stock coverage (5.6d) is dramatically below replenishment lead time (35d).
   * **Lead-Time Demand:** $50 \times 35 = 1,750$ units.
   * **Shortfall Units:** $1,750 - 280 = 1,470$ units.
   * **Exposure Value:** $1,470 \times £35.00 = £51,450$.
   * **90-Day Demand Chart:** Show the actual historical sales vs model forecast.
2. Close the modal, test the table **Search** (`"tape"` or `"sensor"`), filter by **Category**, and test the **Export CSV** button to show instant client-side data export.
3. Click **"Inspect"** on `SKU-ELC-002` again, and click the bottom action button:
   * **"Simulate Disruption on this SKU"**.

---

## Step 3: Disruption Scenario Simulator (1.5 Minutes)

1. The simulator loads with `SKU-ELC-002` and `SUP006` (FarEast Precision) pre-selected.
2. Scenario Settings:
   * Duration: **14 Days**
   * Demand Multiplier: **1.10x (+10% demand surge)**
   * Initial Stock Loss: **0%**
3. Review the **Outcome KPI Cards**:
   * Products Stocking Out: **1**
   * Unmet Customer Demand: **490 Units**
   * Financial Impact: **£17,150**
4. Inspect the **Trajectory Chart**:
   * Show how baseline inventory (blue) steadily declines.
   * Show how scenario stock (amber) hits zero on **Day 6**.
   * Show how cumulative unmet demand (red dashed line) escalates from Day 6 to Day 14.
5. Move the **Demand Multiplier Slider** from 1.1x up to **1.5x (+50% surge)** and click **"Run Simulation"**:
   * Watch the stockout day advance to **Day 4**, with unmet demand escalating to 770 units (£26,950).
6. Click the table action button on `SKU-ELC-002`:
   * **"Planner ->"** to seamlessly transition to the **Mitigation Planner**.

---

## Step 4: Mitigation Decision Planner (1 Minute)

1. Review the **Mitigation Strategies Table**:
   * **Strategy 1: Wait for Normal Replenishment** (£0 cost, but leaves 100% of shortage unaddressed for 35 days).
   * **Strategy 2: Expedite Existing Order** (Air freight premium £8.50/unit; saves 17 days).
   * **Strategy 3: Alternative Supplier Sourcing** (Activate Nordic Tech Solutions SUP004 in Sweden with 12-day lead time).
   * **Strategy 4: Inter-Depot Stock Transfer** (Reallocate 162 buffer units from regional sister warehouse in 48 hours for £2.20/unit).
   * **Strategy 5: Hybrid Dual-Response** (Transfer immediate buffer + expedite balance).
2. Point out the **Recommendation Banner**:
   * Explains why the engine recommends Strategy 3 (Alternative Sourcing) or Strategy 5 (Hybrid Split), balancing service impact score against incremental cost per unit protected.
3. Set a strict budget constraint: enter **£1,000** in the **Mitigation Budget** input and click **"Recalculate Strategies"**:
   * Observe how expensive full-scale options are flagged as **Infeasible (Budget Constraint)**, adapting the recommendation dynamically!

---

## Step 5: Data Quality Explorer & Methodology (30 Seconds)

1. Navigate to **Data Explorer**:
   * Review the **Data Quality Score: 100.0%**.
   * Highlight the 9 automated integrity checks (foreign key integrity, null checks, primary key uniqueness).
   * Switch between dataset tabs and click **"Download Raw CSV"**.
2. Navigate to **Methodology & Assumptions**:
   * Show the mathematical formulas, scoring weights table (summing to 100%), and academic provenance note.
