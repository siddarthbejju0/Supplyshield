import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DailyTrajectoryPoint } from '../../types';

interface Props {
  data: DailyTrajectoryPoint[];
  title?: string;
  subtitle?: string;
}

export const TrajectoryChart: React.FC<Props> = ({
  data,
  title = 'Inventory Trajectory Simulation & Unmet Demand',
  subtitle = 'Daily stock balance under scenario disruption vs undisturbed baseline'
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tickFormatter={(d) => `Day ${d}`}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as DailyTrajectoryPoint;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-800 space-y-1">
                      <div className="font-semibold text-slate-200">Day {label} ({pt.date})</div>
                      <div className="text-sky-400">
                        Baseline Stock: {pt.baseline_stock.toLocaleString()} units
                      </div>
                      <div className="text-amber-400">
                        Scenario Stock: {pt.scenario_stock.toLocaleString()} units
                      </div>
                      <div className="text-red-400 font-semibold border-t border-slate-700/60 pt-1 mt-1">
                        Cumulative Unmet: {pt.cumulative_unmet_units.toLocaleString()} units
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
            <Area
              type="monotone"
              dataKey="scenario_stock"
              name="Scenario Stock on Hand"
              stroke="#f59e0b"
              fill="#fef3c7"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="baseline_stock"
              name="Baseline Stock (No Disruption)"
              stroke="#0284c7"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cumulative_unmet_units"
              name="Cumulative Unmet Demand"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
