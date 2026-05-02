"use client";

import { signOut } from "next-auth/react";

export const SignOutButton = () => {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--ink)]"
    >
      Sign out
    </button>
  );
};
