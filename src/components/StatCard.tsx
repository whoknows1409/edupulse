type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "orange" | "blue";
};

export const StatCard = ({ label, value, hint, accent }: StatCardProps) => {
  const accentClass =
    accent === "blue"
      ? "text-sky-600"
      : accent === "orange"
      ? "text-orange-600"
      : "text-[var(--ink)]";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>
      <div className={`mt-3 text-3xl font-semibold ${accentClass}`}>
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-[var(--muted)]">{hint}</div> : null}
    </div>
  );
};
