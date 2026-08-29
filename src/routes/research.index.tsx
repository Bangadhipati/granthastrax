import { createFileRoute } from "@tanstack/react-router";
import { ResearchView } from "@/features/research/ResearchView";

export const Route = createFileRoute("/research/")({
  head: () => ({
    meta: [
      { title: "Research Desk — GranthAstraX" },
      {
        name: "description",
        content:
          "Write papers in a Word-like editable preview while clean LaTeX is generated beside you, then export to PDF, DOCX or TeX.",
      },
      { property: "og:title", content: "Research Desk — GranthAstraX" },
      {
        property: "og:description",
        content: "A split LaTeX and WYSIWYG canvas built for researchers.",
      },
    ],
  }),
  component: ResearchView,
});
