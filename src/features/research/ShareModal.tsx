import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Loader2, X } from "lucide-react";

export function ShareModal({ project }: { project: any }) {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const queryClient = useQueryClient();

  const manageCollaborator = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'add' | 'remove' }) => {
      const res = await api.post(`/api/projects/${project._id}/collaborators`, { identifier: id, action });
      return res.data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(['project', project._id], updatedProject);
      setIdentifier("");
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to manage collaborator");
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-secondary/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <Users className="size-3.5" /> Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border border-border/50">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Invite collaborators using their email address or GitHub username. They will be able to view and edit this project.
          </p>
          <div className="flex gap-2">
            <Input 
              placeholder="Email or GitHub username..." 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && identifier.trim()) {
                  manageCollaborator.mutate({ id: identifier, action: 'add' });
                }
              }}
            />
            <Button 
              disabled={!identifier.trim() || manageCollaborator.isPending}
              onClick={() => manageCollaborator.mutate({ id: identifier, action: 'add' })}
            >
              Invite
            </Button>
          </div>
          
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-sm font-medium mb-3">Current Collaborators</h4>
            {project?.collaboratorIdentifiers?.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No collaborators invited yet.</p>
            ) : (
              <ul className="space-y-2">
                {project?.collaboratorIdentifiers?.map((id: string) => (
                  <li key={id} className="flex items-center justify-between text-sm bg-secondary/30 rounded-md px-3 py-2 border border-border/30">
                    <span className="truncate">{id}</span>
                    <button 
                      onClick={() => manageCollaborator.mutate({ id, action: 'remove' })}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                      title="Remove Access"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
