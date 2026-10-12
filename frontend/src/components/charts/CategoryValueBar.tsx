import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { CategoryBreakdown } from '../../types';

interface Props {
  data: CategoryBreakdown[];
}

export const CategoryValueBar: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Inventory Holding Value by Category</h3>
        <p className="text-xs text-slate-500">Retail capital allocation across product categories in GBP (£)</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fontSize: 11, fill: '#475569' }}
              width={120}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CategoryBreakdown;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-800">
                      <div className="font-semibold text-slate-200">{item.category}</div>
                      <div className="mt-1 text-slate-300">
                        Total Value: £{item.total_value.toLocaleString('en-GB')}
                      </div>
                      <div className="text-slate-400">
                        Products: {item.total_products} ({item.critical_products} Critical/High)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="total_value"
              fill="#0284c7"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
