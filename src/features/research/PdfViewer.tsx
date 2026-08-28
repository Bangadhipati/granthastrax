import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

// These imports only run on the client (this file is lazy-loaded)
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
    <div className="flex h-[297mm] w-[210mm] flex-col items-center justify-center bg-white shadow-xl text-muted-foreground/60">
      <p>Click "Compile" to generate PDF</p>
    </div>
  );
}
