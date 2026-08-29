import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { PdfViewer } from "./PdfViewer";



import { FontSize } from "./extensions/FontSize";
import { Columns } from "./extensions/Columns";


import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ImageExtension from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { Panel } from "@/components/layout/Panel";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Columns as ColumnsIcon, Heading1, Heading2, Heading3, Type, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, ListOrdered, Image as ImageIcon, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ChevronLeft, ChevronRight, Loader2, Plus, ArrowLeft, Download, Bold, Italic, Sigma, List, Table2, Quote, FileArchive, FileText, File, ZoomIn, ZoomOut, Maximize2, Play } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EditorShell } from "@/components/layout/EditorShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { ResearchSidebar } from "./ResearchSidebar";
import { convertHtmlToLatex } from "./htmlToLatex";
import { convertLatexToHtml } from "./latexToHtml";
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
import { Button } from "@/components/ui/button";





export function ResearchView() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
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
      setActiveProjectId(data._id);
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

  if (activeProjectId) return <Editor projectId={activeProjectId} onBack={() => setActiveProjectId(null)} />;

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
          <Panel className="overflow-x-auto p-0">
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
                    onClick={() => setActiveProjectId(p._id)}
                    className="cursor-pointer group"
                  >
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true })}
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
          </Panel>
        )}
      </div>
    </AppShell>
  );
}
const fontSizes = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px"];

const fonts = [
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Arial", value: "Arial, Helvetica, sans-serif" },
];

