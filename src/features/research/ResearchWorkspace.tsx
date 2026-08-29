import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EditorShell } from "@/components/layout/EditorShell";
import { ResearchSidebar } from "./ResearchSidebar";
import { PdfViewer } from "./PdfViewer";
import { ShareModal } from "./ShareModal";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { 
  Loader2, Play, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  ArrowLeft, Download
} from "lucide-react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export function ResearchWorkspace({ projectId }: { projectId: string }) {
  const [latexContent, setLatexContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isInitialized, setIsInitialized] = useState(false);
  
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/api/projects/${projectId}`);
      return res.data;
    },
    staleTime: Infinity,
  });

  // Initialize editor content once
  useEffect(() => {
    if (project && !isInitialized) {
      setLatexContent(project.content || "");
      setIsInitialized(true);
    }
  }, [project, isInitialized]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { title?: string, content?: string, compiler?: string }) => {
      const res = await api.put(`/api/projects/${projectId}`, payload);
      return res.data;
    },
    onMutate: () => setIsSaving(true),
    onSuccess: (data, payload) => {
      setIsSaving(false);
      setLastSaved(new Date());
      queryClient.setQueryData(['project', projectId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: payload.content !== undefined ? payload.content : old.content,
          title: payload.title !== undefined ? payload.title : old.title,
          compiler: payload.compiler !== undefined ? payload.compiler : old.compiler,
        };
      });
    },
    onError: () => setIsSaving(false),
  });

  // Debounced Autosave
  useEffect(() => {
    if (!project || !isInitialized) return;
    const currentProjectContent = project.content || "";
    if (latexContent === currentProjectContent) return;

    const timeout = setTimeout(() => {
      saveMutation.mutate({ content: latexContent });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [latexContent, project?.content, isInitialized, saveMutation.mutate]);

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
      const res = await api.post("/api/compile", { 
        content: latexContent,
        engine: project?.compiler || 'pdflatex'
      }, { responseType: 'blob' });
      
      if (res.status === 200) {
        const blob = res.data;
        if (blob.type && !blob.type.includes('pdf')) {
          const text = await blob.text();
          console.error("Compilation Error Log:", text);
          alert("Compilation failed! Check the console for the full LaTeX error log.\n\n" + text.substring(0, 500) + "...");
          return;
        }
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
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

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${project?.title || "document"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  function insertTextAtCursor(textToInsert: string) {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const { from, to } = view.state.selection.main;
    
    view.dispatch({
      changes: { from, to, insert: textToInsert },
      selection: { anchor: from + textToInsert.length }
    });
    view.focus();
    
    // Trigger the autosave
    setLatexContent(view.state.doc.toString());
  }

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <EditorShell title={project?.title} onTitleChange={(newTitle) => saveMutation.mutate({ title: newTitle })} isSaving={isSaving} lastSaved={lastSaved} >
      <ResearchSidebar 
        projectId={projectId} 
        project={project}
        latexContent={latexContent}
        onCompilerChange={(compiler) => saveMutation.mutate({ compiler })}
        onInsertImage={(url, name) => insertTextAtCursor(`\\includegraphics{${url}} % ${name}\n`)}
      />

      {/* Main Workspace Area */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-muted/20">
        
        {/* Unified Editor Toolbar */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/50 px-4">
          <button
            type="button"
            onClick={() => window.location.href = '/research'}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors duration-300 hover:bg-secondary hover:text-gold"
          >
            <ArrowLeft className="size-3.5" /> Close Workspace
          </button>
          
          <div className="flex items-center gap-2">
            {project?.userId === user?.uid && (
               <ShareModal project={project} />
            )}
            
            {pdfUrl && (
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-90"
              >
                <Download className="size-3.5" /> Download PDF
              </button>
            )}

            <button
              type="button"
              onClick={handleCompile}
              disabled={isCompiling}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-black transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {isCompiling ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5 fill-current" />} 
              {isCompiling ? "Compiling PDF..." : "Compile to PDF"}
            </button>
          </div>
        </div>

        {/* Resizable Split Canvas */}
        <div className="h-full flex-1 overflow-hidden">
          <ResizablePanelGroup orientation="horizontal">
            {/* LaTeX Source Pane */}
            <ResizablePanel defaultSize={50} minSize={20} className="flex h-full flex-col bg-[#0a0a0a]">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/40 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>LaTeX Code (main.tex)</span>
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
                    theme="dark"
                    height="100%"
                    onChange={(val) => setLatexContent(val)}
                    className="h-full w-full border-none bg-transparent font-mono outline-none"
                    extensions={[EditorView.theme({ "&": { fontSize: `${13 * latexZoom}px` } })]}
                    basicSetup={{
                      lineNumbers: true,
                      highlightActiveLine: true,
                      foldGutter: true,
                      dropCursor: true,
                    }}
                  />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border hover:bg-gold/50 transition-colors z-10 w-1" />

            {/* PDF Preview Pane */}
            <ResizablePanel defaultSize={50} minSize={30} className="flex h-full flex-col bg-muted/30">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/40 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>PDF Preview</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded bg-secondary/50 p-0.5">
                    <button
                      type="button"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber(p => p - 1)}
                      className="rounded p-0.5 hover:bg-background disabled:opacity-30"
                    >
                      <ChevronLeft className="size-3" />
                    </button>
                    <span className="min-w-[3rem] text-center">{pageNumber} / {numPages || '-'}</span>
                    <button
                      type="button"
                      disabled={pageNumber >= numPages}
                      onClick={() => setPageNumber(p => p + 1)}
                      className="rounded p-0.5 hover:bg-background disabled:opacity-30"
                    >
                      <ChevronRight className="size-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 rounded bg-secondary/50 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.2))}
                      className="rounded p-0.5 hover:bg-background"
                    >
                      <ZoomOut className="size-3" />
                    </button>
                    <span className="min-w-[2.5rem] text-center">{Math.round(previewZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))}
                      className="rounded p-0.5 hover:bg-background"
                    >
                      <ZoomIn className="size-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div 
                className="flex-1 overflow-auto p-4 flex justify-center items-start bg-[#525659] shadow-inner"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setPreviewZoom((z) => Math.min(Math.max(0.5, z - e.deltaY * 0.001), 3));
                  }
                }}
              >
                <PdfViewer
                  pdfUrl={pdfUrl}
                  isCompiling={isCompiling}
                  pageNumber={pageNumber}
                  numPages={numPages}
                  previewZoom={previewZoom}
                  onLoadSuccess={onDocumentLoadSuccess}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditorShell>
  );
}
