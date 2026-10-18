import { createFileRoute } from "@tanstack/react-router";
import { ResearchWorkspace } from "@/features/research/ResearchWorkspace";
import { ResearchWorkspaceSkeleton } from "@/components/ui/page-skeletons";

export const Route = createFileRoute("/research_/$projectId")({
  pendingComponent: ResearchWorkspaceSkeleton,
  component: ResearchWorkspaceRoute,
});

function ResearchWorkspaceRoute() {
  const { projectId } = Route.useParams();
  return <ResearchWorkspace projectId={projectId} />;
}