function ToolbarButton({
  isActive = false,
  onClick,
  icon: Icon,
}: {
  isActive?: boolean;
  onClick: () => void;
  icon: any;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid size-7 place-items-center rounded text-muted-foreground transition-colors ${
        isActive ? "bg-accent text-gold" : "hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" strokeWidth={1.7} />
    </button>
  );
}


function Editor({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [latexContent, setLatexContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/projects/${projectId}`);
      setLatexContent(res.data.content || "");
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { title?: string, content?: string }) => {
      const res = await api.put(`/api/projects/${projectId}`, payload);
      return res.data;
    },
    onMutate: () => setIsSaving(true),
    onSuccess: () => {
      setIsSaving(false);
      setLastSaved(new Date());
    },
    onError: () => setIsSaving(false),
  });

  // Debounced Autosave
  useEffect(() => {
    if (!project || latexContent === project.content) return;
    const timeout = setTimeout(() => {
      saveMutation.mutate({ content: latexContent });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [latexContent, project, saveMutation]);


  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [latexZoom, setLatexZoom] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);
  
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

    const handleCompile = async () => {
    setIsCompiling(true);
    try {
      const res = await api.post("/api/compile", { content: latexContent }, { responseType: 'blob' });
      
      if (res.status === 200) {
        const blob = res.data;
        setPdfUrl(URL.createObjectURL(blob));
        setPageNumber(1);
      } else {
        alert("Compilation failed. Please check your LaTeX syntax.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to reach compiler API.");
    } finally {
      setIsCompiling(false);
    }
  };

  function insertTag(startTag: string, endTag: string = "") {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const { from, to } = view.state.selection.main;
    const selectedText = view.state.sliceDoc(from, to);
    const newText = startTag + selectedText + endTag;
    
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: { anchor: from + startTag.length, head: from + startTag.length + selectedText.length }
    });
    view.focus();
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <EditorShell title={project?.title} onTitleChange={(newTitle) => saveMutation.mutate({ title: newTitle })} >
      <ResearchSidebar latexContent={latexContent} />

      {/* Main Workspace Area */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-muted/20">
        
        {/* Unified Editor Toolbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/50 px-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-300 hover:bg-secondary hover:text-gold"
          >
            <ArrowLeft className="size-3.5" /> Back to projects
          </button>
          
          <div className="text-xs text-muted-foreground ml-4 hidden md:block">
            {isSaving ? "Saving..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
          </div>
          
          <div className="flex flex-1 items-center justify-center gap-1.5 px-4 overflow-x-auto no-scrollbar">
            <Select onValueChange={(val) => insertTag(`\\${val}{`, '}')}>
              <SelectTrigger className="w-[110px] h-8 text-xs border-border bg-background">
                <SelectValue placeholder="Heading" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="section">Heading 1</SelectItem>
                <SelectItem value="subsection">Heading 2</SelectItem>
                <SelectItem value="subsubsection">Heading 3</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(val) => insertTag(`{\\fontsize{${val}}{${parseInt(val)+2}}\\selectfont `, '}')}>
              <SelectTrigger className="w-[80px] h-8 text-xs border-border bg-background">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                {["10", "12", "14", "16", "18", "20", "24"].map((size) => (
                  <SelectItem key={size} value={size}>{size}pt</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              <ToolbarButton onClick={() => insertTag('\\textbf{', '}')} icon={Bold} />
              <ToolbarButton onClick={() => insertTag('\\textit{', '}')} icon={Italic} />
              <ToolbarButton onClick={() => insertTag('\\underline{', '}')} icon={UnderlineIcon} />
            </div>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              <ToolbarButton onClick={() => insertTag('\\begin{center}\\n', '\\n\\end{center}')} icon={AlignCenter} />
              <ToolbarButton onClick={() => insertTag('\\begin{flushleft}\\n', '\\n\\end{flushleft}')} icon={AlignLeft} />
              <ToolbarButton onClick={() => insertTag('\\begin{flushright}\\n', '\\n\\end{flushright}')} icon={AlignRight} />
            </div>

            <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              <ToolbarButton onClick={() => insertTag('\\begin{itemize}\\n\\item ', '\\n\\end{itemize}')} icon={List} />
              <ToolbarButton onClick={() => insertTag('\\begin{enumerate}\\n\\item ', '\\n\\end{enumerate}')} icon={ListOrdered} />
            </div>
            
            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              <ToolbarButton onClick={() => {
                const url = window.prompt("Enter Image URL");
                if (url) insertTag(`\\begin{figure}[h]\\n\\centering\\n\\includegraphics[width=0.5\\textwidth]{${url}}\\n\\caption{`, `}\\n\\end{figure}`);
              }} icon={ImageIcon} />
              <ToolbarButton onClick={() => {
                const cols = window.prompt("Number of columns? (1 or 2)");
                if (cols === "2") insertTag('\\twocolumn\\n');
                else insertTag('\\onecolumn\\n');
              }} icon={ColumnsIcon} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompile}
              disabled={isCompiling}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-black transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {isCompiling ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />} 
              {isCompiling ? "Compiling..." : "Compile"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90"
            >
              <Download className="size-3.5" /> Export
            </button>
          </div>
        </div>

        {/* Resizable Split Canvas */}
        <div className="h-full flex-1 overflow-hidden">
          <ResizablePanelGroup orientation="horizontal">
            {/* LaTeX Pane */}
            <ResizablePanel defaultSize={40} minSize={20} className="flex h-full flex-col bg-[#0a0a0a]">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/40 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>main.tex</span>
                <span className="text-gold">Source</span>
              </div>
              <div 
                className="flex-1 overflow-hidden relative"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setLatexZoom((z) => Math.min(Math.max(0.5, z - e.deltaY * 0.001), 3));
                  }
                }}
              >
                <CodeMirror
                    ref={editorRef}
                    value={latexContent}
                    onChange={(value) => setLatexContent(value)}
                    theme="dark"
                    height="100%"
                    className="h-full w-full border-none bg-transparent font-mono outline-none"
                    extensions={[EditorView.theme({ "&": { fontSize: `${13 * latexZoom}px` } })]}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: false,
                      foldGutter: false,
                      dropCursor: false,
                      allowMultipleSelections: false,
                      indentOnInput: false,
                    }}
                  />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border hover:bg-gold/50 transition-colors z-10 w-1">
            </ResizableHandle>

            {/* PDF Viewer Pane */}
            <ResizablePanel defaultSize={60} minSize={30} className="flex h-full flex-col bg-background relative">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/40 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>PDF Preview</span>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 border-r border-border pr-4 mr-4">
                  <button onClick={() => setPreviewZoom(z => Math.max(0.2, z - 0.2))} className="text-muted-foreground hover:text-foreground">
                    <ZoomOut className="size-4" />
                  </button>
                  <span className="font-medium text-foreground w-8 text-center">{Math.round(previewZoom * 100)}%</span>
                  <button onClick={() => setPreviewZoom(z => Math.min(5, z + 0.2))} className="text-muted-foreground hover:text-foreground">
                    <ZoomIn className="size-4" />
                  </button>
                </div>
                
                {/* Pagination Controls */}
                {pdfUrl && numPages > 0 && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <span className="font-medium text-foreground">
                      Page {pageNumber} of {numPages}
                    </span>
                    <button 
                      onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                      disabled={pageNumber >= numPages}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                )}
              </div>

              <div 
                className="flex-1 overflow-auto bg-muted/30 p-8 lg:p-12 relative flex justify-center items-start"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setPreviewZoom((z) => Math.min(Math.max(0.2, z - e.deltaY * 0.001), 5));
                  }
                }}
              >
                <div>
                    <PdfViewer
                      pdfUrl={pdfUrl}
                      isCompiling={isCompiling}
                      pageNumber={pageNumber}
                      previewZoom={previewZoom}
                      onLoadSuccess={onDocumentLoadSuccess}
                    />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditorShell>
  );
}


