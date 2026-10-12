import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { SupplierItem } from '../../types';

interface Props {
  data: SupplierItem[];
}

export const SupplierLeadTimeChart: React.FC<Props> = ({ data }) => {
  const chartData = data.map((s) => ({
    name: s.supplier_name.split(' ')[0], // short name
    standard: s.standard_lead_time_days,
    actual: s.average_actual_lead_time_days || s.standard_lead_time_days,
    fullName: s.supplier_name,
  }));

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Lead-Time Variance (Quoted vs Actual)</h3>
        <p className="text-xs text-slate-500">Comparison of contractual lead times vs observed delivery latency in days</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              angle={-25}
              textAnchor="end"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
            />
            <YAxis
              unit="d"
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-800">
                      <div className="font-semibold text-slate-200">{item.fullName}</div>
                      <div className="mt-1 text-slate-300">
                        Quoted Lead Time: {item.standard} days
                      </div>
                      <div className="text-sky-400">
                        Actual Observed: {item.actual} days
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Bar dataKey="standard" name="Quoted Lead Time (Days)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual Observed Lead Time" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
