"use client";

import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState, useTransition } from "react";

export const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    startTransition(async () => {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (response?.error) {
        setError("Invalid login credentials.");
        return;
      }

      const session = await getSession();
      const role = session?.user?.role;
      const destination =
        role === "ADMIN" ? "/admin" : role === "STUDENT" ? "/student" : "/dashboard";
      router.replace(destination);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Email
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        Password
        <input
          name="password"
          type="password"
          required
          className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </label>
      {error ? (
        <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 w-full rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
};
