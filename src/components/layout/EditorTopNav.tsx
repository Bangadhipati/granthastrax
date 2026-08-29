import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { User, Home, ImageIcon, FileText, FlaskConical, BookOpen, Edit2, LogOut, CloudUpload, CheckCircle2 } from "lucide-react";
import logoSrc from "@/assets/logo.jpg";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/images", label: "Image Studio", icon: ImageIcon },
  { to: "/documents", label: "Document Studio", icon: FileText },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/writer", label: "Writer", icon: BookOpen },
] as const;

export function EditorTopNav({ 
  title = "Graph Attention for Protein Folding", 
  onTitleChange 
}: { 
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}) {
  const [localTitle, setLocalTitle] = useState(title);
  useEffect(() => { setLocalTitle(title); }, [title]);
  const [isEditing, setIsEditing] = useState(false);
  const { user, logout } = useAuth();

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
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={() => { setIsEditing(false); onTitleChange?.(localTitle); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setIsEditing(false); onTitleChange?.(localTitle); } }}
              className="w-full min-w-[200px] border-none bg-transparent text-sm font-medium text-foreground outline-none focus:ring-0"
            />
          ) : (
            <>
                            <span className="cursor-pointer truncate text-sm font-medium text-foreground">
                {title}
              </span>
              <Edit2 className="size-3 text-muted-foreground transition-colors hover:text-foreground" />
              <div className="flex items-center ml-2 border-l border-border/50 pl-2">
                {isSaving ? (
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <CloudUpload className="size-4 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider font-medium">Saving</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors" title={`Last saved: ${lastSaved.toLocaleTimeString()}`}>
                    <CheckCircle2 className="size-3.5" />
                    <span className="text-[10px] uppercase tracking-wider font-medium">Saved</span>
                  </div>
                ) : null}
              </div>
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
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="grid size-8 place-items-center overflow-hidden rounded-full border border-border bg-secondary/60 text-muted-foreground transition-colors duration-300 hover:border-gold/40 hover:text-gold focus:outline-none"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="size-full object-cover" />
                ) : (
                  <span className="text-xs font-medium">{user.email?.[0].toUpperCase() || "U"}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl rounded-xl">
              <div className="px-2 py-1.5 text-sm text-foreground font-medium truncate">
                {user.displayName || user.email}
              </div>
              <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:bg-red-500/10 focus:text-red-500 cursor-pointer rounded-lg">
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <AuthModal>
            <button
              type="button"
              aria-label="Account"
              className="grid size-8 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-all duration-300 hover:border-gold/40 hover:text-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
            >
              <User className="size-4" strokeWidth={1.6} />
            </button>
          </AuthModal>
        )}
      </div>
    </header>
  );
}
