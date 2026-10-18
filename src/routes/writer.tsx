import { createFileRoute } from "@tanstack/react-router";
import { WriterView } from "@/features/writer/WriterView";
import { WriterDeskSkeleton } from "@/components/ui/page-skeletons";

export const Route = createFileRoute("/writer")({
  head: () => ({
    meta: [
      { title: "Writer Desk — GranthAstraX" },
      {
        name: "description",
        content:
          "Choose trim size, paper stock and cover type, get an auto-calculated spine width, and preview your book in 3D before export.",
      },
      { property: "og:title", content: "Writer Desk — GranthAstraX" },
      {
        property: "og:description",
        content: "Print-ready book templates with automatic spine math and a 3D cover preview.",
      },
    ],
  }),
  pendingComponent: WriterDeskSkeleton,
  component: WriterView,
});
