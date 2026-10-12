import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { SupplierItem } from '../types';
import { NavPage } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ArrowRight,
  ShieldAlert,
  X,
  Package,
  Truck
} from 'lucide-react';

import { EmptyState } from '../components/common/EmptyState';

interface Props {
  initialSupplierId?: string;
  onNavigate: (page: NavPage, targetId?: string) => void;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const SuppliersPage: React.FC<Props> = ({
  initialSupplierId,
  onNavigate,
  onToast,
}) => {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DELAYED' | 'RELIABLE'>('ALL');

  // Detail Modal
  const [activeSupplier, setActiveSupplier] = useState<SupplierItem | null>(null);
  const [supplierDetails, setSupplierDetails] = useState<{
    purchase_orders: any[];
    products: any[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    setLoading(true);
    api.getSuppliers()
      .then((data) => {
        setSuppliers(data);
        setLoading(false);

        if (initialSupplierId) {
          const match = data.find(
            (s) => s.supplier_id.toLowerCase() === initialSupplierId.toLowerCase()
          );
          if (match) openSupplierDrawer(match);
        }
      })
      .catch((err) => {
        setLoading(false);
        onToast('error', `Failed to load suppliers: ${err.message}`);
      });
  };

  const openSupplierDrawer = (sup: SupplierItem) => {
    setActiveSupplier(sup);
    setLoadingDetails(true);
    api.getSupplierDetail(sup.supplier_id)
      .then((res) => {
        setSupplierDetails({
          purchase_orders: res.purchase_orders,
          products: res.products,
        });
        setLoadingDetails(false);
      })
      .catch(() => {
        setSupplierDetails(null);
        setLoadingDetails(false);
      });
  };

  const filteredSuppliers = useMemo(() => {
    let list = [...suppliers];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.supplier_name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }
    if (filterType === 'DELAYED') {
      list = list.filter(
        (s) => (s.average_delay_days && s.average_delay_days > 2) || s.open_delayed_orders_count > 0 || (s.calculated_on_time_rate_pct != null && s.calculated_on_time_rate_pct < 85)
      );
    } else if (filterType === 'RELIABLE') {
      list = list.filter(
        (s) => s.calculated_on_time_rate_pct != null && s.calculated_on_time_rate_pct >= 85 && s.open_delayed_orders_count === 0
      );
    }
    return list;
  }, [suppliers, search, filterType]);

  // Overall metrics
  const avgOnTime = suppliers.length
    ? Math.round(
        suppliers.reduce((acc, s) => acc + (s.calculated_on_time_rate_pct || 90), 0) / suppliers.length
      )
    : 0;
  const totalOverdueOrders = suppliers.reduce((acc, s) => acc + s.open_delayed_orders_count, 0);
  const delayedVendorsCount = suppliers.filter(
    (s) => (s.average_delay_days && s.average_delay_days > 3) || s.open_delayed_orders_count > 0
  ).length;

  if (loading) return <LoadingSpinner message="Loading suppliers..." />;

  if (suppliers.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Suppliers Found"
          description="Your workspace currently contains 0 suppliers. Upload your suppliers CSV file to analyze delivery reliability, delays, and lead times."
          actionText="Import Suppliers CSV"
          onAction={() => onNavigate('data-explorer')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Three Clear Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Average On-Time Delivery Rate</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {avgOnTime}% On-Time
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {suppliers.length} active suppliers
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs">
          <div className="text-xs font-semibold text-amber-700">Suppliers with Chronic Delays</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {delayedVendorsCount} Vendors
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Average delivery delay exceeds 3 days
          </div>
        </div>

        <div className="bg-white rounded-xl border border-red-200 bg-red-50/20 p-5 shadow-xs">
          <div className="text-xs font-semibold text-red-600">Currently Overdue Shipments</div>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {totalOverdueOrders} Orders Late
          </div>
          <div className="text-xs text-red-600 mt-1">
            Shipments past promised delivery date
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search supplier name, country, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Vendors ({suppliers.length})
            </button>
            <button
              onClick={() => setFilterType('DELAYED')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'DELAYED' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Needs Attention ({delayedVendorsCount})
            </button>
            <button
              onClick={() => setFilterType('RELIABLE')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterType === 'RELIABLE' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Reliable ({suppliers.length - delayedVendorsCount})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Simple & Understandable Supplier Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Supplier & Country</th>
                <th className="py-3 px-3">Delivery Reliability</th>
                <th className="py-3 px-3 text-right">Average Delay</th>
                <th className="py-3 px-3 text-right">Standard Lead Time</th>
                <th className="py-3 px-3 text-right">Late Orders</th>
                <th className="py-3 px-3 text-right">Stock Value Dependent</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => {
                const onTime = s.calculated_on_time_rate_pct ?? 85;
                const isDelayed = onTime < 85 || s.open_delayed_orders_count > 0;

                return (
                  <tr
                    key={s.supplier_id}
                    onClick={() => openSupplierDrawer(s)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    {/* Supplier Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-sky-700">
                        {s.supplier_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.country} · {s.category}
                      </div>
                    </td>

                    {/* Reliability */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            onTime >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : onTime >= 80
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {onTime}% On-Time
                        </span>
                        {isDelayed && (
                          <span className="text-[11px] text-amber-700 font-medium">Delay Risk</span>
                        )}
                      </div>
                    </td>

                    {/* Average Delay */}
                    <td className="py-3.5 px-3 text-right">
                      {s.average_delay_days && s.average_delay_days > 0 ? (
                        <span className="font-bold text-amber-700">
                          +{s.average_delay_days} days late
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">On schedule (0d)</span>
                      )}
                    </td>

                    {/* Standard Lead Time */}
                    <td className="py-3.5 px-3 text-right text-slate-700 font-medium">
                      {s.standard_lead_time_days} days
                    </td>

                    {/* Overdue Orders */}
                    <td className="py-3.5 px-3 text-right">
                      {s.open_delayed_orders_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                          {s.open_delayed_orders_count} Overdue
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Tied Inventory Value */}
                    <td className="py-3.5 px-3 text-right text-slate-800 font-semibold">
                      {formatCurrency(s.tied_inventory_value)}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {s.inventory_value_share_pct}% of total stock
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSupplierDrawer(s);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Clear & Friendly Supplier Profile Modal */}
      {activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeSupplier.supplier_name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      (activeSupplier.calculated_on_time_rate_pct ?? 85) >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeSupplier.calculated_on_time_rate_pct ?? 85}% On-Time
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Located in {activeSupplier.country} · Category: {activeSupplier.category} · Standard Lead Time: {activeSupplier.standard_lead_time_days} days
                </p>
              </div>

              <button
                onClick={() => setActiveSupplier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plain English Business Summary */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 leading-relaxed">
              <span className="font-bold block mb-1">What you need to know about this supplier:</span>
              This vendor accounts for <strong>{formatCurrency(activeSupplier.tied_inventory_value)}</strong> ({activeSupplier.inventory_value_share_pct}%) of your company's inventory.
              {activeSupplier.average_delay_days && activeSupplier.average_delay_days > 2 ? (
                <span>
                  {' '}They have a historical pattern of <strong>{activeSupplier.average_delay_days}-day delays</strong>. If their shipments are disrupted, high-demand items will run out before replacements arrive.
                </span>
              ) : (
                <span>
                  {' '}They have a steady delivery track record with minimal delays. Standard shipments take <strong>{activeSupplier.standard_lead_time_days} days</strong> to arrive.
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const sId = activeSupplier.supplier_id;
                  setActiveSupplier(null);
                  onNavigate('simulator', sId);
                }}
                className="p-3 rounded-xl border border-sky-200 bg-sky-50/50 hover:bg-sky-100/80 transition-colors text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-sky-600" />
                    Simulate Disruption
                  </div>
                  <div className="text-[11px] text-sky-700 mt-0.5">
                    See what happens if this supplier is delayed by 14 days
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  setActiveSupplier(null);
                  onNavigate('mitigation');
                }}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-600" />
                    Find Backup / Action Plan
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Compare air shipping vs switching to local UK backup
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Products Sourced from this Supplier */}
            {supplierDetails && supplierDetails.products && supplierDetails.products.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Products Supplied ({supplierDetails.products.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[10px] font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Product SKU</th>
                        <th className="py-2.5 px-3 text-right">Stock On Hand</th>
                        <th className="py-2.5 px-3 text-right">Daily Demand</th>
                        <th className="py-2.5 px-3 text-right">Stock Lasts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {supplierDetails.products.map((p: any) => (
                        <tr key={p.product_id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {p.product_name}
                            <span className="text-[10px] text-slate-400 block font-mono">{p.product_id}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">{p.current_stock_units} units</td>
                          <td className="py-2.5 px-3 text-right">{p.average_daily_demand_units} / day</td>
                          <td className="py-2.5 px-3 text-right font-bold text-red-600">
                            {p.days_of_cover ? `${p.days_of_cover} days` : '0 days'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
