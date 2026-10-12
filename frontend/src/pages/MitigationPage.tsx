import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  MitigationComparisonResponse,
  InventoryItem,
  MitigationStrategyOption
} from '../types';
import { NavPage } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Truck,
  Download,
  Send,
  Boxes,
  ArrowRight
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

interface Props {
  initialProductId?: string;
  onNavigate: (page: NavPage, targetId?: string) => void;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const MitigationPage: React.FC<Props> = ({
  initialProductId,
  onNavigate,
  onToast,
}) => {
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('SKU-ELC-002');
  const [comparison, setComparison] = useState<MitigationComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeStrategyKey, setActiveStrategyKey] = useState<string>('');

  useEffect(() => {
    api.getInventory()
      .then((data) => {
        setProducts(data.items);
        const pId = initialProductId || 'SKU-ELC-002';
        setSelectedProductId(pId);
        
        const matched = data.items.find((i) => i.product_id === pId);
        const initShortage = matched ? Math.max(50, matched.stockout_shortfall_units || 450) : 450;

        runComparison(pId, initShortage, 14);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        onToast('error', `Failed to load inventory: ${err.message}`);
      });
  }, [initialProductId]);

  const runComparison = (pId: string, shortage: number, days: number) => {
    setCalculating(true);
    api.compareMitigation({
      product_id: pId,
      shortage_units: shortage,
      disruption_duration_days: days,
      custom_expedite_premium_pct: 8.50,
    })
      .then((res) => {
        setComparison(res);
        setCalculating(false);
        setActiveStrategyKey(res.recommended_strategy_key);
      })
      .catch((err) => {
        setCalculating(false);
        onToast('error', `Mitigation calculation error: ${err.message}`);
      });
  };

  const handleProductChange = (newPid: string) => {
    setSelectedProductId(newPid);
    const matched = products.find((i) => i.product_id === newPid);
    const newShortage = matched ? Math.max(50, matched.stockout_shortfall_units || 300) : 300;
    runComparison(newPid, newShortage, 14);
  };

