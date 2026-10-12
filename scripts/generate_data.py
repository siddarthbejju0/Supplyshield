import csv
import random
from datetime import datetime, timedelta

# Fix seed for reproducibility
random.seed(42)

# Reference timeline: today is 2026-09-30
TODAY = datetime(2026, 9, 30)

# 1. SUPPLIERS
suppliers = [
    {
        "supplier_id": "SUP001",
        "supplier_name": "Apex Logistics & Components",
        "country": "United Kingdom",
        "category": "Electronics & Hardware",
        "standard_lead_time_days": 7,
        "quoted_unit_cost": 42.50,
        "historical_on_time_rate_pct": 94.2,
        "historical_defect_rate_pct": 0.8,
        "capacity_units_per_day": 2500,
        "minimum_order_quantity": 100,
        "financial_risk_score": 18.0,
        "sustainability_score": 85.0
    },
    {
        "supplier_id": "SUP002",
        "supplier_name": "Britannia Packaging & Goods",
        "country": "United Kingdom",
        "category": "Packaging & Supplies",
        "standard_lead_time_days": 5,
        "quoted_unit_cost": 4.20,
        "historical_on_time_rate_pct": 96.5,
        "historical_defect_rate_pct": 0.4,
        "capacity_units_per_day": 8000,
        "minimum_order_quantity": 500,
        "financial_risk_score": 12.0,
        "sustainability_score": 90.0
    },
    {
        "supplier_id": "SUP003",
        "supplier_name": "Rhine Precision Goods GmbH",
        "country": "Germany",
        "category": "Home & Kitchen",
        "standard_lead_time_days": 14,
        "quoted_unit_cost": 28.50,
        "historical_on_time_rate_pct": 88.0,
        "historical_defect_rate_pct": 1.1,
        "capacity_units_per_day": 1800,
        "minimum_order_quantity": 200,
        "financial_risk_score": 25.0,
        "sustainability_score": 78.0
    },
    {
        "supplier_id": "SUP004",
        "supplier_name": "Nordic Tech Solutions AB",
        "country": "Sweden",
        "category": "Electronics & Hardware",
        "standard_lead_time_days": 12,
        "quoted_unit_cost": 65.00,
        "historical_on_time_rate_pct": 91.5,
        "historical_defect_rate_pct": 0.9,
        "capacity_units_per_day": 1200,
        "minimum_order_quantity": 150,
        "financial_risk_score": 20.0,
        "sustainability_score": 92.0
    },
    {
        "supplier_id": "SUP005",
        "supplier_name": "Iberia Retail & Textiles S.L.",
        "country": "Spain",
        "category": "Apparel & Textiles",
        "standard_lead_time_days": 16,
        "quoted_unit_cost": 16.20,
        "historical_on_time_rate_pct": 81.0,
        "historical_defect_rate_pct": 2.2,
        "capacity_units_per_day": 3000,
        "minimum_order_quantity": 300,
        "financial_risk_score": 38.0,
        "sustainability_score": 70.0
    },
    {
        "supplier_id": "SUP006",
        "supplier_name": "FarEast Precision Micro Ltd",
        "country": "Taiwan",
        "category": "Electronics & Hardware",
        "standard_lead_time_days": 35,
        "quoted_unit_cost": 22.00,
        "historical_on_time_rate_pct": 73.5,
        "historical_defect_rate_pct": 2.9,
        "capacity_units_per_day": 6000,
        "minimum_order_quantity": 1000,
        "financial_risk_score": 42.0,
        "sustainability_score": 62.0
    },
    {
        "supplier_id": "SUP007",
        "supplier_name": "Baltic Paper & Logistics Sp.",
        "country": "Poland",
        "category": "Packaging & Supplies",
        "standard_lead_time_days": 18,
        "quoted_unit_cost": 6.80,
        "historical_on_time_rate_pct": 84.5,
        "historical_defect_rate_pct": 1.6,
        "capacity_units_per_day": 4500,
        "minimum_order_quantity": 400,
        "financial_risk_score": 30.0,
        "sustainability_score": 74.0
    },
    {
        "supplier_id": "SUP008",
        "supplier_name": "Trans-Alpine Appliances SpA",
        "country": "Italy",
        "category": "Home & Kitchen",
        "standard_lead_time_days": 21,
        "quoted_unit_cost": 54.00,
        "historical_on_time_rate_pct": 77.0,
        "historical_defect_rate_pct": 2.5,
        "capacity_units_per_day": 1500,
        "minimum_order_quantity": 250,
        "financial_risk_score": 46.0,
        "sustainability_score": 68.0
    },
    {
        "supplier_id": "SUP009",
        "supplier_name": "Celtic Consumer Goods Ltd",
        "country": "Ireland",
        "category": "Personal Care & Health",
        "standard_lead_time_days": 8,
        "quoted_unit_cost": 11.50,
        "historical_on_time_rate_pct": 93.0,
        "historical_defect_rate_pct": 0.7,
        "capacity_units_per_day": 3500,
        "minimum_order_quantity": 200,
        "financial_risk_score": 15.0,
        "sustainability_score": 88.0
    },
    {
        "supplier_id": "SUP010",
        "supplier_name": "Pacific Rim Plastics Co.",
        "country": "Vietnam",
        "category": "Home & Kitchen",
        "standard_lead_time_days": 42,
        "quoted_unit_cost": 7.20,
        "historical_on_time_rate_pct": 68.0,
        "historical_defect_rate_pct": 3.4,
        "capacity_units_per_day": 7500,
        "minimum_order_quantity": 1200,
        "financial_risk_score": 55.0,
        "sustainability_score": 54.0
    }
]

