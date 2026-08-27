import { useState, useEffect } from "react";

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

import { Plus, ArrowLeft, Download, Bold, Italic, Sigma, List, Table2, Quote, FileArchive, FileText, File, ZoomIn, ZoomOut, Maximize2, Play } from "lucide-react";
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
  const [htmlContent, setHtmlContent] = useState(`<h2>Graph Attention for Protein Folding</h2><p>Debarghya Bhowmick</p><p><strong>Abstract — </strong>We introduce a sparse attention formulation that reduces folding error by 14.2% on CASP15.</p><h3>1. Introduction</h3><p>Protein structure prediction remains a central problem in computational biology.</p>`);
  const [latexContent, setLatexContent] = useState(latex);
  const [lastEdited, setLastEdited] = useState<"html" | "latex">("html");

  const [latexZoom, setLatexZoom] = useState(1);
  const [previewZoom, setPreviewZoom] = useState(1);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    
    // Use a native event listener with passive: false to prevent browser default zoom
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  const handleCompile = () => {
    if (lastEdited === "html") {
      setLatexContent(convertHtmlToLatex(htmlContent));
    } else {
      setHtmlContent(convertLatexToHtml(latexContent));
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExtension,
      TextStyle,
      FontFamily,
    ],
    content: htmlContent,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[500px]",
      },
    },
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      setLastEdited("html");
    },
  });

  useEffect(() => {
    if (editor && htmlContent !== editor.getHTML()) {
      editor.commands.setContent(htmlContent);
    }
  }, [htmlContent, editor]);

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

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
          
          {editor && (
            <div className="flex flex-1 items-center justify-center gap-1.5 px-4 overflow-x-auto no-scrollbar">
              
              
              <Select
                onValueChange={(val) => {
                  if (val === "p") editor.chain().focus().setParagraph().run();
                  else editor.chain().focus().toggleHeading({ level: parseInt(val) as any }).run();
                }}
              >
                <SelectTrigger className="w-[110px] h-8 text-xs border-border bg-background">
                  <SelectValue placeholder="Heading" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p">Paragraph</SelectItem>
                  <SelectItem value="1">Heading 1</SelectItem>
                  <SelectItem value="2">Heading 2</SelectItem>
                  <SelectItem value="3">Heading 3</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => editor.chain().focus().setFontSize(val).run()}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs border-border bg-background">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => editor.chain().focus().setColumns(parseInt(val)).run()}
              >
                <SelectTrigger className="w-[110px] h-8 text-xs border-border bg-background">
                  <div className="flex items-center gap-2">
                    <ColumnsIcon className="size-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Columns" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => editor.chain().focus().setFontFamily(val).run()}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs border-border bg-background">
                  <SelectValue placeholder="Font Style" />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((f) => (
                    <SelectItem key={f.name} value={f.value} style={{ fontFamily: f.value }}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-4 w-px bg-border mx-1" />

              <div className="flex items-center rounded-md border border-border bg-background p-0.5">
                <ToolbarButton isActive={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} icon={Bold} />
                <ToolbarButton isActive={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} icon={Italic} />
                <ToolbarButton isActive={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} icon={UnderlineIcon} />
              </div>

              <div className="h-4 w-px bg-border mx-1" />

              <div className="flex items-center rounded-md border border-border bg-background p-0.5 hidden sm:flex">
                <ToolbarButton isActive={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} icon={AlignLeft} />
                <ToolbarButton isActive={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} icon={AlignCenter} />
                <ToolbarButton isActive={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} icon={AlignRight} />
                <ToolbarButton isActive={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} icon={AlignJustify} />
              </div>

              <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

              <div className="flex items-center rounded-md border border-border bg-background p-0.5">
                <ToolbarButton isActive={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List} />
                <ToolbarButton isActive={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} icon={ListOrdered} />
              </div>

              <div className="h-4 w-px bg-border mx-1" />
              
              <div className="flex items-center rounded-md border border-border bg-background p-0.5">
                <ToolbarButton onClick={addImage} icon={ImageIcon} />
              </div>

            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompile}
              className="inline-flex items-center gap-2 rounded-md bg-gold px-3 py-1.5 text-xs font-medium text-black transition-opacity duration-300 hover:opacity-90"
            >
              <Play className="size-3.5 fill-current" /> Compile
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
                <span className="text-gold">LaTeX</span>
              </div>
              <div 
                className="flex-1 overflow-hidden relative"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setLatexZoom((z) => Math.min(Math.max(0.5, z - e.deltaY * 0.005), 3));
                  }
                }}
              >
                <div style={{ transform: `scale(${latexZoom})`, transformOrigin: 'top left', width: `${100 / latexZoom}%`, height: `${100 / latexZoom}%` }}>
                  <textarea
                    value={latexContent}
                    onChange={(e) => {
                      setLatexContent(e.target.value);
                      setLastEdited("latex");
                    }}
                    spellCheck={false}
                    className="h-full w-full resize-none border-none bg-transparent p-6 font-mono text-[12px] leading-relaxed text-muted-foreground outline-none focus:ring-0"
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-border hover:bg-gold/50 transition-colors z-10 w-1">
              </ResizableHandle>

            {/* WYSIWYG Pane */}
            <ResizablePanel defaultSize={60} minSize={30} className="flex h-full flex-col bg-background">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/40 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>Live preview</span>
                <span className="text-gold">Editable</span>
              </div>
              <div 
                className="flex-1 overflow-auto bg-muted/30 p-8 lg:p-12 relative flex justify-center items-start"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    setPreviewZoom((z) => Math.min(Math.max(0.5, z - e.deltaY * 0.005), 3));
                  }
                }}
              >
                <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }} className="w-[210mm] min-h-[297mm] bg-white p-12 shadow-xl ring-1 ring-border/20 text-black shrink-0">
                  {editor && <EditorContent editor={editor} />}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </EditorShell>
  );
}

