import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { InventoryItem } from '../types';
import { NavPage } from '../components/layout/Sidebar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency, formatDays, formatNumber } from '../utils/formatters';
import {
  Search,
  Download,
  AlertTriangle,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { EmptyState } from '../components/common/EmptyState';

interface Props {
  initialProductId?: string;
  onNavigate: (page: NavPage, targetId?: string) => void;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const InventoryPage: React.FC<Props> = ({
  initialProductId,
  onNavigate,
  onToast,
}) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [activeProduct, setActiveProduct] = useState<InventoryItem | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getInventory()
      .then((data) => {
        setItems(data.items);
        setLoading(false);
        if (initialProductId) {
          const match = data.items.find(
            (i) => i.product_id.toLowerCase() === initialProductId.toLowerCase()
          );
          if (match) setActiveProduct(match);
        }
      })
      .catch((err) => {
        setLoading(false);
        onToast('error', `Failed to load inventory: ${err.message}`);
      });
  }, [initialProductId]);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.product_name.toLowerCase().includes(q) ||
          i.product_id.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (filterRisk !== 'ALL') {
      result = result.filter((i) => i.risk_level === filterRisk);
    }
    return result;
  }, [items, search, filterRisk]);

  const exportCsv = () => {
    const headers = ['Product ID', 'Product Name', 'Category', 'Stock Units', 'Daily Demand', 'Days Stock Lasts', 'Supplier Lead Time Days', 'Risk Status'];
    const rows = filteredItems.map((i) => [
      i.product_id,
      `"${i.product_name}"`,
      i.category,
      i.current_stock_units,
      i.average_daily_demand_units,
      i.days_of_cover ?? 'N/A',
      i.lead_time_days,
      i.risk_level,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventory_Stock_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    onToast('success', 'Exported inventory list to CSV');
  };

  if (loading) return <LoadingSpinner message="Loading inventory..." />;

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="No Inventory Items Found"
          description="Your workspace currently contains 0 products. Upload your inventory CSV file to calculate days of cover, demand run-rates, and lead-time risks."
          actionText="Import Inventory CSV"
          onAction={() => onNavigate('data-explorer')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Simple Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterRisk('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterRisk === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setFilterRisk('Critical')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterRisk === 'Critical' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilterRisk('High')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterRisk === 'High' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              High Risk
            </button>
            <button
              onClick={() => setFilterRisk('Low')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterRisk === 'Low' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Safe
            </button>
          </div>
        </div>

        <button
          onClick={exportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          Export CSV ({filteredItems.length})
        </button>
      </div>

      {/* Simplified, Understandable Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3 text-right">Stock on Hand</th>
                  <th className="py-3 px-3 text-right">Daily Sales Rate</th>
                  <th className="py-3 px-3 text-right">Stock Lasts For</th>
                  <th className="py-3 px-3 text-right">Supplier Delivery Time</th>
                  <th className="py-3 px-3 text-center">Health Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isCritical = item.days_of_cover != null && item.days_of_cover < item.lead_time_days;
                  return (
                    <tr
                      key={item.product_id}
                      onClick={() => setActiveProduct(item)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-sky-700">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.product_id} · {item.category}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {formatNumber(item.current_stock_units)} units
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {item.average_daily_demand_units} units / day
                      </td>

                      <td className="py-3 px-3 text-right font-bold">
                        <span className={isCritical ? 'text-red-600' : 'text-slate-800'}>
                          {formatDays(item.days_of_cover)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        {item.lead_time_days} days wait
                      </td>

                      <td className="py-3 px-3 text-center">
                        {item.risk_level === 'Critical' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            Critical Shortage
                          </span>
                        ) : item.risk_level === 'High' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Near Safety Buffer
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProduct(item);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
                        >
                          Inspect &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Crystal Clear Product Detail Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeProduct.product_name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: {activeProduct.product_id} · Supplier: {activeProduct.supplier_name || activeProduct.supplier_id}
                </p>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plain English Story Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                Plain English Inventory Assessment:
              </h4>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>
                  You have <strong>{activeProduct.current_stock_units} units</strong> in the warehouse right now.
                </li>
                <li>
                  Customers buy an average of <strong>{activeProduct.average_daily_demand_units} units per day</strong>.
                </li>
                <li>
                  Your current stock will last for <strong>{formatDays(activeProduct.days_of_cover)}</strong>.
                </li>
                <li>
                  Your supplier requires <strong>{activeProduct.lead_time_days} days</strong> to manufacture and deliver new stock.
                </li>
                {activeProduct.days_of_cover != null && activeProduct.days_of_cover < activeProduct.lead_time_days ? (
                  <li className="text-red-700 font-bold">
                    [Shortage Alert] Your stock runs out {(activeProduct.lead_time_days - activeProduct.days_of_cover).toFixed(1)} days before new stock can arrive. You have an estimated {formatCurrency(activeProduct.stockout_exposure_value)} in sales at risk.
                  </li>
                ) : (
                  <li className="text-emerald-700 font-semibold">
                    [Adequate Coverage] Your stock easily covers the supplier wait time.
                  </li>
                )}
              </ul>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl text-xs text-sky-900">
              <strong>Action to Take: </strong>
              <span>{activeProduct.recommended_action}</span>
            </div>

            {/* Next Step Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  const pId = activeProduct.product_id;
                  setActiveProduct(null);
                  onNavigate('simulator', pId);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Simulate Disruption on this Item
              </button>
              <button
                onClick={() => {
                  const pId = activeProduct.product_id;
                  setActiveProduct(null);
                  onNavigate('mitigation', pId);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-2xs"
              >
                Find Solution in Mitigation Planner &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
