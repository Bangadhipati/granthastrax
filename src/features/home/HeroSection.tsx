import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { HeroBackground } from "@/components/layout/HeroBackground";

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border">
      <HeroBackground />
      
      {/* Content Container */}
      <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-32 sm:pb-24 sm:pt-40">
        <p className="text-[11px] uppercase tracking-[0.32em] text-gold">
          A studio for serious work
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.1] sm:text-6xl">
          Everything a researcher and author needs,{" "}
          <span className="text-gold-gradient">in one quiet workspace.</span>
        </h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          GranthAstraX replaces the tab-sprawl of converters, compressors, LaTeX editors and
          print calculators with four precise desks — designed for focus, not noise.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/research"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90"
          >
            Open Research Desk <ArrowUpRight className="size-4" />
          </Link>
          <Link
            to="/writer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
          >
            Design a book
          </Link>
        </div>
      </div>
    </section>
  );
}
