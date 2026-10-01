import { createFileRoute } from "@tanstack/react-router";
import { HomePageView } from "@/components/home-page-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResQ Hub — Resource Coordination Platform for Community Resilience" },
      {
        name: "description",
        content:
          "Coordinate disaster relief requests, donations, inventory, volunteers and tasks across community organizations from one calm, unified console.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <HomePageView />;
}
