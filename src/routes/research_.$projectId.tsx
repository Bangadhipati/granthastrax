import { createFileRoute } from "@tanstack/react-router";
import { ResearchWorkspace } from "@/features/research/ResearchWorkspace";

export const Route = createFileRoute("/research_/$projectId")({
  component: ResearchWorkspaceRoute,
});

function ResearchWorkspaceRoute() {
  const { projectId } = Route.useParams();
  return <ResearchWorkspace projectId={projectId} />;
}
