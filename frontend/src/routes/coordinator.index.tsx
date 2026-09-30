import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, ClipboardList, HeartHandshake, ListChecks, Users } from "lucide-react";
import { requestsAPI, donationsAPI, volunteersAPI, tasksAPI, inventoryAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/coordinator/")({
  head: () => ({
    meta: [
      { title: "Coordinator Dashboard — ResQ Hub" },
      {
        name: "description",
        content: "Live overview of open help requests, pending donations, stock alerts, volunteers and overdue relief tasks.",
      },
      { property: "og:title", content: "Coordinator Dashboard — ResQ Hub" },
      { property: "og:description", content: "Live overview of relief operations for your organization." },
    ],
  }),
  component: DashboardPage,
});

/** Helper to safely unpack any React Query result into an array, even if an Axios response was cached */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSafeArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data?.data)) return val.data.data;
  if (Array.isArray(val?.data)) return val.data;
  return [];
}

/** Map backend status strings → UI display strings */
function mapStatus(s: string): string {
  const m: Record<string, string> = {
    PENDING: "Pending",
    VERIFIED: "Approved",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    FULFILLED: "Fulfilled",
    CANCELLED: "Cancelled",
    ASSIGNED: "Under Review",
    IN_PROGRESS: "Partially Fulfilled",
    pending: "Pending",
    verified: "Approved",
    approved: "Approved",
    rejected: "Rejected",
    fulfilled: "Fulfilled",
    cancelled: "Cancelled",
  };
  return m[s] ?? s;
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

function DashboardPage() {
  const { orgId, organization } = useOrganization();

  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ["requests", orgId],
    queryFn: async () => {
      const res = await requestsAPI.getAll(orgId);
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!orgId,
  });

  // Calculate dynamic request metrics safely regardless of whether raw or mapped data is in cache
  const requestList = toSafeArray(rawRequests);
  const requests = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return requestList.map((r: any) => ({
      id: r.request_id ?? r.id,
      orgId: r.organization_id ?? r.orgId ?? "",
      priority: capitalize(r.urgency ?? r.priority ?? "medium"),
      status: mapStatus(r.status),
    }));
  }, [requestList]);
  
  const openRequests = requests.filter(r => !["Fulfilled", "Rejected", "Cancelled"].includes(r.status)).length;
  const criticalRequests = requests.filter(r => r.priority === "Critical" && r.status !== "Fulfilled").length;
  
  const statuses = [
    "Pending",
    "Under Review",
    "Approved",
    "Partially Fulfilled",
    "Fulfilled",
    "Rejected",
    "Cancelled",
  ];
  const requestsByStatus = statuses.map((status) => ({
    status,
    count: requests.filter((r) => r.status === status).length,
  }));

  const maxCount = Math.max(1, ...requestsByStatus.map((r) => r.count));

  const { data: rawDonations = [] } = useQuery({
    queryKey: ["donations", orgId],
    queryFn: async () => {
      const res = await donationsAPI.getAll(orgId);
      const d = res.data?.data ?? res.data ?? [];
      return Array.isArray(d) ? d : [];
    },
    enabled: !!orgId,
  });

  const { data: rawVolunteers = [] } = useQuery({
    queryKey: ["volunteers", orgId],
    queryFn: async () => {
      const res = await volunteersAPI.getAll();
      const d = res.data?.data ?? res.data ?? [];
      return Array.isArray(d) ? d : [];
    },
    enabled: !!orgId,
  });

  const { data: rawTasks = [] } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      const res = await tasksAPI.getAll();
      const d = res.data?.data ?? res.data ?? [];
      return Array.isArray(d) ? d : [];
    },
    enabled: !!orgId,
  });

  const { data: rawInventory = [] } = useQuery({
    queryKey: ["inventory", orgId],
    queryFn: async () => {
      const res = await inventoryAPI.getAll(orgId);
      const d = res.data?.data ?? res.data ?? [];
      return Array.isArray(d) ? d : [];
    },
    enabled: !!orgId,
  });

  const taskList = toSafeArray(rawTasks);
  const volunteerList = toSafeArray(rawVolunteers);
  const donationList = toSafeArray(rawDonations);
  const inventoryList = toSafeArray(rawInventory);

  // Calculate dynamic metrics safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingDonations = donationList.filter((d: any) => d.status === "PENDING" || d.status === "Pending").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeVolunteers = volunteerList.filter((v: any) => v.is_available).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lowStock = inventoryList.filter((i: any) => Number(i.quantity) < 50).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overdueTasks = taskList.filter((t: any) => t.status !== "COMPLETED" && t.status !== "Completed" && new Date(t.created_at).getTime() < Date.now() - 86400000).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Relief operations overview for ${organization?.name ?? "your organization"}.`}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Open requests"
              value={openRequests}
              hint={`${criticalRequests} marked critical`}
              icon={ClipboardList}
            />
            <StatCard
              label="Pending donations"
              value={pendingDonations}
              hint="Awaiting verification"
              icon={HeartHandshake}
              tone="warning"
            />
            <StatCard
              label="Low stock items"
              value={lowStock}
              hint="Below minimum threshold"
              icon={Boxes}
              tone="danger"
            />
            <StatCard
              label="Active volunteers"
              value={activeVolunteers}
              hint="Approved and reachable"
              icon={Users}
              tone="success"
            />
            <StatCard label="Overdue tasks" value={overdueTasks} hint="Past deadline" icon={AlertTriangle} tone="danger" />
            <StatCard
              label="Critical requests"
              value={criticalRequests}
              hint="Highest priority level"
              icon={ListChecks}
              tone="warning"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold">Requests by status</h2>
              <ul className="mt-4 space-y-3">
                {requestsByStatus.map((row) => (
                  <li key={row.status} className="flex items-center gap-3">
                    <span className="w-40 shrink-0">
                      <StatusBadge value={row.status} />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(row.count / maxCount) * 100}%` }}
                      />
                    </span>
                    <span className="w-6 text-right text-sm font-medium tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
