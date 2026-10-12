# SupplyShield AI — Technical Architecture

This document describes the software architecture, data flow, component boundaries, and technology decisions behind SupplyShield AI.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph DataLayer [Authoritative Data Layer]
        CSV1[suppliers.csv]
        CSV2[inventory.csv]
        CSV3[purchase_orders.csv]
        CSV4[demand_history.csv]
        CSV5[supplier_product_options.csv]
    end

    subgraph Backend [FastAPI Backend Service (Python 3.12)]
        DataLoader[DataLoader Singleton & Schema Validator]
        
        subgraph Services [Analytics & Decision Engines]
            InvService[Inventory Analytics Service]
            SupService[Supplier Scoring Service]
            SimService[Discrete Simulation Engine]
            MitService[Mitigation Trade-off Service]
            DataQualService[Data Quality Audit Service]
        end

        subgraph Routers [FastAPI REST Endpoints]
            R_Health[/api/health]
            R_Overview[/api/overview]
            R_Inventory[/api/inventory]
            R_Suppliers[/api/suppliers]
            R_Simulation[/api/simulation/run]
            R_Mitigation[/api/mitigation/compare]
            R_Data[/api/data-explorer]
            R_Method[/api/methodology]
        end
    end

    subgraph Frontend [React 19 + TypeScript + Vite Control Tower]
        ApiClient[Typed API Client (fetch)]
        
        subgraph LayoutComponents [Shell & Navigation]
            Sidebar[Persistent Dark Navy Sidebar]
            Navbar[Executive Topbar & Breadcrumbs]
            Toasts[Feedback Notification System]
        end

        subgraph Pages [Decision Intelligence Pages]
            P1[Overview Dashboard]
            P2[Inventory Intelligence]
            P3[Supplier Intelligence]
            P4[Disruption Simulator]
            P5[Mitigation Planner]
            P6[Data Explorer]
            P7[Methodology & Assumptions]
        end

        subgraph Charts [Recharts Visualizations]
            C_Donut[Risk Distribution Donut]
            C_Bar[Category Value Bar]
            C_Line[Demand vs Forecast 90-Day Trend]
            C_LeadTime[Quoted vs Actual Lead-Time Bar]
            C_Trajectory[Disruption Trajectory Area Chart]
        end
    end

    DataLayer -->|Reads & Parses| DataLoader
    DataLoader --> Services
    Services --> Routers
    Routers -->|JSON REST over HTTP| ApiClient
    ApiClient --> Pages
    Pages --> Charts
    LayoutComponents --> Pages
```

---

## 2. Technology Stack Justification

| Layer | Chosen Technology | Architectural Justification |
| :--- | :--- | :--- |
| **Data Storage** | Local CSV Files | Demonstrates data manipulation from flat files without requiring database servers, cloud credentials, or external API dependencies. Matches real-world Excel/CSV data workflows in retail operations. |
| **Backend Framework**| FastAPI (Python 3.12) | High-performance asynchronous REST framework with native Pydantic validation, automatic OpenAPI/Swagger documentation, and clean integration with pandas. |
| **Data Analytics** | pandas + NumPy | Standard enterprise analytics stack for tabular data manipulation, timeseries grouping, and vectorized array calculations. |
| **Frontend Framework**| React 19 + TypeScript | Component modularity, strict compile-time type safety matching Pydantic backend models, and enterprise state management. |
| **Build Tooling** | Vite | Instant Hot Module Replacement (HMR), lightweight production bundling (`built in 2.77s`), and native ES modules. |
| **Styling** | Tailwind CSS v4 | Consistent design system, dark navy control tower navigation aesthetic, accessible color contrast, and responsive layout. |
| **Data Visualization** | Recharts | Composable SVG-based chart library providing responsive donut charts, timeseries lines, bar charts, and trajectory area plots. |

---

## 3. Data Flow & Separation of Concerns

1. **Flat File Authority:** Raw data is stored immutably in `data/*.csv`.
2. **Ingestion & Type Coercion:** `DataLoader` loads files on startup, coercing types safely and validating date formats.
3. **Analytics Isolation:** All operational formulas (Days of Cover, Lead-Time Demand, Shortfall Exposure, 0-100 Supplier Risk, Trajectory Simulation) reside in isolated backend service modules (`backend/app/services/`). UI components never calculate business metrics directly.
4. **API Serialization:** Pydantic schemas validate requests, prevent `NaN` or `Infinity` from leaking into JSON, and enforce boundary constraints.
5. **Presentation & Interactivity:** React components retrieve data via typed API endpoints, rendering responsive tables, interactive parameter sliders, drill-down modals, and SVG charts.
