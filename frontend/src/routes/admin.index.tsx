import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  Check,
  X,
  MapPin,
  Mail,
  Phone,
  User,
  ExternalLink,
  ShieldCheck,
  Plus,
  Search,
  Activity,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { orgsAPI, categoriesAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — ResQ Hub" },
      {
        name: "description",
        content: "Super Administrator platform overview and management console.",
      },
    ],
  }),
  component: AdminOverviewPage,
});

function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  color,
  isLoading,
  badge,
}: {
  label: string;
  value: number;
  subLabel?: string | undefined;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  isLoading?: boolean | undefined;
  badge?: string | undefined;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between gap-4 shadow-sm hover:border-border/80 transition-colors">
      <div className="flex items-center gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-xl shadow-inner"
          style={{ background: color + "18" }}
        >
          <Icon className="size-6" style={{ color }} />
        </span>
        <div>
          {isLoading ? (
            <Skeleton className="h-7 w-12 mb-1" />
          ) : (
            <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
          )}
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          {subLabel && <p className="text-[11px] text-muted-foreground/75 mt-0.5">{subLabel}</p>}
        </div>
      </div>
      {badge && (
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border self-start"
          style={{
            background: color + "15",
            color: color,
            borderColor: color + "30",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function AdminOverviewPage() {
  const qc = useQueryClient();
  const [orgSearch, setOrgSearch] = useState("");
  const [rejectingOrg, setRejectingOrg] = useState<{ id: string; name: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatUnit, setNewCatUnit] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");

  /* ── Queries ── */
  const { data: allOrgsRaw = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["all-organizations"],
    queryFn: async () => {
      const res = await orgsAPI.getAll();
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  const { data: pendingOrgsRaw = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-organizations"],
    queryFn: async () => {
      const res = await orgsAPI.getPending();
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  const { data: categoriesRaw = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoriesAPI.getAll();
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
  });

  // Defensive array extraction to guarantee safe array operations on navigation
  const allOrgs = useMemo(() => {
    if (Array.isArray(allOrgsRaw)) return allOrgsRaw;

    if (Array.isArray((allOrgsRaw as any)?.data)) return (allOrgsRaw as any).data;
    return [];
  }, [allOrgsRaw]);

  const pendingOrgs = useMemo(() => {
    if (Array.isArray(pendingOrgsRaw)) return pendingOrgsRaw;

    if (Array.isArray((pendingOrgsRaw as any)?.data)) return (pendingOrgsRaw as any).data;
    return [];
  }, [pendingOrgsRaw]);

  const categories = useMemo(() => {
    if (Array.isArray(categoriesRaw)) return categoriesRaw;

    if (Array.isArray((categoriesRaw as any)?.data)) return (categoriesRaw as any).data;
    return [];
  }, [categoriesRaw]);

  /* ── Mutations ── */
  const approveMutation = useMutation({
    mutationFn: (id: string) => orgsAPI.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-organizations"] });
      qc.invalidateQueries({ queryKey: ["all-organizations"] });
      toast.success("Organization approved successfully! It is now active on the platform.");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to approve organization.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => orgsAPI.reject(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-organizations"] });
      qc.invalidateQueries({ queryKey: ["all-organizations"] });
      toast.success("Organization application rejected.");
      setRejectingOrg(null);
      setRejectionReason("");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reject organization.");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: {
      name: string;
      unit_of_measure: string;
      description?: string | undefined;
    }) => categoriesAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Resource category created successfully.");
      setShowAddCategory(false);
      setNewCatName("");
      setNewCatUnit("");
      setNewCatDesc("");
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create category.");
    },
  });

  /* ── Calculations & Metrics ── */

  const activeOrgs = (allOrgs as any[]).filter(
    (o: any) => o.status === "ACTIVE" || o.status === "APPROVED" || o.status === "active",
  );

  const rejectedCount = (allOrgs as any[]).filter(
    (o: any) =>
      o.status === "REJECTED" ||
      o.status === "rejected" ||
      o.status === "SUSPENDED" ||
      o.status === "INACTIVE",
  ).length;

  const totalRegistered = (allOrgs as unknown[]).length + (pendingOrgs as unknown[]).length;
  const pendingCount = (pendingOrgs as unknown[]).length;
  const approvedCount = activeOrgs.length;

  const isLoading = orgsLoading || pendingLoading || catsLoading;

  // Filtered active orgs for roster display
  const filteredActiveOrgs = useMemo(() => {
    const q = orgSearch.toLowerCase().trim();
    if (!q) return activeOrgs;

    return activeOrgs.filter((org: any) => {
      const name = (org.organization_name || org.name || "").toLowerCase();
      const addr = (org.address || "").toLowerCase();
      const email = (org.email || "").toLowerCase();
      return name.includes(q) || addr.includes(q) || email.includes(q);
    });
  }, [activeOrgs, orgSearch]);

  function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim() || !newCatUnit.trim()) {
      toast.error("Please fill in both name and unit of measure.");
      return;
    }
    createCategoryMutation.mutate({
      name: newCatName.trim(),
      unit_of_measure: newCatUnit.trim(),
      description: newCatDesc.trim() ? newCatDesc.trim() : undefined,
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Platform Health Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Platform Overview"
          description="High-level operational summary of all relief organizations and resource categories on ResQ Hub."
        />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold w-fit self-start sm:self-auto">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Healthy &bull; Kong Gateway Active</span>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Organizations"
          value={totalRegistered}
          subLabel="Registered platform tenants"
          icon={Building2}
          color="#0D9488"
          isLoading={isLoading}
        />
        <StatCard
          label="Pending Approval"
          value={pendingCount}
          subLabel="Awaiting Super Admin review"
          icon={Clock}
          color="#F59E0B"
          badge={pendingCount > 0 ? "Action Required" : undefined}
          isLoading={isLoading}
        />
        <StatCard
          label="Approved Organizations"
          value={approvedCount}
          subLabel="Active operational hubs"
          icon={CheckCircle2}
          color="#10B981"
          badge="Verified"
          isLoading={isLoading}
        />
        <StatCard
          label="Resource Categories"
          value={(categories as unknown[]).length}
          subLabel={`${rejectedCount} rejected / inactive orgs`}
          icon={Tag}
          color="#6366F1"
          isLoading={isLoading}
        />
      </div>

      {/* Main Split: Pending Approvals & Resource Categories */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Organizations Review Section */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Clock className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Pending Organizations</h2>
                  <p className="text-xs text-muted-foreground">
                    Applications requiring onboarding approval
                  </p>
                </div>
              </div>
              {pendingCount > 0 && (
                <span className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-full font-bold">
                  {pendingCount} awaiting review
                </span>
              )}
            </div>

            {pendingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingCount === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <ShieldCheck className="size-6" />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  All Applications Reviewed
                </div>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  There are no pending organization applications at this time. All submissions have
                  been processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {}
                {(pendingOrgs as any[]).map((org: any) => {
                  const applicant = org.users || {};
                  const applicantName =
                    [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") ||
                    applicant.email ||
                    "Organization Applicant";
                  const applicantEmail = applicant.email || org.email || "";

                  return (
                    <div
                      key={org.organization_id}
                      className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.03] flex flex-col gap-3 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            {org.organization_name || org.name}
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Pending
                            </span>
                          </div>
                          {org.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {org.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                        {org.address && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{org.address}</span>
                          </div>
                        )}
                        {applicantName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">Applicant: {applicantName}</span>
                          </div>
                        )}
                        {applicantEmail && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{applicantEmail}</span>
                          </div>
                        )}
                        {org.phone && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Phone className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{org.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRejectingOrg({
                              id: org.organization_id,
                              name: org.organization_name || org.name,
                            })
                          }
                          disabled={rejectMutation.isPending || approveMutation.isPending}
                          className="h-8 px-3 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
                        >
                          <X className="size-3.5" />
                          <span>Reject</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(org.organization_id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                        >
                          <Check className="size-3.5" />
                          <span>Approve Organization</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Manage approvals &amp; organization details
            </span>
            <Link
              to="/admin/organizations"
              className="font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Go to Organizations Manager &rarr;
            </Link>
          </div>
        </section>

        {/* Categories Summary Section */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Tag className="size-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Resource Categories</h2>
                  <p className="text-xs text-muted-foreground">
                    Standardized relief supplies &amp; measurement units
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddCategory(true)}
                  className="h-7 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus className="size-3" />
                  <span>New</span>
                </Button>
                <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted">
                  {(categories as unknown[]).length} total
                </span>
              </div>
            </div>

            {catsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ) : (categories as unknown[]).length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Tag className="size-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No categories defined yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[340px] overflow-y-auto pr-1">
                {}
                {(categories as any[]).map((cat: any) => (
                  <div
                    key={cat.category_id}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-muted/30 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                      {cat.unit_of_measure}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Manage units, codes, and relief types</span>
            <Link
              to="/admin/categories"
              className="font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Manage All Categories &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* Active Organizations Directory (Full Roster on Dashboard) */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Active Relief Organizations</h2>
              <p className="text-xs text-muted-foreground">
                Verified operational hubs currently coordinating on ResQ Hub
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search active orgs..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Link
              to="/admin/organizations"
              className="text-xs text-primary font-semibold hover:underline shrink-0 hidden sm:inline"
            >
              View Full Directory &rarr;
            </Link>
          </div>
        </div>

        {orgsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredActiveOrgs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No active organizations match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Headquarters / Address</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {}
                {filteredActiveOrgs.map((org: any) => {
                  const initial = (org.organization_name || org.name || "O")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr key={org.organization_id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">
                              {org.organization_name || org.name}
                            </div>
                            {org.tenant_id && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                ID: {org.organization_id.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                          <span>{org.address || "Sri Lanka"}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        <div>{org.email || "—"}</div>
                        {org.phone && <div className="text-[11px]">{org.phone}</div>}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active Hub
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          to="/admin/organizations"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <span>Manage</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectingOrg} onOpenChange={(o) => !o && setRejectingOrg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <XCircle className="size-5" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              Provide an optional reason for rejecting the application from{" "}
              <strong>{rejectingOrg?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Rejection Reason (Optional)
            </label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete verification documentation or non-qualifying relief branch"
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setRejectingOrg(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (rejectingOrg) {
                  rejectMutation.mutate({ id: rejectingOrg.id, reason: rejectionReason });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={(o) => !o && setShowAddCategory(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Tag className="size-5" />
              Add Resource Category
            </DialogTitle>
            <DialogDescription>
              Define a new standardized category of emergency relief supply.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Category Name *
              </label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Tarpaulins, First Aid Kits, Dry Rations"
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Unit of Measure *
              </label>
              <Input
                value={newCatUnit}
                onChange={(e) => setNewCatUnit(e.target.value)}
                placeholder="e.g. boxes, packets, units, kg, litres"
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Description (Optional)
              </label>
              <Input
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Brief description of items in this category"
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddCategory(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createCategoryMutation.isPending}>
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
