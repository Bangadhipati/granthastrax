import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import logoSrc from "@/assets/logo.jpg";

export function TopNav() {
  return (
    <div className="sticky top-4 z-50 mx-auto max-w-7xl px-4 sm:px-6">
      <header className="flex w-full items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-6 py-2.5 shadow-xl shadow-black/10 backdrop-blur-xl">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center overflow-hidden rounded-full border border-gold/40 bg-background shadow-sm">
            <img
              src={logoSrc}
              alt="GranthAstraX logo"
              className="size-full object-cover"
            />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-gold-gradient font-display text-xl tracking-tight">
              GranthAstraX
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              From Family of AstraGenX
            </span>
          </div>
        </Link>
        <button
          type="button"
          aria-label="Account"
          className="grid size-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-all duration-300 hover:border-gold/40 hover:text-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
        >
          <User className="size-[18px]" strokeWidth={1.6} />
        </button>
      </header>
    </div>
  );
}
