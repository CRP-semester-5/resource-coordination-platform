import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Boxes, ClipboardList, HeartHandshake, LifeBuoy, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/context/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResQ Hub — Community Resilience Resource Coordination" },
      {
        name: "description",
        content:
          "Coordinate disaster relief requests, donations, inventory, volunteers and tasks across community organizations from one calm, unified console.",
      },
    ],
  }),
  component: Landing,
});

const highlights = [
  { icon: ClipboardList, title: "Help requests", text: "Verify, approve or reject community requests with a full status trail." },
  { icon: HeartHandshake, title: "Donations", text: "Review donor offers and move accepted items straight into inventory." },
  { icon: Boxes, title: "Inventory", text: "Live stock levels with low-stock and expiry alerts per warehouse." },
  { icon: Users, title: "Volunteers & tasks", text: "Approve volunteers, match skills and track relief task progress." },
];

function Landing() {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.navigate({ to: isSuperAdmin ? "/admin" : "/coordinator" });
    } else if (!loading && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isAuthenticated, isSuperAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-status-success" />
          ResQ Hub Platform
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Resource Coordination Platform for Community Resilience
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          ResQ Hub brings emergency requests, donations, inventory, volunteers and relief tasks into a single
          coordinated workspace so community organizations can respond faster and with less duplication.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/coordinator"
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <LifeBuoy className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Coordinator workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dashboard, requests, donations, inventory, volunteers and tasks for your organizations.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open workspace <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            to="/admin"
            className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Super admin console</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verify organizations, manage users and roles, resource categories and the platform audit log.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open console <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h) => (
            <div key={h.title} className="rounded-xl border border-border bg-card p-4">
              <h.icon className="size-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">{h.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
