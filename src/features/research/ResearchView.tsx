import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";


import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Plus, Loader2 } from "lucide-react";





export function ResearchView() {
    const [newProjectName, setNewProjectName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get('/api/projects');
      return res.data;
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post('/api/projects', { title });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      setNewProjectName("");
      window.location.href = `/research/${data._id}`;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });


  return (
    <AppShell>
      <PageHeader
        eyebrow="Research Desk"
        title="Your papers, in progress."
        description="Every project carries its own LaTeX source, editable preview and export history."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
                disabled={!user}
              >
                <Plus className="size-4" /> Create project
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Name the project</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  placeholder="E.g., Graph Attention for Protein Folding" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProjectName.trim()) {
                      createMutation.mutate(newProjectName);
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => createMutation.mutate(newProjectName)}
                  disabled={!newProjectName.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Proceed"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mx-auto mt-12 max-w-7xl px-6">
        {!user ? (
          <div className="rounded-xl border border-border/50 bg-background/50 p-8 text-center backdrop-blur-sm">
            <h3 className="text-lg font-medium text-foreground">Sign in to use the Research Desk</h3>
            <p className="mt-2 text-sm text-muted-foreground">You must be logged in to create and save projects.</p>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Project</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects?.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No projects found. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
                {projects?.map((p: any) => (
                  <TableRow
                    key={p._id}
                    onClick={() => window.location.href = `/research/${p._id}`}
                    className="cursor-pointer group"
                  >
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.lastEditedBy && (
                         <span className="text-foreground">
                           Edited by {p.lastEditedBy.length > 15 ? p.lastEditedBy.substring(0, 15) + '...' : p.lastEditedBy} &bull;{" "}
                         </span>
                      )}
                      {p.updatedAt ? formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true }) : 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(p._id); }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-900/30 bg-red-900/10 px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-900/20"
                          title="Delete Project"
                        >
                          Delete
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
