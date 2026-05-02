import { AttendanceBySubjectChart } from "@/components/charts/AttendanceBySubjectChart";
import { PerformanceBySubjectChart } from "@/components/charts/PerformanceBySubjectChart";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { getStudentDashboardData } from "@/lib/data";
import { requireRole } from "@/lib/access";

export default async function StudentDashboard() {
  const session = await requireRole("STUDENT");
  const data = await getStudentDashboardData(session.user.id);

  if (!data) {
    return (
      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6">
        <SectionHeader
          title="Student record not found"
          subtitle="Contact your administrator to finish enrollment."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title={`Welcome back, ${data.student.user.name.split(" ")[0]}`}
        subtitle={`Active term: ${data.term?.name ?? "No active term"}`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Overall performance"
          value={`${data.overallPercent}%`}
          accent="blue"
        />
        <StatCard label="GPA" value={data.gpa.toFixed(2)} accent="orange" />
        <StatCard
          label="Attendance"
          value={`${data.attendanceSummary.percent}%`}
          hint={`${data.attendanceSummary.present}/${data.attendanceSummary.total} classes`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceBySubjectChart
          data={data.subjectPerformance.map((row) => ({
            subject: row.subject,
            average: row.percent,
          }))}
        />
        <AttendanceBySubjectChart data={data.attendanceSeries} />
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <SectionHeader
          title="Subject results"
          subtitle="Detailed breakdown of your scores."
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs uppercase tracking-[0.2em] text-orange-600">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Percent</th>
                <th className="px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.subjectPerformance.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-sm text-[var(--muted)]"
                  >
                    No results yet.
                  </td>
                </tr>
              ) : (
                data.subjectPerformance.map((row) => (
                  <tr key={row.subject} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">
                      {row.subject}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.score}/{row.maxScore}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.percent}%
                    </td>
                    <td className="px-4 py-3 text-orange-600">
                      {row.letter} ({row.gradePoint})
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
