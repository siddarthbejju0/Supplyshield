import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { RiskDistribution } from '../../types';

interface Props {
  data: RiskDistribution[];
}

const COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Moderate: '#0ea5e9',
  Low: '#10b981',
};

export const RiskDistributionPie: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Inventory Risk Distribution</h3>
        <p className="text-xs text-slate-500">Classification of 24 active retail SKUs by days-of-cover vulnerability</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="risk_level"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.risk_level}
                  fill={COLORS[entry.risk_level] || '#94a3b8'}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as RiskDistribution;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-800">
                      <div className="font-semibold text-slate-200">{item.risk_level} Risk</div>
                      <div className="mt-1 text-slate-300">
                        {item.count} Products ({item.percentage}%)
                      </div>
                      <div className="text-slate-400">
                        Total Value: £{item.total_value.toLocaleString('en-GB')}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
