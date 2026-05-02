"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createClassroomAction } from "@/app/admin/actions";

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
    >
      {pending ? "Saving..." : "Add classroom"}
    </button>
  );
};

export const ClassroomForm = () => {
  const [state, action] = useActionState(createClassroomAction, {});

  return (
    <form action={action} className="grid gap-3 md:grid-cols-3">
      <input
        name="name"
        placeholder="Class name"
        required
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      />
      <input
        name="section"
        placeholder="Section"
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      />
      <input
        name="year"
        type="number"
        placeholder="Year"
        defaultValue={2026}
        required
        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
      />
      <div className="md:col-span-3 flex items-center gap-4">
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