# Write suppliers.csv
with open("data/suppliers.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(suppliers[0].keys()))
    writer.writeheader()
    writer.writerows(suppliers)

# 2. INVENTORY (24 products)
products = [
    # Electronics & Hardware (Apex SUP001, Nordic SUP004, FarEast SUP006)
    {"product_id": "SKU-ELC-001", "product_name": "Wireless IoT Sensor Hub", "category": "Electronics & Hardware", "supplier_id": "SUP001", "current_stock_units": 450, "average_daily_demand_units": 45.0, "demand_std_dev_units": 8.5, "reorder_point_units": 400, "safety_stock_units": 85, "unit_value": 75.00, "target_service_level_pct": 95.0, "criticality": "High"},
    {"product_id": "SKU-ELC-002", "product_name": "Ultra-Fast USB-C Controller", "category": "Electronics & Hardware", "supplier_id": "SUP006", "current_stock_units": 280, "average_daily_demand_units": 50.0, "demand_std_dev_units": 12.0, "reorder_point_units": 2100, "safety_stock_units": 350, "unit_value": 35.00, "target_service_level_pct": 98.0, "criticality": "Critical"}, # Critical! stock only 5.6 days cover vs 35d lead time
    {"product_id": "SKU-ELC-003", "product_name": "Smart Energy Monitor Pro", "category": "Electronics & Hardware", "supplier_id": "SUP004", "current_stock_units": 620, "average_daily_demand_units": 25.0, "demand_std_dev_units": 4.5, "reorder_point_units": 360, "safety_stock_units": 60, "unit_value": 115.00, "target_service_level_pct": 95.0, "criticality": "Medium"},
    {"product_id": "SKU-ELC-004", "product_name": "Industrial Bluetooth Beacon", "category": "Electronics & Hardware", "supplier_id": "SUP001", "current_stock_units": 90, "average_daily_demand_units": 30.0, "demand_std_dev_units": 6.0, "reorder_point_units": 260, "safety_stock_units": 50, "unit_value": 52.00, "target_service_level_pct": 95.0, "criticality": "High"}, # Stock 3 days cover vs 7d lead time -> Critical
    {"product_id": "SKU-ELC-005", "product_name": "Micro-Controller Core Board", "category": "Electronics & Hardware", "supplier_id": "SUP006", "current_stock_units": 1800, "average_daily_demand_units": 40.0, "demand_std_dev_units": 7.0, "reorder_point_units": 1600, "safety_stock_units": 200, "unit_value": 28.00, "target_service_level_pct": 92.0, "criticality": "Medium"},
    
    # Packaging & Supplies (Britannia SUP002, Baltic SUP007)
    {"product_id": "SKU-PKG-001", "product_name": "Eco Corrugated Shipping Box M", "category": "Packaging & Supplies", "supplier_id": "SUP002", "current_stock_units": 4200, "average_daily_demand_units": 350.0, "demand_std_dev_units": 45.0, "reorder_point_units": 2100, "safety_stock_units": 350, "unit_value": 5.80, "target_service_level_pct": 98.0, "criticality": "High"},
    {"product_id": "SKU-PKG-002", "product_name": "Biodegradable Bubble Mailer L", "category": "Packaging & Supplies", "supplier_id": "SUP002", "current_stock_units": 850, "average_daily_demand_units": 200.0, "demand_std_dev_units": 30.0, "reorder_point_units": 1200, "safety_stock_units": 200, "unit_value": 3.90, "target_service_level_pct": 95.0, "criticality": "Medium"}, # Stock 4.25 days vs 5d lead time -> High risk
    {"product_id": "SKU-PKG-003", "product_name": "Heavy-Duty Reinforced Tape", "category": "Packaging & Supplies", "supplier_id": "SUP007", "current_stock_units": 1500, "average_daily_demand_units": 65.0, "demand_std_dev_units": 10.0, "reorder_point_units": 1350, "safety_stock_units": 180, "unit_value": 8.50, "target_service_level_pct": 90.0, "criticality": "Low"},
    {"product_id": "SKU-PKG-004", "product_name": "Custom Printed Thermal Labels", "category": "Packaging & Supplies", "supplier_id": "SUP007", "current_stock_units": 3200, "average_daily_demand_units": 110.0, "demand_std_dev_units": 15.0, "reorder_point_units": 2200, "safety_stock_units": 220, "unit_value": 11.20, "target_service_level_pct": 95.0, "criticality": "Medium"},

    # Home & Kitchen (Rhine SUP003, Trans-Alpine SUP008, Pacific Rim SUP010)
    {"product_id": "SKU-HOM-001", "product_name": "Ergonomic Chef Knife 8-inch", "category": "Home & Kitchen", "supplier_id": "SUP003", "current_stock_units": 550, "average_daily_demand_units": 22.0, "demand_std_dev_units": 4.0, "reorder_point_units": 360, "safety_stock_units": 52, "unit_value": 48.00, "target_service_level_pct": 95.0, "criticality": "Medium"},
    {"product_id": "SKU-HOM-002", "product_name": "Cast Iron Skillet Pre-Seasoned", "category": "Home & Kitchen", "supplier_id": "SUP003", "current_stock_units": 120, "average_daily_demand_units": 18.0, "demand_std_dev_units": 3.5, "reorder_point_units": 300, "safety_stock_units": 48, "unit_value": 42.00, "target_service_level_pct": 90.0, "criticality": "High"}, # 6.6 days vs 14d lead time -> Critical
    {"product_id": "SKU-HOM-003", "product_name": "Commercial Induction Cooktop", "category": "Home & Kitchen", "supplier_id": "SUP008", "current_stock_units": 310, "average_daily_demand_units": 12.0, "demand_std_dev_units": 2.8, "reorder_point_units": 290, "safety_stock_units": 38, "unit_value": 98.00, "target_service_level_pct": 95.0, "criticality": "High"},
    {"product_id": "SKU-HOM-004", "product_name": "Thermal Glass Carafe 1.5L", "category": "Home & Kitchen", "supplier_id": "SUP008", "current_stock_units": 1400, "average_daily_demand_units": 15.0, "demand_std_dev_units": 3.0, "reorder_point_units": 360, "safety_stock_units": 45, "unit_value": 24.50, "target_service_level_pct": 85.0, "criticality": "Low"}, # 93 days cover -> Excess stock!
    {"product_id": "SKU-HOM-005", "product_name": "Modular Food Storage Set (10pc)", "category": "Home & Kitchen", "supplier_id": "SUP010", "current_stock_units": 450, "average_daily_demand_units": 48.0, "demand_std_dev_units": 9.0, "reorder_point_units": 2350, "safety_stock_units": 334, "unit_value": 18.50, "target_service_level_pct": 95.0, "criticality": "Critical"}, # 9.3 days vs 42d lead time -> Extreme critical shortfall
    {"product_id": "SKU-HOM-006", "product_name": "Airtight Pantry Bin Large", "category": "Home & Kitchen", "supplier_id": "SUP010", "current_stock_units": 2800, "average_daily_demand_units": 35.0, "demand_std_dev_units": 6.0, "reorder_point_units": 1650, "safety_stock_units": 180, "unit_value": 12.00, "target_service_level_pct": 90.0, "criticality": "Medium"},

    # Apparel & Textiles (Iberia SUP005)
    {"product_id": "SKU-APP-001", "product_name": "Organic Cotton Workwear Apron", "category": "Apparel & Textiles", "supplier_id": "SUP005", "current_stock_units": 420, "average_daily_demand_units": 28.0, "demand_std_dev_units": 5.5, "reorder_point_units": 520, "safety_stock_units": 72, "unit_value": 26.00, "target_service_level_pct": 92.0, "criticality": "Medium"},
    {"product_id": "SKU-APP-002", "product_name": "Merino Wool Thermal Base Layer", "category": "Apparel & Textiles", "supplier_id": "SUP005", "current_stock_units": 180, "average_daily_demand_units": 22.0, "demand_std_dev_units": 4.5, "reorder_point_units": 410, "safety_stock_units": 58, "unit_value": 45.00, "target_service_level_pct": 95.0, "criticality": "High"}, # 8.1 days vs 16d lead time -> High / Critical
    {"product_id": "SKU-APP-003", "product_name": "Waterproof High-Vis Jacket", "category": "Apparel & Textiles", "supplier_id": "SUP005", "current_stock_units": 850, "average_daily_demand_units": 16.0, "demand_std_dev_units": 3.0, "reorder_point_units": 290, "safety_stock_units": 34, "unit_value": 68.00, "target_service_level_pct": 90.0, "criticality": "Medium"},
    {"product_id": "SKU-APP-004", "product_name": "Reinforced Utility Trousers", "category": "Apparel & Textiles", "supplier_id": "SUP005", "current_stock_units": 1200, "average_daily_demand_units": 14.0, "demand_std_dev_units": 2.5, "reorder_point_units": 260, "safety_stock_units": 36, "unit_value": 39.00, "target_service_level_pct": 88.0, "criticality": "Low"}, # 85 days cover

    # Personal Care & Health (Celtic SUP009)
    {"product_id": "SKU-PER-001", "product_name": "Botanical Hand Sanitiser 500ml", "category": "Personal Care & Health", "supplier_id": "SUP009", "current_stock_units": 3100, "average_daily_demand_units": 95.0, "demand_std_dev_units": 14.0, "reorder_point_units": 880, "safety_stock_units": 120, "unit_value": 14.50, "target_service_level_pct": 95.0, "criticality": "Medium"},
    {"product_id": "SKU-PER-002", "product_name": "Organic Rosemary Hair Tonic", "category": "Personal Care & Health", "supplier_id": "SUP009", "current_stock_units": 410, "average_daily_demand_units": 42.0, "demand_std_dev_units": 7.0, "reorder_point_units": 390, "safety_stock_units": 54, "unit_value": 21.00, "target_service_level_pct": 95.0, "criticality": "High"},
    {"product_id": "SKU-PER-003", "product_name": "Eco Mineral Sunscreen SPF50", "category": "Personal Care & Health", "supplier_id": "SUP009", "current_stock_units": 110, "average_daily_demand_units": 35.0, "demand_std_dev_units": 8.0, "reorder_point_units": 340, "safety_stock_units": 60, "unit_value": 19.50, "target_service_level_pct": 90.0, "criticality": "High"}, # 3.1 days vs 8d lead time -> Critical
    {"product_id": "SKU-PER-004", "product_name": "Aloe Vera Calming Gel 250ml", "category": "Personal Care & Health", "supplier_id": "SUP009", "current_stock_units": 2200, "average_daily_demand_units": 30.0, "demand_std_dev_units": 4.5, "reorder_point_units": 280, "safety_stock_units": 40, "unit_value": 12.00, "target_service_level_pct": 90.0, "criticality": "Low"},
    {"product_id": "SKU-ELC-006", "product_name": "Heavy-Duty Surge Protector Rack", "category": "Electronics & Hardware", "supplier_id": "SUP004", "current_stock_units": 480, "average_daily_demand_units": 15.0, "demand_std_dev_units": 2.5, "reorder_point_units": 210, "safety_stock_units": 30, "unit_value": 85.00, "target_service_level_pct": 90.0, "criticality": "Low"}
]

# Write inventory.csv
with open("data/inventory.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(products[0].keys()))
    writer.writeheader()
    writer.writerows(products)

# 3. PURCHASE ORDERS
# Generate realistic PO history for past 120 days up to 2026-09-30
# Mix of:
# - COMPLETED (on-time and delayed)
# - OPEN (expected soon, on track)
# - DELAYED (expected date in the past, actual date null, status DELAYED)
purchase_orders = []
po_counter = 1001

prod_by_supplier = {}
for p in products:
    prod_by_supplier.setdefault(p["supplier_id"], []).append(p)

supplier_map = {s["supplier_id"]: s for s in suppliers}

for s_id, s_info in supplier_map.items():
    s_products = prod_by_supplier.get(s_id, [])
    if not s_products:
        continue
    
    lead_time = s_info["standard_lead_time_days"]
    hist_on_time = s_info["historical_on_time_rate_pct"] / 100.0
    
    # Generate 6 to 9 completed orders in past 100 days
    num_completed = random.randint(6, 8)
    for i in range(num_completed):
        po_id = f"PO-2026-{po_counter}"
        po_counter += 1
        prod = random.choice(s_products)
        
        # Order date between 110 and 20 days ago
        days_ago = random.randint(20 + lead_time, 110)
        order_date = TODAY - timedelta(days=days_ago)
        expected_date = order_date + timedelta(days=lead_time)
        
        # Determine if on-time based on supplier profile
        is_on_time = (random.random() < hist_on_time)
        if is_on_time:
            # Delivered on or slightly before expected
            delta = random.choice([0, 0, 0, -1, -2])
            actual_date = expected_date + timedelta(days=delta)
        else:
            # Late delivery by 2 to 12 days
            delay_days = random.randint(2, max(4, int(lead_time * 0.5)))
            actual_date = expected_date + timedelta(days=delay_days)
            
        qty_ordered = int(prod["average_daily_demand_units"] * random.randint(15, 30))
        # Ensure at least MOQ
        qty_ordered = max(qty_ordered, s_info["minimum_order_quantity"])
        
        # Quantity received (sometimes minor shortfall/defect)
        if random.random() < 0.15:
            qty_received = int(qty_ordered * random.uniform(0.92, 0.99))
        else:
            qty_received = qty_ordered
            
        purchase_orders.append({
            "purchase_order_id": po_id,
            "supplier_id": s_id,
            "product_id": prod["product_id"],
            "order_date": order_date.strftime("%Y-%m-%d"),
            "expected_delivery_date": expected_date.strftime("%Y-%m-%d"),
            "actual_delivery_date": actual_date.strftime("%Y-%m-%d"),
            "quantity_ordered": qty_ordered,
            "quantity_received": qty_received,
            "unit_cost": s_info["quoted_unit_cost"],
            "status": "COMPLETED"
        })

    # Generate 1-2 open orders
    # Some suppliers have OPEN on-track orders, and high-risk suppliers have DELAYED orders!
    if s_id in ["SUP006", "SUP010", "SUP008", "SUP005"]:
        # Has an overdue/delayed order!
        po_id = f"PO-2026-{po_counter}"
        po_counter += 1
        prod = random.choice(s_products)
        order_days_ago = lead_time + random.randint(4, 9)
        order_date = TODAY - timedelta(days=order_days_ago)
        expected_date = order_date + timedelta(days=lead_time) # in the past!
        qty_ordered = max(int(prod["average_daily_demand_units"] * 25), s_info["minimum_order_quantity"])
        
        purchase_orders.append({
            "purchase_order_id": po_id,
            "supplier_id": s_id,
            "product_id": prod["product_id"],
            "order_date": order_date.strftime("%Y-%m-%d"),
            "expected_delivery_date": expected_date.strftime("%Y-%m-%d"),
            "actual_delivery_date": "",
            "quantity_ordered": qty_ordered,
            "quantity_received": 0,
            "unit_cost": s_info["quoted_unit_cost"],
            "status": "DELAYED"
        })

    # Standard open on-track order
    po_id = f"PO-2026-{po_counter}"
    po_counter += 1
    prod = random.choice(s_products)
    order_days_ago = max(1, int(lead_time * 0.4))
    order_date = TODAY - timedelta(days=order_days_ago)
    expected_date = order_date + timedelta(days=lead_time)
    qty_ordered = max(int(prod["average_daily_demand_units"] * 20), s_info["minimum_order_quantity"])
    
    purchase_orders.append({
        "purchase_order_id": po_id,
        "supplier_id": s_id,
        "product_id": prod["product_id"],
        "order_date": order_date.strftime("%Y-%m-%d"),
        "expected_delivery_date": expected_date.strftime("%Y-%m-%d"),
        "actual_delivery_date": "",
        "quantity_ordered": qty_ordered,
        "quantity_received": 0,
        "unit_cost": s_info["quoted_unit_cost"],
        "status": "OPEN"
    })

# Write purchase_orders.csv
with open("data/purchase_orders.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(purchase_orders[0].keys()))
    writer.writeheader()
    writer.writerows(purchase_orders)

# 4. DEMAND HISTORY (90 days for all 24 products)
# From TODAY - 89 days up to TODAY
demand_history = []
start_date = TODAY - timedelta(days=89)

for day_idx in range(90):
    curr_date = start_date + timedelta(days=day_idx)
    date_str = curr_date.strftime("%Y-%m-%d")
    is_weekend = curr_date.weekday() in (5, 6)
    
    for prod in products:
        base_demand = prod["average_daily_demand_units"]
        std_dev = prod["demand_std_dev_units"]
        
        # Slight weekend factor (retail goes up or down depending on category)
        factor = 1.15 if (is_weekend and prod["category"] in ["Home & Kitchen", "Apparel & Textiles"]) else 1.0
        if is_weekend and prod["category"] == "Electronics & Hardware":
            factor = 0.9
            
        # Add slight trend & random variation
        trend = 1.0 + (day_idx - 45) * 0.001
        expected_demand = base_demand * factor * trend
        
        forecast = round(expected_demand + random.gauss(0, std_dev * 0.4), 1)
        forecast = max(1.0, forecast)
        
        actual = round(expected_demand + random.gauss(0, std_dev), 1)
        actual = max(0.0, actual)
        
        demand_history.append({
            "date": date_str,
            "product_id": prod["product_id"],
            "units_sold": actual,
            "demand_forecast_units": forecast
        })

# Write demand_history.csv
with open("data/demand_history.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(demand_history[0].keys()))
    writer.writeheader()
    writer.writerows(demand_history)

# 5. SUPPLIER PRODUCT OPTIONS (For Mitigation Planner)
# Qualified primary and alternative sourcing pairs with explicit costs & lead times
options = [
    # SKU-ELC-002: Primary FarEast SUP006 (£22.00, 35d) -> Alt Nordic SUP004 (£65.00, 12d) & Apex SUP001 (£45.00, 7d)
    {"product_id": "SKU-ELC-002", "supplier_id": "SUP006", "is_primary": True, "lead_time_days": 35, "expedited_lead_time_days": 18, "unit_cost": 22.00, "expedited_freight_premium_per_unit": 8.50, "switching_cost": 0.0, "status": "Primary Supplier"},
    {"product_id": "SKU-ELC-002", "supplier_id": "SUP004", "is_primary": False, "lead_time_days": 12, "expedited_lead_time_days": 6, "unit_cost": 38.00, "expedited_freight_premium_per_unit": 12.00, "switching_cost": 1500.0, "status": "Qualified Alternative"},
    {"product_id": "SKU-ELC-002", "supplier_id": "SUP001", "is_primary": False, "lead_time_days": 7, "expedited_lead_time_days": 4, "unit_cost": 42.00, "expedited_freight_premium_per_unit": 15.00, "switching_cost": 2200.0, "status": "Secondary Sourcing"},
    
    # SKU-HOM-005: Primary Pacific Rim SUP010 (£7.20, 42d) -> Alt Rhine SUP003 (£12.50, 14d)
    {"product_id": "SKU-HOM-005", "supplier_id": "SUP010", "is_primary": True, "lead_time_days": 42, "expedited_lead_time_days": 21, "unit_cost": 7.20, "expedited_freight_premium_per_unit": 4.50, "switching_cost": 0.0, "status": "Primary Supplier"},
    {"product_id": "SKU-HOM-005", "supplier_id": "SUP003", "is_primary": False, "lead_time_days": 14, "expedited_lead_time_days": 7, "unit_cost": 11.80, "expedited_freight_premium_per_unit": 6.00, "switching_cost": 850.0, "status": "Qualified Alternative"},
    
    # SKU-HOM-002: Primary Rhine SUP003 (£28.50, 14d) -> Alt Trans-Alpine SUP008 (£34.00, 21d)
    {"product_id": "SKU-HOM-002", "supplier_id": "SUP003", "is_primary": True, "lead_time_days": 14, "expedited_lead_time_days": 7, "unit_cost": 28.50, "expedited_freight_premium_per_unit": 7.50, "switching_cost": 0.0, "status": "Primary Supplier"},
    {"product_id": "SKU-HOM-002", "supplier_id": "SUP008", "is_primary": False, "lead_time_days": 21, "expedited_lead_time_days": 10, "unit_cost": 33.00, "expedited_freight_premium_per_unit": 9.00, "switching_cost": 600.0, "status": "Qualified Alternative"},

    # SKU-ELC-004: Primary Apex SUP001 (£42.50, 7d) -> Alt Nordic SUP004 (£48.00, 12d)
    {"product_id": "SKU-ELC-004", "supplier_id": "SUP001", "is_primary": True, "lead_time_days": 7, "expedited_lead_time_days": 3, "unit_cost": 42.50, "expedited_freight_premium_per_unit": 10.00, "switching_cost": 0.0, "status": "Primary Supplier"},
    {"product_id": "SKU-ELC-004", "supplier_id": "SUP004", "is_primary": False, "lead_time_days": 12, "expedited_lead_time_days": 5, "unit_cost": 49.00, "expedited_freight_premium_per_unit": 11.50, "switching_cost": 1200.0, "status": "Qualified Alternative"},

    # SKU-APP-002: Primary Iberia SUP005 (£16.20, 16d) -> Alt Celtic SUP009 (£22.00, 8d)
    {"product_id": "SKU-APP-002", "supplier_id": "SUP005", "is_primary": True, "lead_time_days": 16, "expedited_lead_time_days": 8, "unit_cost": 16.20, "expedited_freight_premium_per_unit": 5.50, "switching_cost": 0.0, "status": "Primary Supplier"},
    {"product_id": "SKU-APP-002", "supplier_id": "SUP009", "is_primary": False, "lead_time_days": 8, "expedited_lead_time_days": 4, "unit_cost": 21.50, "expedited_freight_premium_per_unit": 6.80, "switching_cost": 950.0, "status": "Qualified Alternative"},

    # SKU-PER-003: Primary Celtic SUP009 (£11.50, 8d) -> Alt Britannia SUP002 (£14.00, 5d)
    {"product_id": "SKU-PER-003", "supplier_id": "SUP009", "is_primary": True, "lead_time_days": 8, "expedited_lead_time_days": 4, "unit_cost": 11.50, "expedited_freight_premium_per_unit": 4.00, "switching_cost": 0.0, "status": "Primary Supplier"},
    {"product_id": "SKU-PER-003", "supplier_id": "SUP002", "is_primary": False, "lead_time_days": 5, "expedited_lead_time_days": 2, "unit_cost": 13.80, "expedited_freight_premium_per_unit": 5.00, "switching_cost": 500.0, "status": "Qualified Alternative"}
]

# Write supplier_product_options.csv
with open("data/supplier_product_options.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(options[0].keys()))
    writer.writeheader()
    writer.writerows(options)

print(f"Generated {len(suppliers)} suppliers, {len(products)} products, {len(purchase_orders)} POs, {len(demand_history)} demand records, {len(options)} sourcing options.")
