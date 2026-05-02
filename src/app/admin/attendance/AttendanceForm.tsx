"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recordAttendanceAction } from "@/app/admin/actions";

type StudentOption = { id: string; name: string };

type OfferingOption = {
  id: string;
  label: string;
};

type AttendanceFormProps = {
  students: StudentOption[];
  offerings: OfferingOption[];
};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save attendance"}
    </button>
  );
};

export const AttendanceForm = ({ students, offerings }: AttendanceFormProps) => {
  const [state, action] = useActionState(recordAttendanceAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <select
        name="studentId"
        required
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      >
        <option value="">Select student</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>
      <select
        name="offeringId"
        required
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      >
        <option value="">Select subject offering</option>
        {offerings.map((offering) => (
          <option key={offering.id} value={offering.id}>
            {offering.label}
          </option>
        ))}
      </select>
      <input
        name="date"
        type="date"
        required
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      />
      <select
        name="status"
        required
        defaultValue="PRESENT"
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      >
        <option value="PRESENT">Present</option>
        <option value="ABSENT">Absent</option>
        <option value="EXCUSED">Excused</option>
      </select>

      <div className="md:col-span-2 flex items-center gap-4">
        <SubmitButton />
        {state?.error ? (
          <span className="text-xs text-orange-600">{state.error}</span>
        ) : null}
        {state?.success ? (
          <span className="text-xs text-emerald-600">{state.success}</span>
        ) : null}
      </div>
    </form>
  );
};
