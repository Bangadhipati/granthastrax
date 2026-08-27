import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/features/home/HomeView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GranthAstraX — Precision Studio for Research & Publishing" },
      {
        name: "description",
        content:
          "GranthAstraX unifies image and document conversion, LaTeX research writing with live WYSIWYG editing, and print-ready book design in one premium dark workspace.",
      },
      { property: "og:title", content: "GranthAstraX — Precision Studio for Research & Publishing" },
      {
        property: "og:description",
        content:
          "Convert, compress, write LaTeX visually and design print-ready books. One refined workspace by Debarghya Bhowmick.",
      },
    ],
  }),
  component: HomeView,
});
