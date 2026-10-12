# SupplyShield AI — Business Analytics Methodology

## 1. Executive Summary & Objective

SupplyShield AI is an operational risk intelligence and decision-support platform designed for **Northstar Retail**, a fictional UK-based retail distributor.

In retail distribution, supply chain managers frequently encounter:
* Late or missing shipments from overseas vendors.
* Stockouts on high-velocity items while holding excess stock on slow movers.
* Difficulty evaluating the financial consequences of sudden vendor interruptions.
* Inability to rapidly compare mitigation options (e.g., paying for air freight vs onboarding a domestic secondary supplier vs reallocating regional safety buffers).

SupplyShield AI provides transparent analytics, explainable heuristics, interactive simulations, and decision comparisons without proprietary black-box models.

---

## 2. Core Mathematical Formulations

### 2.1 Inventory Days of Cover (DOC)
$$\text{Days of Cover} = \frac{\text{Current Stock Units}}{\text{Average Daily Demand Units}}$$
* **Interpretation:** Estimates the number of operating days on-hand inventory can satisfy run-rate demand assuming zero inbound receipts.
* **Edge Case Handling:** If daily demand is 0, DOC returns `None` and is presented as "Infinite / N/A" to prevent division-by-zero errors.

### 2.2 Expected Lead-Time Demand (LTD)
$$\text{Lead-Time Demand} = \text{Average Daily Demand} \times \text{Standard Supplier Lead Time (Days)}$$
* **Interpretation:** The expected consumption of product during the normal replenishment latency window.

### 2.3 Potential Lead-Time Shortfall & Exposure Value
$$\text{Shortfall Units} = \max(0, \text{Expected Lead-Time Demand} - \text{Available Stock})$$
$$\text{Shortfall Exposure Value (£)} = \text{Shortfall Units} \times \text{Unit Value (£)}$$
* **Interpretation:** Indicative financial valuation of unfilled customer demand before new stock can arrive.

### 2.4 Inventory Vulnerability Classification
Each product is classified into explainable risk tiers:
* **Critical:** $\text{DOC} < \text{Lead Time}$, or $\text{Stock} = 0$. Replenishment orders placed today will not arrive in time to prevent a stockout.
* **High:** $\text{DOC} < 1.4 \times \text{Lead Time}$, or $\text{Stock} \le \text{Safety Stock}$. Stock is near or within the buffer zone.
* **Moderate:** $\text{Stock} \le \text{Reorder Point (ROP)}$. Routine reorder trigger point has been reached.
* **Low:** $\text{Stock} > \text{Reorder Point}$. Healthy stock coverage.
* **Excess Stock Flag:** $\text{DOC} > 75 \text{ days}$. Capital is tied up in slow-moving stock.

---

## 3. Supplier Performance & Risk Scoring Engine

### 3.1 Historical On-Time Delivery Rate (OTD %)
$$\text{OTD Rate (\%)} = \frac{\text{Completed Orders with Actual Delivery Date} \le \text{Expected Delivery Date}}{\text{Total Completed Purchase Orders}} \times 100$$
* Minimum 3 completed orders required for calculation; otherwise labelled "Insufficient history".

### 3.2 Lead-Time Delay Severity
$$\text{Average Delay (Days)} = \frac{\sum \max(0, \text{Actual Delivery Date} - \text{Expected Delivery Date})}{\text{Completed Late Orders}}$$

### 3.3 Composite Supplier Risk Score (0–100)
All components are normalized so that **higher values consistently indicate higher operational risk**:
$$\text{Risk Score} = \sum_{i=1}^5 (w_i \times \text{Component Risk}_i)$$

| Component Factor | Weight ($w_i$) | Normalization Formula | Risk Driver |
| :--- | :---: | :--- | :--- |
| **Delivery Reliability** | 35% | $100 - \text{OTD Rate \%}$ | Penalizes missed delivery dates |
| **Delay Severity** | 20% | $\min(100, \frac{\text{Average Delay}}{8.0} \times 100)$ | Penalizes long delays (scaled against 8-day ceiling) |
| **Defect Rate** | 15% | $\min(100, \frac{\text{Defect Rate \%}}{4.0} \times 100)$ | Penalizes scrap and QA rejects (scaled against 4% ceiling) |
| **Financial Risk** | 15% | Direct Score (0–100) | Creditworthiness and insolvency indicators |
| **Concentration Risk**| 15% | $\min(100, \text{Tied Value Share \%} \times 3.5)$ | Single-vendor retail asset dependency penalty |

**Risk Bands:**
* Low Risk: Score $< 25.0$
* Moderate Risk: Score $25.0$ to $41.9$
* High Risk: Score $42.0$ to $59.9$
* Critical Risk: Score $\ge 60.0$

---

## 4. Disruption Simulation Model

SupplyShield AI uses a discrete **day-by-day balance simulation**:
For each product over each day $t \in [1, \text{Duration}]$:
1. **Starting Stock:** $S_0 = \text{Current Stock} \times (1 - \text{Stock Reduction \%})$.
2. **Inbound Receipts:** $A_t$ (PO arrivals permitted only from non-disrupted vendors if toggled).
3. **Daily Demand:** $D_t = \text{Average Daily Demand} \times \text{Demand Multiplier}$.
4. **Inventory Balance:**
   $$S_t = \max(0, S_{t-1} + A_t - D_t)$$
5. **Unmet Demand:**
   $$U_t = \max(0, D_t - (S_{t-1} + A_t))$$
6. **Stockout Occurrence:** The earliest day $t$ where $S_{t-1} + A_t < D_t$.

**Key Properties:**
* Strict non-negativity constraint ($S_t \ge 0$).
* Unmet demand is tracked distinctly and cumulative exposure does not distort remaining stock.
* Open purchase orders from the affected supplier are frozen during the outage.

---

## 5. Mitigation Decision Framework

When a supply disruption occurs, managers compare 5 distinct response strategies:

| Strategy | Description | Cost Characteristics | Replenishment Speed | Feasibility Constraint |
| :--- | :--- | :--- | :--- | :--- |
| **1. Wait Normal** | No express intervention. | £0 incremental cost. | Standard lead time (slow). | Always available; exposes business to stockout. |
| **2. Expedite PO** | Express priority air/road freight. | Premium surcharge per unit (£8.50/unit). | Compresses lead time by 50%. | Carrier express freight availability. |
| **3. Alternative Supplier** | Contract pre-qualified second vendor. | Switching cost + unit price differential. | Secondary vendor lead time. | Requires pre-qualified partner in catalog. |
| **4. Inter-Depot Transfer** | Shift buffer stock from regional hub. | Low handling fee (£2.20/unit). | 48 hours (fast). | Available uncommitted stock in sister depot. |
| **5. Hybrid Split** | Deploy regional buffer + expedite balance. | Blended freight and transfer fees. | Fast initial relief + expedited replenishment. | Operational coordination between hubs. |

### Decision Engine Rules
The recommendation engine evaluates:
1. **Feasibility:** Eliminates strategies that lack pre-qualified vendors or exceed user budget.
2. **Service Protection:** Favors options that minimize remaining shortage units.
3. **Cost per Unit Protected:** Calculates $\frac{\text{Incremental Cost}}{\text{Units Protected}}$.
4. **Recommendation Statement:** Generates plain English justification highlighting the exact financial and speed trade-offs.
