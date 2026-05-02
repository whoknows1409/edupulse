import { SubjectsForm } from "@/app/admin/subjects/SubjectsForm";
import { SectionHeader } from "@/components/SectionHeader";
import { prisma } from "@/lib/prisma";

export default async function AdminSubjectsPage() {
  const [classrooms, subjects, terms, offerings] = await Promise.all([
    prisma.classroom.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.term.findMany({ orderBy: { startDate: "desc" } }),
    prisma.subjectOffering.findMany({
      include: { subject: true, classroom: true, term: true },
      orderBy: { term: { startDate: "desc" } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Subjects & terms"
        subtitle="Manage curriculum, terms, and offerings."
      />

      <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
        <SubjectsForm
          classrooms={classrooms}
          subjects={subjects}
          terms={terms}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Subjects
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            {subjects.length === 0 ? (
              <li>No subjects yet.</li>
            ) : (
              subjects.map((subject) => (
                <li
                  key={subject.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <span className="font-medium text-[var(--ink)]">
                    {subject.name}
                  </span>
                  <span>
                    {subject.code} · {subject.credits} credits
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Offerings</h3>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            {offerings.length === 0 ? (
              <li>No offerings yet.</li>
            ) : (
              offerings.map((offering) => (
                <li
                  key={offering.id}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <div className="font-medium text-[var(--ink)]">
                    {offering.subject.name}
                  </div>
                  <div>
                    {offering.classroom.name} {offering.classroom.section ?? ""}
                    · {offering.term.name}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
