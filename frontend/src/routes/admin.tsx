import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { Building2, Tag, LayoutDashboard } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app-shell";
import { useAuth } from "@/context/auth";

const nav: NavItem[] = [
  { label: "Overview",      to: "/admin",             icon: LayoutDashboard, exact: true },
  { label: "Organizations", to: "/admin/organizations", icon: Building2 },
  { label: "Categories",    to: "/admin/categories",   icon: Tag },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Super Admin Console — ResQ Hub" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();
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

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-red-500">
        Unauthorized. Super Admin access required.
      </div>
    );
  }

  return (
    <AppShell nav={nav} title="Super Admin Console" variant="admin">
      <Outlet />
    </AppShell>
  );
}
