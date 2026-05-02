import { ResultsForm } from "@/app/admin/results/ResultsForm";
import { SectionHeader } from "@/components/SectionHeader";
import { prisma } from "@/lib/prisma";

export default async function AdminResultsPage() {
  const [students, offerings, recentResults] = await Promise.all([
    prisma.student.findMany({
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.subjectOffering.findMany({
      include: { subject: true, classroom: true, term: true },
      orderBy: { term: { startDate: "desc" } },
    }),
    prisma.result.findMany({
      include: {
        student: { include: { user: true } },
        offering: { include: { subject: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Results"
        subtitle="Capture marks and grade points."
      />

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <ResultsForm
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
          Recent updates
        </h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-orange-50 text-xs uppercase tracking-[0.2em] text-orange-600">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {recentResults.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-sm text-[var(--muted)]"
                  >
                    No results yet.
                  </td>
                </tr>
              ) : (
                recentResults.map((result) => (
                  <tr key={result.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">
                      {result.student.user.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {result.offering.subject.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {result.score}/{result.maxScore}
                    </td>
                    <td className="px-4 py-3 text-orange-600">
                      {result.letterGrade} ({result.gradePoint})
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
