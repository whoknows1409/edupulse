import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="hero-grid">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-16">
          <nav className="flex items-center justify-between">
            <div className="text-lg font-semibold tracking-tight text-[var(--ink)]">
              EduPulse
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/login"
                className="rounded-full border border-[var(--border)] px-4 py-2 text-[var(--ink)] transition hover:border-[var(--ink)]"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-white shadow-lg shadow-orange-200 transition hover:translate-y-[-1px]"
              >
                Open dashboard
              </Link>
            </div>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="fade-up flex flex-col gap-6">
              <span className="w-fit rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs uppercase tracking-[0.2em] text-orange-600">
                Academic intelligence
              </span>
              <h1 className="text-4xl font-semibold leading-tight text-[var(--ink)] md:text-5xl">
                Turn attendance and results into actionable learning insights.
              </h1>
              <p className="max-w-xl text-base leading-7 text-[var(--muted)] md:text-lg">
                EduPulse unifies student performance, attendance, and class
                analytics into a single portal. Built for administrators,
                students, and ops teams who need clarity, not chaos.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:translate-y-[-1px]"
                >
                  Get started
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--ink)]"
                >
                  View dashboards
                </Link>
              </div>
            </div>

            <div className="fade-up grid gap-4">
              <div className="glass rounded-3xl p-6 shadow-xl shadow-orange-100">
                <div className="text-xs uppercase tracking-[0.2em] text-orange-600">
                  Live snapshot
                </div>
                <div className="mt-4 text-3xl font-semibold text-[var(--ink)]">
                  92.4%
                </div>
                <div className="text-sm text-[var(--muted)]">
                  Average attendance this term
                </div>
                <div className="mt-6 grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                    <span className="text-[var(--muted)]">Students at risk</span>
                    <span className="font-semibold text-orange-600">18</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-white/80 px-4 py-3">
                    <span className="text-[var(--muted)]">Top subject</span>
                    <span className="font-semibold text-[var(--ink)]">Data Structures</span>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-[var(--border)] bg-white/70 p-6">
                <div className="text-sm font-semibold text-[var(--ink)]">
                  Performance & attendance correlation
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Identify cohort trends with immediate, explainable insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Role-based views",
              text: "Students see their progress; admins manage cohorts with confidence.",
            },
            {
              title: "Actionable analytics",
              text: "Correlation, distribution, and subject insights mapped to outcomes.",
            },
            {
              title: "DevOps ready",
              text: "Containerized stack with CI/CD, Prometheus metrics, and Grafana dashboards.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-white/70 p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-[var(--muted)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
