import Link from "next/link";
import { requireRole } from "@/lib/access";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-64 flex-col gap-6 rounded-3xl border border-[var(--border)] bg-white/80 p-6 shadow-sm md:flex">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Admin portal
            </div>
            <h1 className="mt-2 text-xl font-semibold text-[var(--ink)]">
              EduPulse
            </h1>
          </div>
          <nav className="flex flex-col gap-2 text-sm text-[var(--muted)]">
            {[
              { href: "/admin", label: "Overview" },
              { href: "/admin/students", label: "Students" },
              { href: "/admin/subjects", label: "Subjects & terms" },
              { href: "/admin/results", label: "Results" },
              { href: "/admin/attendance", label: "Attendance" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 transition hover:bg-orange-50 hover:text-orange-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <SignOutButton />
          </div>
        </aside>

        <div className="flex-1">
          <header className="flex items-center justify-between md:hidden">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Admin portal
              </div>
              <div className="text-lg font-semibold text-[var(--ink)]">
                EduPulse
              </div>
            </div>
            <SignOutButton />
          </header>
          <main className="mt-6 md:mt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
