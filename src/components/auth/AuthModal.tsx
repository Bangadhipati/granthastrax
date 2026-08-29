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
import { Loader2, Mail, Lock } from "lucide-react";

interface AuthModalProps {
  children: ReactNode;
}

export function AuthModal({ children }: AuthModalProps) {
  const { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState<"google" | "github" | "email" | null>(null);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      setIsSigningIn(provider);
      setError("");
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      setOpen(false);
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        console.error(`Error signing in with ${provider}:`, err);
        setError(`Failed to sign in with ${provider}.`);
      }
    } finally {
      setIsSigningIn(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    try {
      setIsSigningIn("email");
      setError("");
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setOpen(false);
    } catch (err: any) {
      console.error("Email auth error:", err);
      // Simplify firebase errors for user
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed.");
      }
    } finally {
      setIsSigningIn(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border/50 bg-background/90 backdrop-blur-xl shadow-2xl shadow-black/40 rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-2xl font-display tracking-tight text-foreground">
            Welcome to <span className="text-gold-gradient">GranthAstraX</span>
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground/80">
            Sign in to access your secure workspaces, sync documents, and unlock premium research tools.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-gold/50 transition-colors"
                required
              />
            </div>

            <Button 
              type="submit"
              className="h-11 w-full rounded-xl bg-gold hover:bg-gold/90 text-black font-medium transition-all gap-2"
              disabled={isSigningIn !== null}
            >
              {isSigningIn === "email" && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
            
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-xs text-muted-foreground hover:text-gold transition-colors mx-auto mt-1"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="shrink-0 px-4 text-xs text-muted-foreground uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button"
              variant="outline" 
              className="h-11 flex-1 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary hover:border-gold/30 hover:text-gold transition-all duration-300 gap-2"
              onClick={() => handleOAuth("google")}
              disabled={isSigningIn !== null}
            >
              {isSigningIn === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.25027 6.65L5.27028 9.765C6.22028 6.815 8.8603 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.105 21.215C22.4499 19.055 23.49 15.925 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.235C5.02498 13.505 4.88501 12.72 4.88501 11.92C4.88501 11.12 5.01998 10.335 5.27001 9.605L1.245 6.49C0.450001 8.09 0 9.94 0 11.92C0 13.9 0.460001 15.75 1.25 17.35L5.26498 14.235Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L15.9204 17.98C14.8504 18.7 13.5354 19.12 12.0004 19.12C8.86035 19.12 6.22033 17.0501 5.27033 14.1001L1.24536 17.2151C3.25536 21.1751 7.31035 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
              )}
              Google
            </Button>

            <Button 
              type="button"
              variant="outline" 
              className="h-11 flex-1 rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary hover:border-gold/30 hover:text-gold transition-all duration-300 gap-2"
              onClick={() => handleOAuth("github")}
              disabled={isSigningIn !== null}
            >
              {isSigningIn === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              GitHub
            </Button>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground/60 mt-1">
          By continuing, you agree to GranthAstraX's <br />
          <a href="#" className="underline hover:text-gold transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-gold transition-colors">Privacy Policy</a>.
        </div>
      </DialogContent>
    </Dialog>
  );
}
