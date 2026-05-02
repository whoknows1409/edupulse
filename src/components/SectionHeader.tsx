type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold text-[var(--ink)]">{title}</h2>
      {subtitle ? (
        <p className="text-sm text-[var(--muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
};
