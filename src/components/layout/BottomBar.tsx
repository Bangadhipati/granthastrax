import { Link } from "@tanstack/react-router";
import { Home, ImageIcon, FileText, FlaskConical, BookOpen } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/images", label: "Image Studio", icon: ImageIcon },
  { to: "/documents", label: "Document Studio", icon: FileText },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/writer", label: "Writer", icon: BookOpen },
] as const;

export function BottomBar() {
  return (
    <nav
      aria-label="Workspace navigation"
      className="glass-panel fixed inset-x-0 bottom-4 z-40 mx-auto w-fit rounded-full px-3 py-2"
    >
      <ul className="flex items-center gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="group relative">
            <Link
              to={to}
              aria-label={label}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className: "bg-accent text-gold shadow-[var(--shadow-gold)]",
              }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="flex size-11 items-center justify-center rounded-full transition-colors duration-300 hover:bg-secondary"
            >
              <Icon className="size-[18px]" strokeWidth={1.6} />
            </Link>
            <span className="glass-panel pointer-events-none absolute bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs tracking-wide text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
