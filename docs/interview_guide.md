# SupplyShield AI — MBA Graduate Interview Preparation Guide

This guide is specifically tailored for a Global MBA graduate from the University of Greenwich interviewing for roles in **Supply Chain Analysis, Operations Intelligence, Procurement, Business Analysis, and Management Consulting** in the United Kingdom.

---

## 1. The 60-Second Elevator Pitch

> *"During my Global MBA studies, I recognized that many mid-market retailers face severe operational blindness during supply disruptions. They hold weeks of excess inventory on slow-moving products while suffering line-stopping stockouts on high-demand items, and when an overseas supplier misses a delivery, managers struggle to rapidly evaluate mitigation trade-offs.*
>
> *To address this, I built **SupplyShield AI**—an interactive supply chain risk intelligence and decision support platform modeled on Northstar Retail, a fictional UK retail distributor. The system ingests flat operational datasets (inventory records, purchase order history, 90-day demand timeseries, and supplier options), calculates lead-time coverage and multi-factor vendor risk scores, simulates day-by-day disruption trajectories under demand surges, and compares practical mitigation strategies—such as express freight vs alternative vendor qualification vs regional buffer transfers.*
>
> *It demonstrates how structured data, transparent mathematical modeling, and interactive visualization empower operational managers to make defensible, cost-effective procurement decisions."*

---

## 2. Key Questions & Strategic Answers

### Q1: "What business problem does Northstar Retail face, and how does your tool solve it?"
* **Answer:**
  * **The Problem:** Northstar Retail experienced uneven supplier reliability (overseas suppliers in Taiwan and Vietnam with 35–42 day lead times and sub-75% on-time delivery), leading to £38k+ in stockout shortfall exposure on critical lines, while simultaneously tying up working capital in excess packaging and slow-moving housewares (>75 days cover).
  * **The Solution:** SupplyShield AI provides an operational control tower that separates business intuition from guesswork. It flags SKUs where Days of Cover are shorter than replenishment lead times, scores vendors using actual historical PO delivery variance rather than self-reported claims, and provides an interactive simulation sandbox to model disruption severity before executing costly mitigation spend.

---

### Q2: "Walk me through how you calculated Days of Cover and Stockout Shortfall Exposure."
* **Answer:**
  * **Days of Cover (DOC):** $\frac{\text{Current Stock Units}}{\text{Average Daily Demand Units}}$. If daily demand is zero, we explicitly flag the result as non-applicable rather than dividing by zero.
  * **Lead-Time Demand (LTD):** $\text{Average Daily Demand} \times \text{Supplier Lead Time (Days)}$. This represents the units consumed while waiting for a reorder to physically arrive at the warehouse.
  * **Potential Lead-Time Shortfall:** $\max(0, \text{LTD} - \text{Current Stock})$. If current stock is 280 units and LTD is 1,750 units, the shortfall is 1,470 units.
  * **Shortfall Exposure Value (£):** $\text{Shortfall Units} \times \text{Unit Valuation}$. I explicitly label this as an *indicative exposure metric* rather than a guaranteed financial loss, because customer backorders or product substitution might recapture part of that demand.

---

### Q3: "How is the 0–100 Supplier Risk Score constructed? Isn't a composite score arbitrary?"
* **Answer:**
  * *"A composite score can be misleading if components move in opposite directions or lack clear weights. In SupplyShield AI, I established three strict design principles:*
    1. **Strict Directionality:** All metrics are normalized so that *higher scores always equal higher operational risk*. For example, delivery reliability is inverted as $(100 - \text{OTD Rate \%})$.
    2. **Documented Normalized Weights (Summing to 100%):**
       * Delivery Reliability Risk: 35% (calculated from actual PO receipts)
       * Delay Severity Risk: 20% (average days late scaled against an 8-day benchmark)
       * Quality Defect Rate: 15% (scaled against a 4.0% rejection benchmark)
       * Financial Vulnerability: 15% (creditworthiness and balance sheet stability)
       * Concentration Risk: 15% (share of total retail inventory value tied to this single vendor)
    3. **Data Sufficiency Indicators:** If a supplier has fewer than 3 completed purchase orders, the model flags 'Insufficient History' rather than fabricating a false on-time percentage."*

---

### Q4: "How does the Disruption Simulator work mathematically? Did you just multiply days by demand?"
* **Answer:**
  * *"No, simple multiplication fails to capture non-linear stock depletion dynamics and creates negative inventory anomalies. Instead, I implemented a **discrete day-by-day inventory balance model**:*
  * *For each day $t$ across the scenario duration:*
    $$\text{Stock}_t = \max(0, \text{Stock}_{t-1} + \text{Inbound Arrivals}_t - \text{Scenario Demand}_t)$$
    $$\text{Unmet Demand}_t = \max(0, \text{Scenario Demand}_t - (\text{Stock}_{t-1} + \text{Inbound Arrivals}_t))$$
  * *This enforces three critical realities:*
    1. Inventory on hand cannot drop below zero.
    2. Unmet demand is tracked distinctly and cumulative shortfall does not distort stock balances.
    3. Purchase orders from the disrupted supplier are frozen during the outage, while orders from unaffected suppliers can still arrive if toggled."*

---

### Q5: "How does the Mitigation Decision Planner recommend an action?"
* **Answer:**
  * *"The mitigation engine compares 5 distinct operational strategies: waiting, express air freight expediting, alternative supplier onboarding, regional depot buffer transfers, and a hybrid split response.*
  * *Rather than always picking the cheapest option (which might be waiting) or the fastest option (which might blow the budget), the engine computes:*
    * **Feasibility:** Checks catalog pre-qualification and validates whether incremental costs satisfy the user's budget constraint.
    * **Cost per Unit Protected (£/unit):** $\frac{\text{Incremental Cost}}{\text{Units Protected}}$.
    * **Service Impact Protection Score:** Percentage of projected stockout eliminated.
  * *The engine then generates an explainable recommendation statement that lays out the exact speed, cost, and availability trade-offs."*

---

### Q6: "Why did you use CSV flat files instead of SQL or PostgreSQL?"
* **Answer:**
  * *"First, in UK mid-market supply chain operations, ERP exports (from SAP, NetSuite, or Dynamics) are almost universally shared and analyzed as CSV extracts by procurement teams.*
  * *Second, storing authoritative CSVs in the repository ensures the project is 100% reproducible on any interviewer's laptop in under two minutes without setting up Docker containers, database servers, or cloud credentials.*
  * *Third, it allowed me to demonstrate data quality engineering: building an automated schema auditor in `data_quality_service.py` that checks primary key uniqueness, foreign key referential integrity, and null rates across datasets."*

---

### Q7: "What are the limitations of this project, and how would you enhance it with enterprise access?"
* **Answer:**
  * **Limitations:**
    * The operational dataset is synthetic and calibrated for demonstrative analysis.
    * Demand is modeled with normal Gaussian variation rather than complex seasonal or promo-driven econometric distributions.
    * Lead times are treated as discrete expected days rather than stochastic Weibull or Gamma probability distributions.
  * **Enterprise Enhancements:**
    * Live ERP API connectors (SAP OData / NetSuite RESTlets).
    * Stochastic Monte Carlo simulation across correlated multi-echelon port congestion scenarios.
    * Integration with external live freight index feeds (Freightos Baltic Index) and automated purchase requisition workflows.
