import Link from "next/link";
import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen hero-grid flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-white/80 p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              EduPulse
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-[var(--ink)]">
              Welcome back
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600"
          >
            Home
          </Link>
        </div>
        <LoginForm />
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-xs text-[var(--muted)]">
          Demo admin: admin@edupulse.dev / Admin@123
          <br />
          Demo student: aarav@edupulse.dev / Student@123
        </div>
      </div>
    </div>
  );
}
