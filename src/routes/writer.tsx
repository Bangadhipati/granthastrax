import { createFileRoute } from "@tanstack/react-router";
import { WriterView } from "@/features/writer/WriterView";

export const Route = createFileRoute("/writer")({
  head: () => ({
    meta: [
      { title: "Writer Desk — GrantAstraX" },
      {
        name: "description",
        content:
          "Choose trim size, paper stock and cover type, get an auto-calculated spine width, and preview your book in 3D before export.",
      },
      { property: "og:title", content: "Writer Desk — GrantAstraX" },
      {
        property: "og:description",
        content: "Print-ready book templates with automatic spine math and a 3D cover preview.",
      },
    ],
  }),
  component: WriterView,
});
