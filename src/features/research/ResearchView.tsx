import { useState, useEffect, useRef } from "react";
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';

import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


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

const projects = [
  { title: "Graph Attention for Protein Folding", updated: "2 hours ago" },
  { title: "Low-Rank Adapters in Edge Inference", updated: "Yesterday" },
  { title: "Thermal Drift in MEMS Resonators", updated: "4 days ago" },
  { title: "Federated Consent Ledgers", updated: "2 weeks ago" },
];

const latex = `\\documentclass[twocolumn]{article}
\\usepackage{amsmath,graphicx}

\\title{Graph Attention for Protein Folding}
\\author{Debarghya Bhowmick}

\\begin{document}
\\maketitle

\\begin{abstract}
We introduce a sparse attention formulation that
reduces folding error by 14.2\\% on CASP15.
\\end{abstract}

\\section{Introduction}
Protein structure prediction remains a central
problem in computational biology. We define the
residue interaction energy as
\\begin{equation}
  E(x) = \\sum_{i<j} w_{ij}\\,\\phi(\\|x_i - x_j\\|).
\\end{equation}
\\end{document}`;

export function ResearchView() {
  const [editing, setEditing] = useState(false);

  if (editing) return <Editor onBack={() => setEditing(false)} />;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Research Desk"
        title="Your papers, in progress."
        description="Every project carries its own LaTeX source, editable preview and export history."
        action={
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity duration-300 hover:opacity-90"
              >
                <Plus className="size-4" /> Create project
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Name the project</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input placeholder="E.g., Graph Attention for Protein Folding" />
              </div>
              <DialogFooter>
                <Button onClick={() => setEditing(true)}>Proceed</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mx-auto mt-12 max-w-7xl px-6">
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
              {projects.map((p) => (
                <TableRow
                  key={p.title}
                  onClick={() => setEditing(true)}
                  className="cursor-pointer group"
                >
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="text-muted-foreground">{p.updated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
                        title="Download ZIP"
                      >
                        <FileArchive className="size-3.5" /> ZIP
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
                        title="Download PDF"
                      >
                        <File className="size-3.5" /> PDF
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
                        title="Download DOCX"
                      >
                        <FileText className="size-3.5" /> DOCX
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
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


function Editor({ onBack }: { onBack: () => void }) {
  const [latexContent, setLatexContent] = useState(`\\\\documentclass{article}
\\\\usepackage[utf8]{inputenc}
\\\\usepackage{amsmath}
\\\\usepackage{geometry}
\\\\geometry{a4paper, margin=1in}

\\\\title{Graph Attention for Protein Folding}
\\\\author{Debarghya Bhowmick}
\\\\date{}

\\\\begin{document}

\\\\maketitle

\\\\begin{abstract}
We introduce a sparse attention formulation that reduces folding error by 14.2\\\\% on CASP15.
\\\\end{abstract}

\\\\section{Introduction}
Protein structure prediction remains a central problem in computational biology.

\\\\end{document}`);

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
      const formData = new FormData();
      formData.append("filecontents[]", latexContent);
      formData.append("filename[]", "document.tex");
      formData.append("engine", "pdflatex");
      formData.append("return", "pdf");

      const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const blob = await res.blob();
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
    <EditorShell>
      <ResearchSidebar />

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
                  {isCompiling ? (
                    <div className="flex h-[400px] w-[210mm] items-center justify-center bg-white shadow-xl">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <Loader2 className="size-8 animate-spin text-gold" />
                        <p>Compiling LaTeX via API...</p>
                      </div>
                    </div>
                  ) : pdfUrl ? (
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<div className="flex h-[400px] w-[210mm] items-center justify-center bg-white shadow-xl"><Loader2 className="size-8 animate-spin text-gold" /></div>}
                      className="shadow-xl"
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        className="bg-white"
                        scale={previewZoom * 1.3}
                      />
                    </Document>
                  ) : (
                    <div className="flex h-[297mm] w-[210mm] flex-col items-center justify-center bg-white shadow-xl text-muted-foreground/60">
                      <p>Click "Compile" to generate PDF</p>
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditorShell>
  );
}


