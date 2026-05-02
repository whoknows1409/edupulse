import { ClassroomForm } from "@/app/admin/students/ClassroomForm";
import { StudentForm } from "@/app/admin/students/StudentForm";
import { SectionHeader } from "@/components/SectionHeader";
import { prisma } from "@/lib/prisma";

export default async function AdminStudentsPage() {
  const [students, classrooms] = await Promise.all([
    prisma.student.findMany({
      include: { user: true, classroom: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.classroom.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Students"
        subtitle="Create and manage student profiles."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Add classroom
          </h3>
          <div className="mt-4">
            <ClassroomForm />
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Add a student
          </h3>
          <div className="mt-4">
            <StudentForm classrooms={classrooms} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          Current roster
        </h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs uppercase tracking-[0.2em] text-orange-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Classroom</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-[var(--muted)]"
                    colSpan={4}
                  >
                    No students yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">
                      {student.user.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {student.user.email}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {student.studentId}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {student.classroom.name} {student.classroom.section ?? ""} (
                      {student.classroom.year})
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
