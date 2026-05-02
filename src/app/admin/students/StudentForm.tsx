"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createStudentAction } from "@/app/admin/actions";

type ClassroomOption = {
  id: string;
  name: string;
  section: string | null;
  year: number;
};

type StudentFormProps = {
  classrooms: ClassroomOption[];
};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--ink)] px-5 py-2 text-xs font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
    >
      {pending ? "Saving..." : "Create student"}
    </button>
  );
};

export const StudentForm = ({ classrooms }: StudentFormProps) => {
  const [state, action] = useActionState(createStudentAction, {});

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Full name
        <input
          name="name"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Student ID
        <input
          name="studentId"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Enrollment year
        <input
          name="enrollmentYear"
          type="number"
          required
          defaultValue={2024}
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Classroom
        <select
          name="classroomId"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select classroom</option>
          {classrooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} {room.section ? `(${room.section})` : ""} - {room.year}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Temporary password
        <input
          name="password"
          type="password"
          required
          defaultValue="Student@123"
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </label>

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
