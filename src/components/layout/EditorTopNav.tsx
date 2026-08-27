import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { User, Home, ImageIcon, FileText, FlaskConical, BookOpen, Edit2 } from "lucide-react";
import logoSrc from "@/assets/logo.jpg";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/images", label: "Image Studio", icon: ImageIcon },
  { to: "/documents", label: "Document Studio", icon: FileText },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/writer", label: "Writer", icon: BookOpen },
] as const;

export function EditorTopNav() {
  const [title, setTitle] = useState("Graph Attention for Protein Folding");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xl">
      <Link to="/" className="group flex shrink-0 items-center gap-2.5">
        <span className="grid size-8 place-items-center overflow-hidden rounded-full border border-gold/40 bg-background">
          <img
            src={logoSrc}
            alt="GranthAstraX logo"
            className="size-full object-cover"
          />
        </span>
      </Link>

      {/* Editable Title */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div
          className="group flex max-w-md items-center gap-2 rounded-md px-3 py-1 transition-colors hover:bg-secondary/50"
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              type="text"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
              className="w-full min-w-[200px] border-none bg-transparent text-sm font-medium text-foreground outline-none focus:ring-0"
            />
          ) : (
            <>
              <span className="cursor-pointer truncate text-sm font-medium text-foreground">
                {title}
              </span>
              <Edit2 className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="mr-2 flex items-center gap-1 rounded-full border border-border/50 bg-secondary/30 px-1 py-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              activeOptions={{ exact: to === "/" }}
              activeProps={{
                className: "bg-accent text-gold",
              }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="grid size-8 place-items-center rounded-full transition-colors duration-300 hover:bg-secondary"
            >
              <Icon className="size-[15px]" strokeWidth={1.6} />
            </Link>
          ))}
        </div>
        <button
          type="button"
          aria-label="Account"
          className="grid size-8 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold"
        >
          <User className="size-4" strokeWidth={1.6} />
        </button>
      </div>
    </header>
  );
}
