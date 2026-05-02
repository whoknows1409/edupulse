import { AttendanceDistributionChart } from "@/components/charts/AttendanceDistributionChart";
import { PerformanceBySubjectChart } from "@/components/charts/PerformanceBySubjectChart";
import { PerformanceVsAttendanceChart } from "@/components/charts/PerformanceVsAttendanceChart";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminDashboard() {
  const data = await getAdminDashboardData();
  const distribution = Object.entries(data.attendanceDistribution).map(
    ([range, count]) => ({ range, count })
  );

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Command center"
        subtitle={`Active term: ${data.term?.name ?? "No active term"}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total students"
          value={data.studentCount}
          accent="orange"
        />
        <StatCard label="Subjects" value={data.subjectCount} accent="blue" />
        <StatCard
          label="Correlation"
          value={
            data.correlation === null
              ? "N/A"
              : data.correlation.toFixed(2)
          }
          hint="Attendance vs performance"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PerformanceBySubjectChart data={data.subjectPerformance} />
        <AttendanceDistributionChart data={distribution} />
        <PerformanceVsAttendanceChart
          data={data.studentStats.map((row) => ({
            name: row.name,
            attendance: row.attendancePercent,
            performance: row.performancePercent,
          }))}
        />
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <SectionHeader
          title="Low attendance watchlist"
          subtitle={`Below ${process.env.ATTENDANCE_LOW_THRESHOLD ?? "75"}%`}
        />
        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs uppercase tracking-[0.2em] text-orange-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.lowAttendance.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-[var(--muted)]"
                    colSpan={4}
                  >
                    No students below threshold.
                  </td>
                </tr>
              ) : (
                data.lowAttendance.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.classroom}
                    </td>
                    <td className="px-4 py-3 text-orange-600">
                      {row.attendancePercent}%
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.performancePercent}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
