"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PerformanceVsAttendanceChartProps = {
  data: Array<{ name: string; attendance: number; performance: number }>;
};

export const PerformanceVsAttendanceChart = ({
  data,
}: PerformanceVsAttendanceChartProps) => {
  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-white/80 p-4">
      <div className="text-sm font-semibold text-[var(--ink)]">
        Performance vs attendance
      </div>
      <div className="mt-4 h-56 min-h-[14rem] w-full">
        <ResponsiveContainer width="100%" height={224}>
          <ScatterChart margin={{ top: 20, left: 0, right: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="attendance" type="number" domain={[0, 100]} />
            <YAxis dataKey="performance" type="number" domain={[0, 100]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              formatter={(value) => `${value}%`}
            />
            <Scatter data={data} fill="#0f172a" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
