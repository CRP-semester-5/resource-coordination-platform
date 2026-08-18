import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, CheckCircle2, XCircle, Tag } from "lucide-react";
import { orgsAPI, categoriesAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin Overview — ResQ Hub" }],
  }),
  component: AdminOverviewPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-lg"
        style={{ background: color + "20" }}
      >
        <Icon className="size-5" style={{ color }} />
      </span>
      <div>
        {isLoading ? (
          <Skeleton className="h-7 w-12 mb-1" />
        ) : (
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function AdminOverviewPage() {
  const { data: allOrgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["all-organizations"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: async () => {
      const res = await orgsAPI.getAll();
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: pendingOrgs = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-organizations"],
    queryFn: async () => {
      const res = await orgsAPI.getPending();
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesAPI.getAll();
      return res.data?.data ?? res.data ?? [];
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approvedOrgs = (allOrgs as any[]).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => o.status === "APPROVED" || o.status === "approved"
  ).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rejectedOrgs = (allOrgs as any[]).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => o.status === "REJECTED" || o.status === "rejected"
  ).length;

  const isLoading = orgsLoading || pendingLoading || catsLoading;

  return (
    <>
      <PageHeader
        title="Platform Overview"
        description="High-level summary of all organizations and resource categories on ResQ Hub."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mt-2">
        <StatCard
          label="Total organizations"
          value={(allOrgs as unknown[]).length}
          icon={Building2}
          color="var(--primary)"
          isLoading={isLoading}
        />
        <StatCard
          label="Pending approval"
          value={(pendingOrgs as unknown[]).length}
          icon={Clock}
          color="#F59E0B"
          isLoading={isLoading}
        />
        <StatCard
          label="Approved organizations"
          value={approvedOrgs}
          icon={CheckCircle2}
          color="#10B981"
          isLoading={isLoading}
        />
        <StatCard
          label="Rejected organizations"
          value={rejectedOrgs}
          icon={XCircle}
          color="#EF4444"
          isLoading={isLoading}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Recent pending orgs */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Pending Organizations</h2>
            {(pendingOrgs as unknown[]).length > 0 && (
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {(pendingOrgs as unknown[]).length} awaiting review
              </span>
            )}
          </div>
          {pendingLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (pendingOrgs as unknown[]).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No organizations pending approval.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(pendingOrgs as any[]).slice(0, 5).map((org: any) => (
                <li key={org.organization_id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{org.organization_name ?? org.name}</p>
                    <p className="text-xs text-muted-foreground">{org.district ?? "—"}</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Categories summary */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Resource Categories</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {(categories as unknown[]).length} total
            </span>
          </div>
          {catsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (categories as unknown[]).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No categories created yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(categories as any[]).slice(0, 6).map((cat: any) => (
                <li key={cat.category_id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {cat.unit_of_measure}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
