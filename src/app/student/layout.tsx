import Link from "next/link";
import { requireRole } from "@/lib/access";
import { SignOutButton } from "@/components/SignOutButton";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("STUDENT");

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Student portal
            </div>
            <div className="text-lg font-semibold text-[var(--ink)]">EduPulse</div>
          </div>
          <nav className="hidden items-center gap-4 text-sm text-[var(--muted)] md:flex">
            <Link href="/student" className="hover:text-orange-600">
              Dashboard
            </Link>
          </nav>
          <SignOutButton />
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
