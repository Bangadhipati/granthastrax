import { Link } from "@tanstack/react-router";
import { User, LogOut } from "lucide-react";
import logoSrc from "@/assets/logo.jpg";
import { AuthModal } from "@/components/auth/AuthModal";
import { SettingsModal } from "@/components/auth/SettingsModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";

export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <div className="fixed top-4 left-0 right-0 w-full z-50 mx-auto max-w-7xl px-4 sm:px-6">
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
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="grid size-9 place-items-center overflow-hidden rounded-full border border-border bg-secondary/60 text-muted-foreground transition-all duration-300 hover:border-gold/40 hover:shadow-[0_0_10px_rgba(212,175,55,0.2)] focus:outline-none"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || "User"} className="size-full object-cover" />
                ) : (
                  <span className="text-sm font-medium">{user.email?.[0].toUpperCase() || "U"}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl rounded-xl p-1">
              <div className="px-2 py-2 text-sm text-foreground font-medium truncate border-b border-border/50 mb-1">
                {user.displayName || user.email}
              </div>
              <SettingsModal>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer rounded-lg hover:bg-secondary/50 focus:bg-secondary/50 mb-1">
                  <Settings className="mr-2 size-4 text-muted-foreground" />
                  Settings
                </DropdownMenuItem>
              </SettingsModal>
              <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:bg-red-500/10 hover:bg-red-500/10 focus:text-red-500 cursor-pointer rounded-lg">
                <LogOut className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <AuthModal>
            <button
              type="button"
              aria-label="Sign in"
              className="grid size-9 place-items-center rounded-full border border-border bg-secondary/60 text-muted-foreground transition-all duration-300 hover:border-gold/40 hover:text-gold hover:shadow-[0_0_10px_rgba(212,175,55,0.2)]"
            >
              <User className="size-[18px]" strokeWidth={1.6} />
            </button>
          </AuthModal>
        )}
      </header>
    </div>
  );
}
