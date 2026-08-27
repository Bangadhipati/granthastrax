import { createFileRoute } from "@tanstack/react-router";
import { DocumentStudioView } from "@/features/document-studio/DocumentStudioView";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Document Studio — GranthAstraX" },
      {
        name: "description",
        content:
          "Convert documents between PDF, DOCX, TeX, EPUB and more, compress to a target size, or expand for print output.",
      },
      { property: "og:title", content: "Document Studio — GranthAstraX" },
      {
        property: "og:description",
        content: "Document conversion, compression and print-grade expansion in one place.",
      },
    ],
  }),
  component: DocumentStudioView,
});
