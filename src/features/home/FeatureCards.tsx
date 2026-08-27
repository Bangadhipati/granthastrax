import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ImageIcon, FileText, FlaskConical, BookOpen } from "lucide-react";

export const suites = [
  {
    to: "/images",
    icon: ImageIcon,
    name: "Image Studio",
    copy: "Convert between any format or straight to PDF, compress with intent, or upscale without losing edge fidelity.",
  },
  {
    to: "/documents",
    icon: FileText,
    name: "Document Studio",
    copy: "Move between DOCX, PDF, TeX and more. Shrink files to a target size or expand for print-grade output.",
  },
  {
    to: "/research",
    icon: FlaskConical,
    name: "Research Desk",
    copy: "Write like Word, ship like LaTeX. A split canvas where the preview itself is fully editable.",
  },
  {
    to: "/writer",
    icon: BookOpen,
    name: "Writer Desk",
    copy: "Trim size, paper stock, cover type and auto-calculated spine — with a 3D preview of your finished book.",
  },
] as const;

export function FeatureCards() {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-gold">Your desks</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">Four focused workspaces, zero clutter.</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {suites.map(({ to, icon: Icon, name, copy }) => (
          <Link key={to} to={to} className="group">
            <div className="relative flex h-full flex-col rounded-2xl border border-border bg-card/60 p-6 transition-all duration-300 hover:border-gold/40 hover:shadow-[var(--shadow-gold)]">
              <div className="mb-5 grid size-12 place-items-center rounded-xl bg-accent/80 transition-colors duration-300 group-hover:bg-gold/15">
                <Icon className="size-5 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl">{name}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {copy}
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.15em] text-gold opacity-0 transition-all duration-300 group-hover:opacity-100">
                Explore
                <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
