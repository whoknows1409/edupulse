"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AttendanceBySubjectChartProps = {
  data: Array<{ subject: string; percent: number }>;
};

export const AttendanceBySubjectChart = ({
  data,
}: AttendanceBySubjectChartProps) => {
  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-white/80 p-4">
      <div className="text-sm font-semibold text-[var(--ink)]">
        Attendance by subject
      </div>
      <div className="mt-4 h-56 min-h-[14rem] w-full">
        <ResponsiveContainer width="100%" height={224}>
          <BarChart data={data} margin={{ top: 20, left: 0, right: 12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="subject" tick={{ fontSize: 12 }} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            />
            <Bar dataKey="percent" fill="#ff7a18" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
