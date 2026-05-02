import { AttendanceForm } from "@/app/admin/attendance/AttendanceForm";
import { SectionHeader } from "@/components/SectionHeader";
import { prisma } from "@/lib/prisma";

export default async function AdminAttendancePage() {
  const [students, offerings, recentAttendance] = await Promise.all([
    prisma.student.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.subjectOffering.findMany({
      include: { subject: true, classroom: true, term: true },
      orderBy: { term: { startDate: "desc" } },
    }),
    prisma.attendance.findMany({
      include: {
        student: { include: { user: true } },
        offering: { include: { subject: true } },
      },
      orderBy: { date: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Attendance"
        subtitle="Track attendance by date and subject."
      />

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <AttendanceForm
          students={students.map((student) => ({
            id: student.id,
            name: student.user.name,
          }))}
          offerings={offerings.map((offering) => ({
            id: offering.id,
            label: `${offering.subject.name} · ${offering.classroom.name} ${
              offering.classroom.section ?? ""
            } (${offering.term.name})`,
          }))}
        />
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          Recent attendance
        </h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs uppercase tracking-[0.2em] text-orange-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendance.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-sm text-[var(--muted)]"
                  >
                    No attendance yet.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">
                      {row.student.user.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.offering.subject.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {row.date.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-orange-600">
                      {row.status}
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
