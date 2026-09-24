import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect, useCallback } from "react";
import { Boxes, ClipboardList, HeartHandshake, LayoutDashboard, ListChecks, Users, UserPlus } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { OrganizationProvider } from "@/context/organization";
import { useAuth } from "@/context/auth";
import { useNotifications, type NotificationPayload } from "@/hooks/useNotifications";

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

  const handleNotification = useCallback((n: NotificationPayload) => {
    // Simple browser notification — replace with your toast component if available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(n.type.replace(/_/g, " "), { body: n.message });
    } else {
      console.info("[notification]", n.message);
    }
  }, []);

  // Subscribe to real-time notifications for the entire coordinator session
  useNotifications({ onNotification: handleNotification });

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
