import { useState, useEffect, useRef } from "react";
import { 
  Loader2, AlertCircle, Terminal, Copy, Check, 
  ChevronDown, ChevronUp, RefreshCw 
} from "lucide-react";

export interface CompilationErrorInfo {
  message: string;
  details?: string;
  rawLog?: string;
}

interface PdfViewerProps {
  pdfUrl: string | null;
  isCompiling: boolean;
  pageNumber: number;
  numPages: number;
  previewZoom: number;
  onLoadSuccess: (data: { numPages: number }) => void;
  compilationError?: CompilationErrorInfo | null;
  onRetryCompile?: () => void;
}

export function PdfViewer({
  pdfUrl,
  isCompiling,
  pageNumber,
  numPages,
  previewZoom,
  onLoadSuccess,
  compilationError,
  onRetryCompile,
}: PdfViewerProps) {
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [PdfComponents, setPdfComponents] = useState<{
    Document: any;
    Page: any;
  } | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);

  // Measure rendered document dimensions to bind outer scroll boundaries accurately
  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const updateSize = () => {
      const width = el.offsetWidth || el.scrollWidth;
      const height = el.offsetHeight || el.scrollHeight;
      if (width > 0 && height > 0) {
        setContentSize({ width, height });
      }
    };
    updateSize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width;
        const height = entry.borderBoxSize?.[0]?.blockSize || entry.contentRect.height;
        if (width > 0 && height > 0) {
          setContentSize({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [pdfUrl, numPages, PdfComponents]);

  // Only import react-pdf at runtime in the browser
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      const reactPdf = await import("react-pdf");
      await import("react-pdf/dist/Page/AnnotationLayer.css");
      await import("react-pdf/dist/Page/TextLayer.css");
      
      reactPdf.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${reactPdf.pdfjs.version}/build/pdf.worker.min.mjs`;

      if (!cancelled) {
        setPdfComponents({
          Document: reactPdf.Document,
          Page: reactPdf.Page,
        });
      }
    }

    loadPdf();
    return () => { cancelled = true; };
  }, []);

  if (isCompiling && !pdfUrl) {
    const unscaledWidth = 800;
    const unscaledHeight = 1131;
    const scaledWidth = Math.round(unscaledWidth * previewZoom);
    const scaledHeight = Math.round(unscaledHeight * previewZoom);

    return (
      <div 
        className="relative shrink-0 flex justify-center"
        style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
      >
        <div 
          className="flex h-[1131px] w-[800px] items-center justify-center bg-white shadow-xl origin-top-left transition-transform duration-75 animate-pulse"
          style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}
        >
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-gold" />
            <p className="font-medium text-black">Building Document...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyLog = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = compilationError?.rawLog || compilationError?.details || compilationError?.message || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If compilation error occurred and not currently compiling, show professional error UI
  if (!isCompiling && compilationError) {
    const errorText = compilationError.details || compilationError.message;
    
    // Detect helpful contextual hints
    let hint: string | null = null;
    if (errorText.includes("fontspec") || errorText.includes("cannot be found")) {
      hint = "Font configuration issue: Ensure font names match available OpenType/TrueType fonts or standard LaTeX font packages.";
    } else if (errorText.includes("Undefined control sequence")) {
      hint = "Undefined command: Check for typos in your LaTeX macro or ensure the required package is imported in the preamble with \\usepackage{...}.";
    } else if (errorText.includes("Missing $ inserted")) {
      hint = "Math syntax error: A math symbol or subscript/superscript was used outside of inline ($...$) or display (\\[...\\]) math mode.";
    } else if (errorText.includes("bidi")) {
      hint = "Bidi / Language issue: 'bidi=basic' requires LuaTeX; use 'bidi=default' or standard Babel language options instead.";
    }

    return (
      <div className="w-full max-w-2xl mx-auto my-6 flex flex-col gap-5 p-6 rounded-2xl bg-[#141517] border border-red-500/30 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                Compilation Failed
              </span>
              <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                Tectonic Engine
              </span>
            </div>
          </div>

          {onRetryCompile && (
            <button
              type="button"
              onClick={onRetryCompile}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-black transition-all duration-200 hover:bg-gold/90 hover:shadow-md active:scale-95"
            >
              <RefreshCw className="size-3.5" /> Recompile
            </button>
          )}
        </div>

        {/* Primary Error Box */}
        <div className="rounded-xl border border-red-500/25 bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-500/10 p-2 text-red-400 border border-red-500/20 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-300 mb-1">
                {compilationError.message || "LaTeX Build Error"}
              </h3>
              <div className="mt-2 rounded-lg bg-black/60 border border-red-500/20 p-3 font-mono text-xs text-red-200/90 whitespace-pre-wrap break-words leading-relaxed select-text">
                {errorText}
              </div>
            </div>
          </div>

          {hint && (
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-200/90">
              <span className="font-semibold text-amber-400 shrink-0">Tip:</span>
              <span>{hint}</span>
            </div>
          )}
        </div>

        {/* Full Terminal Log Accordion */}
        {compilationError.rawLog && (
          <div className="rounded-xl border border-zinc-800 bg-black/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800/60">
              <button
                type="button"
                onClick={() => setIsLogExpanded(prev => !prev)}
                className="flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                <Terminal className="size-3.5 text-muted-foreground" />
                <span>Compiler Raw Log</span>
                {isLogExpanded ? (
                  <ChevronUp className="size-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyLog}
                className="inline-flex items-center gap-1.5 rounded bg-zinc-800/80 px-2 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy Log</span>
                  </>
                )}
              </button>
            </div>

            {isLogExpanded && (
              <div className="p-4 font-mono text-[11px] text-zinc-300 max-h-72 overflow-auto select-text whitespace-pre leading-5 bg-[#0b0c0e]">
                {compilationError.rawLog}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Still loading react-pdf
  if (!PdfComponents) {
    const unscaledWidth = 800;
    const unscaledHeight = 1131;
    const scaledWidth = Math.round(unscaledWidth * previewZoom);
    const scaledHeight = Math.round(unscaledHeight * previewZoom);

    if (pdfUrl) {
      return (
        <div 
          className="relative shrink-0 flex justify-center"
          style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
        >
          <div 
            className="flex h-[1131px] w-[800px] items-center justify-center bg-white shadow-xl origin-top-left"
            style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}
          >
            <Loader2 className="size-8 animate-spin text-gold" />
          </div>
        </div>
      );
    }
    return (
      <div 
        className="relative shrink-0 flex justify-center"
        style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
      >
        <div 
          className="flex h-[1131px] w-[800px] flex-col items-center justify-center bg-white shadow-xl text-muted-foreground/60 origin-top-left"
          style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}
        >
          <p>Click "Compile" to generate PDF</p>
        </div>
      </div>
    );
  }

  const { Document, Page } = PdfComponents;

  if (pdfUrl) {
    const unscaledWidth = contentSize?.width || 800;
    const unscaledHeight = contentSize?.height || (numPages ? numPages * 1147 : 1147);
    const scaledWidth = Math.round(unscaledWidth * previewZoom);
    const scaledHeight = Math.round(unscaledHeight * previewZoom);

    return (
      <div 
        className="relative shrink-0 flex justify-center"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
        }}
      >
        {isCompiling && (
          <div className="sticky top-2 left-1/2 -translate-x-1/2 z-30 mb-2 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 rounded-full bg-slate-900/90 text-white px-4 py-1.5 text-xs font-medium shadow-2xl backdrop-blur-md border border-amber-500/40 animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-amber-400" />
              <span>Recompiling PDF...</span>
            </div>
          </div>
        )}
        <div
          ref={contentRef}
          className="transition-transform duration-75 origin-top-left"
          style={{
            width: `${unscaledWidth}px`,
            transform: `scale(${previewZoom})`,
            transformOrigin: 'top left',
          }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={onLoadSuccess}
            loading={
              <div className="flex h-[400px] w-[800px] items-center justify-center bg-white shadow-xl">
                <Loader2 className="size-8 animate-spin text-gold" />
              </div>
            }
            className="flex flex-col gap-4"
          >
            {Array.from(new Array(numPages || 1), (el, index) => (
              <div 
                key={`page_${index + 1}`} 
                id={`pdf-page-${index + 1}`}
                data-page-number={index + 1}
                className="shadow-xl bg-white"
              >
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={800}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    );
  }

  const emptyWidth = Math.round(800 * previewZoom);
  const emptyHeight = Math.round(1131 * previewZoom);

  return (
    <div 
      className="relative shrink-0 flex justify-center"
      style={{ width: `${emptyWidth}px`, height: `${emptyHeight}px` }}
    >
      <div 
        className="flex h-[1131px] w-[800px] flex-col items-center justify-center bg-white shadow-xl text-muted-foreground origin-top-left transition-transform duration-75"
        style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top left' }}
      >
        <div className="flex flex-col items-center gap-3 opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p className="text-lg font-medium">Ready to Compile</p>
          <p className="text-sm">Click "Compile to PDF" to generate your document</p>
        </div>
      </div>
    </div>
  );
}
