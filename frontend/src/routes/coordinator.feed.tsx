import { createFileRoute } from "@tanstack/react-router";
import { CoordinationFeedView } from "@/components/coordination-feed-view";

export const Route = createFileRoute("/coordinator/feed")({
  head: () => ({
    meta: [
      { title: "Coordination Feed — ResQ Hub" },
      { name: "description", content: "Inter-organization communication and resource category requests." },
    ],
  }),
  component: CoordinatorFeedPage,
});

function CoordinatorFeedPage() {
  return <CoordinationFeedView variant="coordinator" />;
}
