import { Link } from "@tanstack/react-router";
import { User } from "lucide-react";
import logoSrc from "@/assets/logo.jpg";

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center overflow-hidden rounded-full border border-gold/40 bg-background">
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
          className="grid size-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
        >
          <User className="size-[18px]" strokeWidth={1.6} />
        </button>
      </div>
    </header>
  );
}
