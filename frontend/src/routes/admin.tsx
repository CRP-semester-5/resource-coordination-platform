import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Building2 } from "lucide-react";
import { orgsAPI } from "@/api/real";
import { useAuth } from "@/context/auth";
import { PageHeader } from "@/components/page-header";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Super Admin Console — ResQ Hub" }],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) return null;
  
  if (!isAuthenticated || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-red-500">
        Unauthorized. Super Admin access required.
      </div>
    );
  }

  return (
    <AppShell
      title="Super Admin Console"
      variant="admin"
      nav={[
        { label: "Organizations", to: "/admin", icon: Building2, exact: true },
      ]}
    >
      <AdminDashboard />
    </AppShell>
  );
}

function AdminDashboard() {
  const { data: orgsRaw = [], isLoading } = useQuery({
    queryKey: ["all-organizations"],
    queryFn: async () => {
      const res = await orgsAPI.getAll();
      return res.data?.data ?? res.data ?? [];
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgs: any[] = orgsRaw;

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Manage all organizations on the platform."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card mt-6">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">District</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.organization_id ?? o.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{o.name ?? o.org_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.district}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.status ?? "approved"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
