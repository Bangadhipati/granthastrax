import type { ReactNode } from "react";

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card/70 p-6 transition-colors duration-300 hover:border-gold/30 ${className}`}
    >
      {children}
    </div>
  );
}
