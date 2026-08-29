import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PdfViewerProps {
  pdfUrl: string | null;
  isCompiling: boolean;
  pageNumber: number;
  numPages: number;
  previewZoom: number;
  onLoadSuccess: (data: { numPages: number }) => void;
}

export function PdfViewer({
  pdfUrl,
  isCompiling,
  pageNumber,
  numPages,
  previewZoom,
  onLoadSuccess,
}: PdfViewerProps) {
  const [PdfComponents, setPdfComponents] = useState<{
    Document: any;
    Page: any;
  } | null>(null);

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

  if (isCompiling) {
    return (
      <div 
        className="flex h-[297mm] w-[210mm] items-center justify-center bg-white shadow-xl transition-transform duration-75 origin-top animate-pulse"
        style={{ transform: `scale(${previewZoom})` }}
      >
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-gold" />
          <p className="font-medium text-black">Building Document...</p>
        </div>
      </div>
    );
  }

  // Still loading react-pdf
  if (!PdfComponents) {
    if (pdfUrl) {
      return (
        <div 
          className="flex h-[400px] w-[210mm] items-center justify-center bg-white shadow-xl"
          style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-in-out' }}
        >
          <Loader2 className="size-8 animate-spin text-gold" />
        </div>
      );
    }
    return (
      <div 
        className="flex h-[297mm] w-[210mm] flex-col items-center justify-center bg-white shadow-xl text-muted-foreground/60"
        style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease-in-out' }}
      >
        <p>Click "Compile" to generate PDF</p>
      </div>
    );
  }

  const { Document, Page } = PdfComponents;

  if (pdfUrl) {
    return (
      <div 
        className="transition-transform duration-75 origin-top"
        style={{ transform: `scale(${previewZoom})` }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onLoadSuccess}
          loading={
            <div className="flex h-[400px] w-[210mm] items-center justify-center bg-white shadow-xl">
              <Loader2 className="size-8 animate-spin text-gold" />
            </div>
          }
          className="flex flex-col gap-4"
        >
          {Array.from(new Array(numPages || 1), (el, index) => (
            <div key={`page_${index + 1}`} className="shadow-xl bg-white mb-4">
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
    );
  }

  return (
    <div 
      className="flex h-[297mm] w-[210mm] flex-col items-center justify-center bg-white shadow-xl text-muted-foreground transition-transform duration-75 origin-top"
      style={{ transform: `scale(${previewZoom})` }}
    >
      <div className="flex flex-col items-center gap-3 opacity-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p className="text-lg font-medium">Ready to Compile</p>
        <p className="text-sm">Click "Compile to PDF" to generate your document</p>
      </div>
    </div>
  );
}
