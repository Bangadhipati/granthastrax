import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Lock } from "lucide-react";

interface SettingsModalProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsModal({ children, open: externalOpen, onOpenChange: externalOnOpenChange }: SettingsModalProps) {
  const { updateUserPassword, logout } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const [isUpdating, setIsUpdating] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    
    try {
      setIsUpdating(true);
      setError("");
      setSuccess(false);
      await updateUserPassword(password);
      setSuccess(true);
      setPassword("");
      // Close the modal after a short delay on success
      setTimeout(() => setOpen(false), 2000);
    } catch (err: any) {
      console.error("Update password error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("For security reasons, please log out and log back in to change your password.");
      } else {
        setError(err.message || "Failed to update password.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) {
        // Reset state when closing
        setError("");
        setSuccess(false);
        setPassword("");
      }
    }} modal={true}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md border-border/50 bg-background/90 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-xl font-display tracking-tight text-foreground">
            Account Settings
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/80">
            Update your account security settings below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm text-center">
                Password updated successfully!
              </div>
            )}
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                required
                disabled={isUpdating || success}
              />
            </div>

            <Button 
              type="submit"
              className="h-11 w-full rounded-xl bg-gold hover:bg-gold/90 text-black font-medium transition-all gap-2"
              disabled={isUpdating || success}
            >
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
              {isUpdating ? "Updating..." : "Change Password"}
            </Button>
          </form>
          
          <div className="mt-4 pt-4 border-t border-border/50 flex flex-col items-center gap-2">
             <span className="text-xs text-muted-foreground text-center">
               Need to re-authenticate to change your password?
             </span>
             <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="text-xs text-muted-foreground hover:text-foreground border-border/50 bg-secondary/30"
             >
               Sign out
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
