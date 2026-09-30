import { createFileRoute } from "@tanstack/react-router";
import { CoordinationFeedView } from "@/components/coordination-feed-view";

export const Route = createFileRoute("/admin/feed")({
  head: () => ({
    meta: [
      { title: "Coordination Feed & Requests — Super Admin" },
      { name: "description", content: "Review and respond to coordinator category requests and inter-org communications." },
    ],
  }),
  component: AdminFeedPage,
});

function AdminFeedPage() {
  return <CoordinationFeedView variant="admin" />;
}