  const handleExportPlan = () => {
    if (!comparison) return;
    const selected = comparison.options.find((o) => o.strategy_key === activeStrategyKey) || comparison.options[0];
    const headers = ['Product ID', 'Product Name', 'Strategy', 'Cost (£)', 'Delivery Days', 'Units Saved', 'Risk Value Protected (£)'];
    const row = [
      comparison.product_id,
      `"${comparison.product_name}"`,
      `"${selected.strategy_name}"`,
      selected.incremental_cost,
      selected.replenishment_time_days,
      selected.units_covered,
      comparison.shortage_value_at_risk,
    ];
    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Action_Plan_${comparison.product_id}.csv`;
    link.click();
    onToast('success', 'Exported Action Plan to CSV');
  };

  const handleNotifyTeam = () => {
    onToast('success', 'Plan confirmed! Notification alert sent to procurement and logistics team.');
  };

  if (loading) return <LoadingSpinner message="Loading mitigation planner..." />;

  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Products Available for Mitigation Planning"
          description="Your workspace currently contains 0 items. Upload your product catalog and inventory CSV to evaluate express freight vs backup suppliers."
          actionText="Import Products"
          onAction={() => onNavigate('data-explorer')}
        />
      </div>
    );
  }

  if (!comparison) return null;

  const currentProduct = products.find((p) => p.product_id === selectedProductId);
  const selectedStrategy = comparison.options.find((o) => o.strategy_key === activeStrategyKey) || comparison.options[0];

  return (
    <div className="space-y-6">
      {/* 1. Step 1: Target Product Selection & Shortfall Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
              Step 1: Choose the Product with a Supply Shortage
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any inventory item to evaluate emergency response options and protect sales.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full sm:w-80 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name} ({p.product_id}) · {p.risk_level} Risk
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Situation Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Current Stock on Hand</span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">
              {formatNumber(comparison.current_stock)} Units
            </div>
            <span className="text-[11px] text-slate-500">
              {currentProduct?.days_of_cover ? `Lasts only ${currentProduct.days_of_cover} days` : 'Depleted'}
            </span>
          </div>

          <div>
            <span className="text-xs text-amber-700 font-medium block">Projected Shortfall Gap</span>
            <div className="text-xl font-bold text-amber-800 mt-0.5">
              {formatNumber(comparison.projected_shortage_units)} Units Short
            </div>
            <span className="text-[11px] text-amber-700">
              Customer orders unable to be filled
            </span>
          </div>

          <div>
            <span className="text-xs text-red-600 font-medium block">Customer Revenue at Risk</span>
            <div className="text-xl font-bold text-red-700 mt-0.5">
              {formatCurrency(comparison.shortage_value_at_risk)}
            </div>
            <span className="text-[11px] text-red-600">
              Valued at {formatCurrency(comparison.unit_value)} per unit
            </span>
          </div>
        </div>
      </div>

      {/* 2. Step 2: Clear Solution Cards Side-by-Side */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Step 2: Compare Your 4 Response Options
            </h3>
            <p className="text-xs text-slate-500">
              Click any card to select it as your approved mitigation plan.
            </p>
          </div>
          {calculating && (
            <span className="text-xs text-sky-600 font-medium animate-pulse">
              Recalculating live options...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparison.options.map((opt) => {
            const isRecommended = opt.strategy_key === comparison.recommended_strategy_key;
            const isSelected = opt.strategy_key === activeStrategyKey;

            return (
              <div
                key={opt.strategy_key}
                onClick={() => setActiveStrategyKey(opt.strategy_key)}
                className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/20 shadow-md ring-2 ring-sky-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Badges */}
                <div className="flex items-center justify-between gap-1 mb-3">
                  {isRecommended ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Recommended
                    </span>
                  ) : opt.incremental_cost === 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                      Do Nothing
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Alternative
                    </span>
                  )}

                  {isSelected && (
                    <span className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>

                {/* Strategy Title */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {opt.strategy_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {opt.description}
                  </p>
                </div>

                {/* Key Numbers */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Extra Cost:</span>
                    <span className={`font-bold ${opt.incremental_cost === 0 ? 'text-slate-700' : 'text-slate-900'}`}>
                      {opt.incremental_cost === 0 ? '£0 (Free)' : `+${formatCurrency(opt.incremental_cost)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Delivery Time:</span>
                    <span className="font-semibold text-slate-800">
                      {opt.replenishment_time_days} Days
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Units Protected:</span>
                    <span className={`font-bold ${opt.units_covered > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatNumber(opt.units_covered)} / {formatNumber(comparison.projected_shortage_units)}
                    </span>
                  </div>
                </div>

                {/* Feasibility Note */}
                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  {opt.feasibility_notes}
                </div>

                {/* Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStrategyKey(opt.strategy_key);
                  }}
                  className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? 'Plan Selected' : 'Choose This Plan'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Step 3: Executive Summary & Execution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                Approved Plan
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {selectedStrategy.strategy_name}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              {comparison.recommendation_rationale}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPlan}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Download Plan (CSV)
            </button>

            <button
              onClick={handleNotifyTeam}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              Confirm & Alert Logistics
            </button>
          </div>
        </div>

        {/* Trade-off Summary Table */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Implementation Cost</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(selectedStrategy.incremental_cost)}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Lead Time to Warehouse</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {selectedStrategy.replenishment_time_days} Days
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-700 font-medium">Customer Units Saved</span>
            <div className="text-base font-bold text-emerald-800 mt-0.5">
              {formatNumber(selectedStrategy.units_covered)} Units
            </div>
          </div>

          <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200">
            <span className="text-[11px] text-sky-700 font-medium">Protected Revenue</span>
            <div className="text-base font-bold text-sky-900 mt-0.5">
              {formatCurrency(
                (selectedStrategy.units_covered / Math.max(1, comparison.projected_shortage_units)) *
                  comparison.shortage_value_at_risk
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
