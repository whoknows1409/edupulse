"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  createOfferingAction,
  createSubjectAction,
  createTermAction,
} from "@/app/admin/actions";

type Option = {
  id: string;
  name: string;
};

type ClassroomOption = Option & { section: string | null; year: number };

type SubjectsFormProps = {
  classrooms: ClassroomOption[];
  subjects: Option[];
  terms: Option[];
};

const SubmitButton = ({ label }: { label: string }) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
    >
      {pending ? "Saving..." : label}
    </button>
  );
};

export const SubjectsForm = ({
  classrooms,
  subjects,
  terms,
}: SubjectsFormProps) => {
  const [subjectState, subjectAction] = useActionState(createSubjectAction, {});
  const [termState, termAction] = useActionState(createTermAction, {});
  const [offeringState, offeringAction] = useActionState(createOfferingAction, {});

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form action={subjectAction} className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-[var(--ink)]">New subject</h4>
        <input
          name="code"
          placeholder="Code"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <input
          name="name"
          placeholder="Subject name"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <input
          name="credits"
          type="number"
          placeholder="Credits"
          defaultValue={3}
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <SubmitButton label="Add subject" />
          {subjectState?.error ? (
            <span className="text-xs text-orange-600">
              {subjectState.error}
            </span>
          ) : null}
          {subjectState?.success ? (
            <span className="text-xs text-emerald-600">
              {subjectState.success}
            </span>
          ) : null}
        </div>
      </form>

      <form action={termAction} className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-[var(--ink)]">New term</h4>
        <input
          name="name"
          placeholder="Term name"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <input
          name="startDate"
          type="date"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <input
          name="endDate"
          type="date"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <input type="checkbox" name="isActive" />
          Set as active term
        </label>
        <div className="flex items-center gap-3">
          <SubmitButton label="Add term" />
          {termState?.error ? (
            <span className="text-xs text-orange-600">{termState.error}</span>
          ) : null}
          {termState?.success ? (
            <span className="text-xs text-emerald-600">{termState.success}</span>
          ) : null}
        </div>
      </form>

      <form action={offeringAction} className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-[var(--ink)]">
          Create offering
        </h4>
        <select
          name="subjectId"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
        <select
          name="classroomId"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select classroom</option>
          {classrooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} {room.section ? `(${room.section})` : ""} - {room.year}
            </option>
          ))}
        </select>
        <select
          name="termId"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select term</option>
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          <SubmitButton label="Add offering" />
          {offeringState?.error ? (
            <span className="text-xs text-orange-600">
              {offeringState.error}
            </span>
          ) : null}
          {offeringState?.success ? (
            <span className="text-xs text-emerald-600">
              {offeringState.success}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
};
