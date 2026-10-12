import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SimulationResponse, SupplierItem, InventoryItem } from '../types';
import { NavPage } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TrajectoryChart } from '../components/charts/TrajectoryChart';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  Play,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface Props {
  initialTargetId?: string;
  onNavigate: (page: NavPage, targetId?: string) => void;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const SimulatorPage: React.FC<Props> = ({
  initialTargetId,
  onNavigate,
  onToast,
}) => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Scenario inputs
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('SUP006');
  const [disruptionDays, setDisruptionDays] = useState<number>(14);
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.10);

  // Results
  const [result, setResult] = useState<SimulationResponse | null>(null);

  useEffect(() => {
    Promise.all([api.getSuppliers(), api.getInventory()])
      .then(([supList, invData]) => {
        setSuppliers(supList);
        setProducts(invData.items);
        setLoading(false);

        let supId = 'SUP006';
        if (initialTargetId) {
          if (initialTargetId.startsWith('SUP')) supId = initialTargetId;
          else if (initialTargetId.startsWith('SKU')) {
            const pMatch = invData.items.find((i) => i.product_id === initialTargetId);
            if (pMatch) supId = pMatch.supplier_id;
          }
        }
        setSelectedSupplierId(supId);
        executeSimulation(supId, 14, 1.10);
      })
      .catch((err) => {
        setLoading(false);
        onToast('error', `Failed to load simulation: ${err.message}`);
      });
  }, [initialTargetId]);

  const executeSimulation = (supId: string, days: number, mult: number) => {
    setSimulating(true);
    api.runSimulation({
      supplier_id: supId,
      disruption_duration_days: days,
      demand_multiplier: mult,
      stock_reduction_pct: 0.0,
      allow_open_po_arrivals: false,
    })
      .then((res) => {
        setResult(res);
        setSimulating(false);
      })
      .catch((err) => {
        setSimulating(false);
        onToast('error', `Simulation failed: ${err.message}`);
      });
  };

  const handleSimulate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSimulation(selectedSupplierId, disruptionDays, demandMultiplier);
    onToast('success', 'Simulation computed successfully.');
  };

  if (loading) return <LoadingSpinner message="Loading disruption simulator..." />;

  if (suppliers.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Suppliers or Products to Simulate"
          description="Your workspace contains 0 catalog records. Upload your supplier and inventory files to model factory shutdowns and calculate stockout timelines."
          actionText="Import Catalog Data"
          onAction={() => onNavigate('data-explorer')}
        />
      </div>
    );
  }

  const activeSupplier = suppliers.find((s) => s.supplier_id === selectedSupplierId) || suppliers[0];

  return (
    <div className="space-y-6">
      {/* Step 1: Simple Scenario Builder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Step 1: Set Up Your Disruption Scenario
          </h2>
          <p className="text-xs text-slate-500">
            Pick a supplier to simulate an outage and see when warehouse stock depletes.
          </p>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Supplier Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Which Supplier Shuts Down?
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {suppliers.map((s) => (
                <option key={s.supplier_id} value={s.supplier_id}>
                  {s.supplier_name} ({s.country} · {s.standard_lead_time_days}d Lead Time)
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Simulates no shipments leaving this factory.
            </p>
          </div>

          {/* Disruption Duration Buttons */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              How Long is the Disruption?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDisruptionDays(d)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    disruptionDays === d
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently testing: {disruptionDays} days outage.
            </p>
          </div>

          {/* Demand Surge */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Customer Demand Spike
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Normal (1x)', val: 1.0 },
                { label: '+10% Surge', val: 1.10 },
                { label: '+30% Surge', val: 1.30 },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setDemandMultiplier(opt.val)}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    demandMultiplier === opt.val
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Simulates spikes in shopping demand.
            </p>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="px-6 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg shadow-xs transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {simulating ? 'Calculating Impact...' : 'Simulate Impact Now'}
          </button>
        </div>
      </div>

      {/* Step 2: Clear Outcome Cards */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Box 1 */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-bold text-red-600 uppercase">
                Stockout Occurrence
              </div>
              <div className="text-2xl font-black text-red-700 mt-1">
                {result.products_stocking_out_count > 0
                  ? `${result.products_stocking_out_count} Products Stockout`
                  : 'Zero Stockouts (Safe)'}
              </div>
              <p className="text-xs text-red-700 mt-1">
                {result.products_stocking_out_count > 0
                  ? `Earliest stockout on Day ${result.product_results[0]?.days_until_stockout || 'N/A'}`
                  : 'Current warehouse inventory covers the full outage'}
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Lost Sales Quantity
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatNumber(result.total_unmet_units)} Units
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customer orders that cannot be fulfilled
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-500 uppercase">
                Financial Impact
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatCurrency(result.total_unmet_value)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estimated lost retail sales revenue
              </p>
            </div>
          </div>

          {/* Step 3: Trajectory Visual Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Daily Stock Depletion vs Unmet Customer Demand
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Watch how warehouse stock on hand (amber) drops each day until stockouts generate unfulfilled demand (red).
            </p>
            <TrajectoryChart data={result.aggregated_trajectory} />
          </div>

          {/* Step 4: Resolution Box */}
          {result.product_results.length > 0 && result.product_results[0].stocks_out_during_scenario && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-sky-950">
                  Ready to Fix This Disruption?
                </h4>
                <p className="text-xs text-sky-800 mt-0.5">
                  See how express air freight, a backup supplier, or warehouse transfers can prevent this stockout.
                </p>
              </div>

              <button
                onClick={() => onNavigate('mitigation', result.product_results[0].product_id)}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                Open Mitigation Planner
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
