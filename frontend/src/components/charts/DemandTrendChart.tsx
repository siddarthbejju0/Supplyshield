import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DemandPoint {
  date: string;
  units_sold: number;
  demand_forecast_units: number;
}

interface Props {
  data: DemandPoint[];
  title?: string;
  subtitle?: string;
}

export const DemandTrendChart: React.FC<Props> = ({
  data,
  title = '90-Day Demand History vs Forecast',
  subtitle = 'Observed sales units compared against model demand forecast'
}) => {
  // Sample every 3rd point if 90 days to avoid label congestion
  const sampledData = data.filter((_, idx) => idx % 2 === 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampledData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => d.slice(5)} // MM-DD
              tick={{ fontSize: 10, fill: '#64748b' }}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-800">
                      <div className="font-semibold text-slate-300">{label}</div>
                      <div className="mt-1 text-sky-400">
                        Actual Sold: {payload[0].value} units
                      </div>
                      <div className="text-slate-400">
                        Forecast: {payload[1]?.value} units
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
            <Line
              type="monotone"
              dataKey="units_sold"
              name="Actual Units Sold"
              stroke="#0284c7"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="demand_forecast_units"
              name="Forecast Demand"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
