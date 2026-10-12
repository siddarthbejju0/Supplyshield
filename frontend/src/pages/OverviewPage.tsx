import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { OverviewResponse, InventoryItem, SupplierItem } from '../types';
import { NavPage } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import {
  AlertTriangle,
  Boxes,
  Truck,
  TrendingDown,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload
} from 'lucide-react';

interface Props {
  onNavigate: (page: NavPage, targetId?: string) => void;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onWorkspaceChange?: () => void;
}

export const OverviewPage: React.FC<Props> = ({ onNavigate, onToast, onWorkspaceChange }) => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    Promise.all([api.getOverview(), api.getInventory(), api.getSuppliers()])
      .then(([overviewData, invData, supData]) => {
        setData(overviewData);
        setCriticalItems(invData.items.filter((i) => i.risk_level === 'Critical' || i.risk_level === 'High').slice(0, 5));
        setSuppliers(supData.filter((s) => s.open_delayed_orders_count > 0 || s.risk_band === 'Critical' || s.risk_band === 'High').slice(0, 4));
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        onToast('error', `Failed to load dashboard: ${err.message}`);
      });
  }, []);

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      await api.loadSampleData();
      onToast('success', 'Ingested Northstar Retail datasets. Live risk analytics computed.');
      onWorkspaceChange?.();
    } catch (err: any) {
      onToast('error', `Failed to load sample: ${err.message}`);
    } finally {
      setLoadingSample(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;
  if (!data) return null;

  const { kpis } = data;

  if (kpis.total_active_products === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-xs text-center space-y-6 max-w-3xl mx-auto">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-sm">
            <Boxes className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Clean Initial State · 0 Products Loaded
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              SupplyShield Intelligence Workspace
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              Every feature is currently empty. Click the button below to load our sample dataset and watch live calculations, risk classification, stockout curves, and mitigation strategies form right in front of your eyes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleLoadSample}
              disabled={loadingSample}
              className="px-6 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md ring-4 ring-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              {loadingSample ? 'Calculating Live Models...' : 'Load Sample Data (Calculate Live Models)'}
            </button>

            <button
              onClick={() => onNavigate('data-explorer')}
              className="px-5 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Upload Company CSV File
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Clear Human Status Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Supply Chain Status: <span className="text-amber-700">Action Needed on 5 Products</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              5 high-demand products will run out of stock before replacement shipments can arrive from suppliers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Review Inventory
          </button>
          <button
            onClick={() => onNavigate('simulator')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            Simulate Disruption
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Four Big, Simple KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Warehouse Stock Value</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(kpis.total_inventory_value)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {kpis.total_active_products} active product lines ({formatNumber(kpis.total_inventory_units)} units)
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-red-200 bg-red-50/20 p-5 shadow-xs">
          <div className="text-xs font-semibold text-red-600">Stockout Risk Value</div>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {formatCurrency(kpis.estimated_inventory_exposure_value)}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Sales at risk if orders are not expedited today
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs">
          <div className="text-xs font-semibold text-amber-700">Products Running Out Soon</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {kpis.critical_or_high_risk_products} Products
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Stock will deplete before new orders arrive
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Overdue Supplier Orders</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {kpis.open_delayed_purchase_orders} Orders Late
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Historical supplier on-time rate: {formatPercent(kpis.average_supplier_on_time_rate_pct)}
          </div>
        </div>
      </div>

      {/* 3. Two Clear Action Lists: What's Running Out & Suppliers Causing Delays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1: Products running out of stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Products Running Out First
              </h3>
              <p className="text-xs text-slate-500">
                Current stock coverage is shorter than supplier delivery wait times
              </p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              View All ({kpis.total_active_products}) &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {criticalItems.map((item) => (
              <div
                key={item.product_id}
                onClick={() => onNavigate('inventory', item.product_id)}
                className="p-3 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700">
                    {item.product_name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {item.category} · Sourced from {item.supplier_name || item.supplier_id}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-red-600">
                    {item.days_of_cover} Days Stock Left
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Takes {item.lead_time_days} days to deliver
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Box 2: Suppliers Causing Delays */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Suppliers Needing Attention
              </h3>
              <p className="text-xs text-slate-500">
                Vendors with delayed orders or long overseas lead times
              </p>
            </div>
            <button
              onClick={() => onNavigate('suppliers')}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              View All Suppliers &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {suppliers.map((sup) => (
              <div
                key={sup.supplier_id}
                onClick={() => onNavigate('suppliers', sup.supplier_id)}
                className="p-3 rounded-lg border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-sky-700">
                    {sup.supplier_name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {sup.country} · Lead time: {sup.standard_lead_time_days} days
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {sup.open_delayed_orders_count > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                      {sup.open_delayed_orders_count} Overdue Order(s)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {sup.calculated_on_time_rate_pct}% On-Time
                    </span>
                  )}
                  <div className="text-[10px] text-slate-500 mt-1">
                    Risk Rating: {sup.risk_score} / 100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
