import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EditorShell } from "@/components/layout/EditorShell";
import { ResearchSidebar, type ProjectImage, type ProjectFile } from "./ResearchSidebar";
import { PdfViewer, type CompilationErrorInfo } from "./PdfViewer";
import { ShareModal } from "./ShareModal";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getProjectPdf, saveProjectPdf, removeProjectPdf } from "@/lib/pdfCache";
import { cn } from "@/lib/utils";
import { 
  Loader2, Play, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  ArrowLeft, Download, FileText, ImageIcon, ExternalLink, Copy, Check, X, Plus,
  BookOpen, FileCode
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
  const [compilationError, setCompilationError] = useState<CompilationErrorInfo | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [latexZoom, setLatexZoom] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);
  
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [activeFile, setActiveFile] = useState<
    | { type: 'main' }
    | { type: 'file'; fileId: string; fileName: string }
    | { type: 'image'; image: ProjectImage }
  >({ type: 'main' });
  const [auxFileContents, setAuxFileContents] = useState<Record<string, string>>({});
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imageCopied, setImageCopied] = useState(false);

  // If the active auxiliary file or image was deleted from the project, return to main.tex
  useEffect(() => {
    if (activeFile.type === 'image') {
      const exists = project?.images?.some((img: ProjectImage) => img._id === activeFile.image._id);
      if (project && !exists) {
        setActiveFile({ type: 'main' });
      }
    } else if (activeFile.type === 'file') {
      const exists = project?.files?.some((f: any) => f._id === activeFile.fileId);
      if (project && !exists) {
        setActiveFile({ type: 'main' });
      }
    }
  }, [project?.images, project?.files, activeFile]);

  // Mutation to save auxiliary file content
  const updateFileMutation = useMutation({
    mutationFn: async ({ fileId, content }: { fileId: string; content: string }) => {
      const res = await api.put(`/api/projects/${projectId}/files/${fileId}`, { content });
      return res.data;
    },
    onMutate: () => setIsSaving(true),
    onSuccess: (updatedProject) => {
      setIsSaving(false);
      setLastSaved(new Date());
      queryClient.setQueryData(['project', projectId], updatedProject);
    },
    onError: () => setIsSaving(false),
  });

  // Debounced Autosave for active auxiliary file
  const activeAuxFileId = activeFile.type === 'file' ? activeFile.fileId : null;
  const activeAuxContent = activeAuxFileId !== null ? (auxFileContents[activeAuxFileId] ?? "") : "";

  useEffect(() => {
    if (!project || !activeAuxFileId) return;
    const originalFile = project?.files?.find((f: any) => f._id === activeAuxFileId);
    if (!originalFile) return;
    const originalContent = originalFile.content || "";
    if (activeAuxContent === originalContent) return;

    const timeout = setTimeout(() => {
      updateFileMutation.mutate({ fileId: activeAuxFileId, content: activeAuxContent });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [activeAuxContent, activeAuxFileId, project?.files, updateFileMutation.mutate]);

  const handleSelectImage = (image: ProjectImage) => {
    setImageNaturalSize(null);
    setImageCopied(false);
    setActiveFile({ type: 'image', image });
  };

  const handleSelectFile = (file: ProjectFile) => {
    setActiveFile({ type: 'file', fileId: file._id, fileName: file.name });
    if (auxFileContents[file._id] === undefined) {
      setAuxFileContents(prev => ({ ...prev, [file._id]: file.content || '' }));
    }
  };

  const handleSelectMain = () => {
    setActiveFile({ type: 'main' });
  };

  const handleInsertImageFromPreview = (imageName: string) => {
    setActiveFile({ type: 'main' });
    setTimeout(() => {
      insertTextAtCursor(`\\includegraphics{${imageName}}\n`);
    }, 50);
  };

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage);
    const targetPageEl = document.getElementById(`pdf-page-${newPage}`);
    if (targetPageEl && previewContainerRef.current) {
      targetPageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Load last compiled PDF for this project from cache on mount / project switch
  useEffect(() => {
    let active = true;
    getProjectPdf(projectId).then(blob => {
      if (blob && active) {
        const url = URL.createObjectURL(blob);
        setPdfUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      }
    });
    return () => { active = false; };
  }, [projectId]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  const clearPreviewPdf = async () => {
    setPdfUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setNumPages(0);
    setPageNumber(1);
    await removeProjectPdf(projectId);
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilationError(null);
    try {
      const res = await api.post("/api/compile", { 
        content: latexContent,
        engine: project?.compiler || 'tectonic',
        images: project?.images || [],
        files: (project?.files || []).map((f: any) => ({
          name: f.name,
          content: auxFileContents[f._id] !== undefined ? auxFileContents[f._id] : (f.content || '')
        }))
      }, { responseType: 'blob' });
      
      const blob = res.data;
      if (res.status === 200) {
        if (blob.type && !blob.type.includes('pdf')) {
          await clearPreviewPdf();
          const text = await blob.text();
          let errData: any = {};
          try {
            errData = JSON.parse(text);
          } catch {
            errData = { details: text };
          }
          setCompilationError({
            message: errData.error || "Compilation failed",
            details: errData.details || text,
            rawLog: errData.rawLog || text
          });
          return;
        }

        // Persist the compiled PDF so it stays cached across refreshes
        await saveProjectPdf(projectId, blob);

        setCompilationError(null);
        const url = URL.createObjectURL(blob);
        setPdfUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        await clearPreviewPdf();
        const text = await blob.text();
        let errData: any = {};
        try {
          errData = JSON.parse(text);
        } catch {
          errData = { details: text };
        }
        setCompilationError({
          message: errData.error || "Compilation failed",
          details: errData.details || text,
          rawLog: errData.rawLog || text
        });
      }
    } catch (error: any) {
      console.error("Compilation error caught:", error);
      await clearPreviewPdf();
      
      // Axios error handling when responseType is 'blob'
      if (error.response && error.response.data && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          let errData: any = {};
          try {
            errData = JSON.parse(text);
          } catch {
            errData = { details: text };
          }
          setCompilationError({
            message: errData.error || "Compilation failed",
            details: errData.details || text.substring(0, 500),
            rawLog: errData.rawLog || text
          });
        } catch {
          setCompilationError({
            message: "Compilation failed",
            details: "An error occurred while building the LaTeX document."
          });
        }
      } else {
        setCompilationError({
          message: error.response?.data?.error || error.message || "Failed to reach compiler API",
          details: error.response?.data?.details || "Please check that the server is reachable and try again.",
          rawLog: error.stack || String(error)
        });
      }
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      // 1. Retrieve compiled PDF if present and saved in cache or currently displayed
      let pdfBase64: string | undefined = undefined;
      try {
        let pdfBlob = await getProjectPdf(projectId);
        if (!pdfBlob && pdfUrl) {
          const res = await fetch(pdfUrl);
          pdfBlob = await res.blob();
        }
        if (pdfBlob) {
          pdfBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1] || '';
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });
        }
      } catch (pdfErr) {
        console.warn("Could not retrieve compiled PDF for ZIP export:", pdfErr);
      }

      const safeTitle = (project?.title || "project_source").replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().replace(/\s+/g, "_") || "project_source";
      const filename = `${safeTitle}.zip`;
      const pdfFilename = `${safeTitle}.pdf`;

      const res = await api.post("/api/compile/export", { 
        content: latexContent,
        images: project?.images || [],
        files: (project?.files || []).map((f: any) => ({
          name: f.name,
          content: auxFileContents[f._id] !== undefined ? auxFileContents[f._id] : (f.content || '')
        })),
        pdfBase64,
        filename,
        pdfFilename
      }, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("ZIP Export Error:", error);
      alert("Failed to export ZIP: " + (error.response?.data?.error || error.message || "Unknown error"));
    } finally {
      setIsExportingZip(false);
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
        onInsertImage={(url, name) => insertTextAtCursor(`\\includegraphics{${name}}\n`)}
        activeView={
          activeFile.type === 'main' 
            ? { type: 'main' } 
            : activeFile.type === 'file'
              ? { type: 'file', fileId: activeFile.fileId }
              : { type: 'image', imageId: activeFile.image._id }
        }
        onSelectMain={handleSelectMain}
        onSelectImage={handleSelectImage}
        onSelectFile={handleSelectFile}
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
              onClick={handleExportZip}
              disabled={isCompiling || isExportingZip}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isExportingZip ? <Loader2 className="size-3.5 animate-spin text-gold" /> : <Download className="size-3.5" />} 
              {isExportingZip ? "Exporting ZIP..." : "Export Source (ZIP)"}
            </button>

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
            {/* LaTeX Source / Image Preview Pane */}
            <ResizablePanel defaultSize={50} minSize={20} className="flex h-full flex-col bg-[#0a0a0a]">
              {/* Tab Header Bar */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/50 px-2 py-1 text-xs">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {/* main.tex Tab */}
                  <button
                    type="button"
                    onClick={handleSelectMain}
                    className={cn(
                      "flex items-center gap-2 rounded px-2.5 py-1 text-xs font-medium transition-all duration-200 border",
                      activeFile.type === 'main'
                        ? "bg-secondary text-gold border-gold/40 shadow-sm font-semibold"
                        : "text-muted-foreground border-transparent hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <FileText className="size-3.5" />
                    <span>main.tex</span>
                  </button>

                  {/* Auxiliary File Tab */}
                  {activeFile.type === 'file' && (
                    <div
                      className="flex items-center gap-2 rounded px-2.5 py-1 text-xs font-medium bg-secondary text-gold border border-gold/40 shadow-sm animate-in fade-in zoom-in-95 duration-150"
                    >
                      {activeFile.fileName.endsWith('.bib') ? (
                        <BookOpen className="size-3.5 text-amber-400" />
                      ) : activeFile.fileName.endsWith('.sty') || activeFile.fileName.endsWith('.cls') ? (
                        <FileCode className="size-3.5 text-blue-400" />
                      ) : (
                        <FileText className="size-3.5 text-emerald-400" />
                      )}
                      <span className="max-w-[140px] truncate" title={activeFile.fileName}>{activeFile.fileName}</span>
                      <button
                        type="button"
                        onClick={handleSelectMain}
                        className="p-0.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                        title="Close file and return to main.tex"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )}

                  {/* Selected Image Tab */}
                  {activeFile.type === 'image' && (
                    <div
                      className="flex items-center gap-2 rounded px-2.5 py-1 text-xs font-medium bg-secondary text-gold border border-gold/40 shadow-sm animate-in fade-in zoom-in-95 duration-150"
                    >
                      <ImageIcon className="size-3.5" />
                      <span className="max-w-[140px] truncate" title={activeFile.image.name}>{activeFile.image.name}</span>
                      <button
                        type="button"
                        onClick={handleSelectMain}
                        className="p-0.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                        title="Close preview and return to main.tex"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  )}
                </div>

                {activeFile.type === 'main' ? (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-2">
                    LaTeX Editor
                  </span>
                ) : activeFile.type === 'file' ? (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gold px-2">
                    {activeFile.fileName.endsWith('.bib') ? 'BibTeX References' : 'Subfile Editor'}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectMain}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:text-gold hover:bg-secondary/60 transition-colors"
                  >
                    <FileText className="size-3" />
                    <span>Back to Code</span>
                  </button>
                )}
              </div>

              {/* Active Content: CodeMirror Editor or Image Preview */}
              {activeFile.type !== 'image' ? (
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
                    value={
                      activeFile.type === 'main'
                        ? latexContent
                        : (auxFileContents[activeFile.fileId] ?? project?.files?.find((f: any) => f._id === activeFile.fileId)?.content ?? "")
                    }
                    theme="dark"
                    height="100%"
                    onChange={(val) => {
                      if (activeFile.type === 'main') {
                        setLatexContent(val);
                      } else if (activeFile.type === 'file') {
                        setAuxFileContents(prev => ({ ...prev, [activeFile.fileId]: val }));
                      }
                    }}
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
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0d0e]">
                  {/* Image Preview Toolbar */}
                  <div className="flex items-center justify-between border-b border-border/60 bg-background/30 px-4 py-2 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ImageIcon className="size-4 text-gold shrink-0" />
                      <span className="font-semibold text-foreground truncate" title={activeFile.image.name}>
                        {activeFile.image.name}
                      </span>
                      {imageNaturalSize && (
                        <span className="text-[11px] text-muted-foreground/80 font-mono shrink-0">
                          ({imageNaturalSize.width} × {imageNaturalSize.height} px)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInsertImageFromPreview(activeFile.image.name)}
                        className="inline-flex items-center gap-1.5 rounded bg-gold px-2.5 py-1 text-xs font-semibold text-black hover:bg-gold/90 transition-all active:scale-95 shadow-sm"
                        title="Insert \includegraphics into LaTeX code"
                      >
                        <Plus className="size-3.5" />
                        <span>Insert in LaTeX</span>
                      </button>

                      <a
                        href={activeFile.image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded bg-secondary px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                        title="Open full image in new tab"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Open Original</span>
                      </a>
                    </div>
                  </div>

                  {/* Main Image Canvas */}
                  <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
                    <div className="max-w-full max-h-full flex items-center justify-center p-3 rounded-xl bg-black/50 border border-border/50 shadow-2xl backdrop-blur-sm">
                      <img
                        src={activeFile.image.url}
                        alt={activeFile.image.name}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
                        }}
                        className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-md"
                      />
                    </div>

                    {/* LaTeX Code Quick Snippet */}
                    <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-black/80 border border-border/60 px-3.5 py-2 text-xs font-mono text-zinc-300 shadow-md">
                      <span className="text-muted-foreground select-none">LaTeX:</span>
                      <code className="text-gold select-all font-semibold">{`\\includegraphics{${activeFile.image.name}}`}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(`\\includegraphics{${activeFile.image.name}}`);
                          setImageCopied(true);
                          setTimeout(() => setImageCopied(false), 2000);
                        }}
                        className="ml-2 inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                        title="Copy LaTeX code"
                      >
                        {imageCopied ? (
                          <>
                            <Check className="size-3 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                      onClick={() => handlePageChange(pageNumber - 1)}
                      className="rounded p-0.5 hover:bg-background disabled:opacity-30"
                    >
                      <ChevronLeft className="size-3" />
                    </button>
                    <span className="min-w-[3rem] text-center">{pageNumber} / {numPages || '-'}</span>
                    <button
                      type="button"
                      disabled={pageNumber >= numPages}
                      onClick={() => handlePageChange(pageNumber + 1)}
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
                ref={previewContainerRef}
                className="flex-1 overflow-auto overscroll-contain p-6 bg-[#525659] shadow-inner"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setPreviewZoom((z) => Math.min(Math.max(0.5, z - e.deltaY * 0.001), 3));
                  }
                }}
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const pages = container.querySelectorAll<HTMLElement>('[data-page-number]');
                  for (const page of pages) {
                    const rect = page.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    if (rect.bottom > containerRect.top + 60 && rect.top < containerRect.bottom - 60) {
                      const p = Number(page.getAttribute('data-page-number'));
                      if (p && p !== pageNumber) {
                        setPageNumber(p);
                      }
                      break;
                    }
                  }
                }}
              >
                <div className="min-w-full w-fit flex flex-col items-center">
                  <PdfViewer
                    pdfUrl={pdfUrl}
                    isCompiling={isCompiling}
                    pageNumber={pageNumber}
                    numPages={numPages}
                    previewZoom={previewZoom}
                    onLoadSuccess={onDocumentLoadSuccess}
                    compilationError={compilationError}
                    onRetryCompile={handleCompile}
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
