import React from 'react';
import {
  BookOpen,
  Calculator,
  ShieldCheck,
  Activity,
  Layers,
  GraduationCap,
  HelpCircle,
  Scale
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl border border-sky-200">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              SupplyShield AI — Methodology, Formulas & Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent operational documentation of supply chain mathematical models, risk weightings, and decision engines.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Inventory Formulas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calculator className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">
            1. Core Inventory Metrics & Vulnerability Formulas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Days of Cover (DOC)
            </h3>
            <div className="p-2.5 bg-white rounded-lg font-mono text-xs text-sky-800 border border-slate-200">
              Days of Cover = Current Stock Units ÷ Average Daily Demand Units
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Estimates the number of days existing on-hand stock can satisfy run-rate customer demand assuming no inbound arrivals. If average daily demand is 0, DOC is flagged as infinite coverage without dividing by zero.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Expected Lead-Time Demand (LTD)
            </h3>
            <div className="p-2.5 bg-white rounded-lg font-mono text-xs text-sky-800 border border-slate-200">
              LTD = Average Daily Demand × Supplier Replenishment Lead Time (Days)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Quantifies the units required to satisfy customer orders between triggering a purchase order and warehouse physical receipt.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Potential Lead-Time Shortfall
            </h3>
            <div className="p-2.5 bg-white rounded-lg font-mono text-xs text-sky-800 border border-slate-200">
              Shortfall Units = max(0, Expected Lead-Time Demand - Available Stock)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Measures the projected stock deficit that will occur before normal replenishment arrives if stock on hand is insufficient to cover the replenishment pipeline.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Shortfall Exposure Value (£)
            </h3>
            <div className="p-2.5 bg-white rounded-lg font-mono text-xs text-sky-800 border border-slate-200">
              Exposure Value = Shortfall Units × Unit Valuation (£)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Indicative financial risk of unfulfilled customer orders valued at retail inventory unit value. Labelled as indicative exposure, not guaranteed revenue loss.
            </p>
          </div>
        </div>

        {/* Risk Classification Rules */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Inventory Risk Classification Tiers
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800">
              <strong>Critical Risk:</strong> Days of Cover &lt; Supplier Lead Time, or Current Stock = 0. Stockout is imminent before replenishment can arrive.
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
              <strong>High Risk:</strong> Days of Cover &lt; 1.4 × Lead Time, or stock at/below safety stock threshold. Reorder buffer severely eroded.
            </div>
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-800">
              <strong>Moderate Risk:</strong> Current stock at or below Reorder Point (ROP). Routine replenishment cycle should be initiated.
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
              <strong>Low Risk:</strong> Stock comfortably exceeds Reorder Point with balanced inventory coverage.
            </div>
          </div>
        </div>
      </div>

      {/* 2. Supplier Risk Scoring */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">
            2. Multi-Factor Supplier Risk Scoring Engine (0-100)
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The 0–100 composite risk score is an explainable heuristic decision-support measure. All component metrics are normalized in the <strong>same direction</strong>: higher values strictly indicate <strong>higher operational risk</strong>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border border-slate-200 rounded-xl">
            <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Component Factor</th>
                <th className="p-3">Weight (%)</th>
                <th className="p-3">Formula / Normalization</th>
                <th className="p-3">Business Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="p-3 font-semibold text-slate-900">On-Time Delivery Risk</td>
                <td className="p-3 font-bold text-sky-700">35%</td>
                <td className="p-3 font-mono text-[11px]">100 - Actual OTD Rate %</td>
                <td className="p-3">Calculated directly from completed purchase order delivery dates.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Delay Severity Risk</td>
                <td className="p-3 font-bold text-sky-700">20%</td>
                <td className="p-3 font-mono text-[11px]">min(100, (Avg Delay Days / 8.0) * 100)</td>
                <td className="p-3">Penalizes chronic delivery slippage past promised PO dates.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Defect & Quality Risk</td>
                <td className="p-3 font-bold text-sky-700">15%</td>
                <td className="p-3 font-mono text-[11px]">min(100, (Defect Rate % / 4.0) * 100)</td>
                <td className="p-3">Reflects receiving scrap, returns, and QA rejection rates.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Financial Vulnerability</td>
                <td className="p-3 font-bold text-sky-700">15%</td>
                <td className="p-3 font-mono text-[11px]">Direct Score (0-100)</td>
                <td className="p-3">Creditworthiness, insolvency risk, and balance sheet resilience.</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-slate-900">Inventory Concentration</td>
                <td className="p-3 font-bold text-sky-700">15%</td>
                <td className="p-3 font-mono text-[11px]">min(100, Tied Value Share % * 3.5)</td>
                <td className="p-3">Dependency penalty: disproportionate capital tied to single vendor.</td>
              </tr>
              <tr className="bg-slate-50/80 font-bold text-slate-900">
                <td className="p-3">Total Composite Weight</td>
                <td className="p-3 text-sky-700">100%</td>
                <td className="p-3" colSpan={2}>Strictly verified by automated pytest assertions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Simulation Model */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Activity className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">
            3. Disruption Simulation Engine: Discrete Daily Balance Model
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Rather than multiplying inventory by disruption duration, SupplyShield AI employs an explicit discrete daily inventory balance model:
        </p>

        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-2">
          <p className="text-sky-400"># For each day t from 1 to Disruption Duration:</p>
          <p>Available Stock(t) = max(0, Available Stock(t-1) + Approved Inbound Arrivals(t) - Scenario Daily Demand(t))</p>
          <p>Unmet Demand(t) = max(0, Scenario Daily Demand(t) - (Available Stock(t-1) + Approved Inbound Arrivals(t)))</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong>Non-Negative Inventory:</strong> Inventory on hand cannot fall below zero.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong>Unmet Demand Separation:</strong> Unfulfilled orders are recorded distinctly and do not double-count.
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong>Disrupted Vendor Lock:</strong> Open POs from affected vendors are frozen during outages.
          </div>
        </div>
      </div>

      {/* 4. Supply Chain Glossary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-sky-600" />
          <h2 className="text-base font-bold text-slate-900">
            4. Supply Chain Glossary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900">Reorder Point (ROP):</strong> The inventory level that triggers replenishment: <code className="text-sky-700">Lead Time Demand + Safety Stock</code>.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900">Safety Stock (SS):</strong> Buffer inventory held to mitigate stochastic demand variance and lead-time delays.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900">On-Time Delivery (OTD):</strong> Percentage of purchase orders delivered on or before the agreed contractual date.
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <strong className="text-slate-900">Dual Sourcing:</strong> Maintaining two qualified suppliers for critical parts to hedge against single points of failure.
          </div>
        </div>
      </div>
    </div>
  );
};
