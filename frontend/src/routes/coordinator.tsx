import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Boxes, ClipboardList, HeartHandshake, LayoutDashboard, ListChecks, Users, UserPlus } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { OrganizationProvider } from "@/context/organization";
import { useAuth } from "@/context/auth";

const nav: NavItem[] = [
  { label: "Dashboard", to: "/coordinator", icon: LayoutDashboard, exact: true },
  { label: "Requests", to: "/coordinator/requests", icon: ClipboardList },
  { label: "Donations", to: "/coordinator/donations", icon: HeartHandshake },
  { label: "Inventory", to: "/coordinator/inventory", icon: Boxes },
  { label: "Volunteers", to: "/coordinator/volunteers", icon: Users },
  { label: "Tasks", to: "/coordinator/tasks", icon: ListChecks },
  { label: "Team", to: "/coordinator/team", icon: UserPlus },
];

export const Route = createFileRoute("/coordinator")({
  component: CoordinatorLayout,
});

function CoordinatorLayout() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <OrganizationProvider>
      <AppShell nav={nav} title="Coordinator workspace" variant="coordinator">
        <Outlet />
      </AppShell>
    </OrganizationProvider>
  );
}
