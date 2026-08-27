import { createFileRoute } from "@tanstack/react-router";
import { ImageStudioView } from "@/features/image-studio/ImageStudioView";

export const Route = createFileRoute("/images")({
  head: () => ({
    meta: [
      { title: "Image Studio — GrantAstraX" },
      {
        name: "description",
        content:
          "Convert images between formats or to PDF, compress to a target size, and upscale without losing detail.",
      },
      { property: "og:title", content: "Image Studio — GrantAstraX" },
      {
        property: "og:description",
        content: "Convert, compress and upscale images in a single premium workspace.",
      },
    ],
  }),
  component: ImageStudioView,
});
