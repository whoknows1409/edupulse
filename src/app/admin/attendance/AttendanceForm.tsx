"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  bulkMarkAttendanceAction,
  importAttendanceAction,
  recordAttendanceAction,
} from "@/app/admin/actions";

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

const ImportButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
    >
      {pending ? "Importing..." : "Import attendance"}
    </button>
  );
};

const BulkButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
    >
      {pending ? "Applying..." : "Mark all present"}
    </button>
  );
};

export const AttendanceForm = ({ students, offerings }: AttendanceFormProps) => {
  const [state, action] = useActionState(recordAttendanceAction, {});
  const [bulkState, bulkAction] = useActionState(
    bulkMarkAttendanceAction,
    {}
  );
  const [importState, importAction] = useActionState(
    importAttendanceAction,
    {}
  );
  const [studentQuery, setStudentQuery] = useState("");
  const [offeringQuery, setOfferingQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      student.name.toLowerCase().includes(query)
    );
  }, [studentQuery, students]);

  const filteredOfferings = useMemo(() => {
    const query = offeringQuery.trim().toLowerCase();
    if (!query) return offerings;
    return offerings.filter((offering) =>
      offering.label.toLowerCase().includes(query)
    );
  }, [offeringQuery, offerings]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="search"
          value={studentQuery}
          onChange={(event) => setStudentQuery(event.target.value)}
          placeholder="Filter students"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <input
          type="search"
          value={offeringQuery}
          onChange={(event) => setOfferingQuery(event.target.value)}
          placeholder="Filter subject offerings"
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
      </div>

      <form action={action} className="grid gap-4 md:grid-cols-2">
        <select
          name="studentId"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select student</option>
          {filteredStudents.map((student) => (
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
          {filteredOfferings.map((offering) => (
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

      <div className="h-px bg-[var(--border)]" />

      <form action={bulkAction} className="grid gap-4 md:grid-cols-2">
        <select
          name="offeringId"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select subject offering</option>
          {filteredOfferings.map((offering) => (
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
        <div className="md:col-span-2 flex items-center gap-4">
          <BulkButton />
          {bulkState?.error ? (
            <span className="text-xs text-orange-600">{bulkState.error}</span>
          ) : null}
          {bulkState?.success ? (
            <span className="text-xs text-emerald-600">{bulkState.success}</span>
          ) : null}
        </div>
      </form>

      <div className="h-px bg-[var(--border)]" />

      <form action={importAction} className="grid gap-4 md:grid-cols-2">
        <select
          name="offeringId"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        >
          <option value="">Select subject offering</option>
          {filteredOfferings.map((offering) => (
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
        <input
          name="file"
          type="file"
          accept=".xlsx"
          required
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
        />
        <div className="text-xs text-[var(--muted)]">
          Required columns: Sr. No., Name, UID, Status (P/A).
          <a href="/attendance-template.xlsx" className="ml-2 underline" download>
            Download template
          </a>
        </div>

        <div className="md:col-span-2 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <ImportButton />
            {importState?.error ? (
              <span className="text-xs text-orange-600">
                {importState.error}
              </span>
            ) : null}
            {importState?.success ? (
              <span className="text-xs text-emerald-600">
                {importState.success}
              </span>
            ) : null}
          </div>
          {importState?.details?.length ? (
            <ul className="text-xs text-[var(--muted)]">
              {importState.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </form>
    </div>
  );
};
