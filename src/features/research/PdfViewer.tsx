import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PdfViewerProps {
  pdfUrl: string | null;
  isCompiling: boolean;
  pageNumber: number;
  previewZoom: number;
  onLoadSuccess: (data: { numPages: number }) => void;
}

export function PdfViewer({
  pdfUrl,
  isCompiling,
  pageNumber,
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
      <div className="flex h-[400px] w-[210mm] items-center justify-center bg-white shadow-xl">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-gold" />
          <p>Compiling LaTeX via API...</p>
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
      <Document
        file={pdfUrl}
        onLoadSuccess={onLoadSuccess}
        loading={
          <div className="flex h-[400px] w-[210mm] items-center justify-center bg-white shadow-xl">
            <Loader2 className="size-8 animate-spin text-gold" />
          </div>
        }
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
