import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pt-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-gold">{eyebrow}</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
