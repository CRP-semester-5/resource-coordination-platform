import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check,
  X,
  Trash2,
  Building2,
  Clock,
  CheckCircle2,
  Search,
  Eye,
  MapPin,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { orgsAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/organizations")({
  head: () => ({
    meta: [
      { title: "Organizations Management — ResQ Hub Admin" },
      { name: "description", content: "Review onboarding applications, manage verified relief organizations and branch hubs." },
    ],
  }),
  component: AdminOrganizationsPage,
});

type Tab = "pending" | "all";

function AdminOrganizationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [inspectOrg, setInspectOrg] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rejectingOrg, setRejectingOrg] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  /* ── Queries ── */
  const { data: allOrgs = [], isLoading: allLoading } = useQuery({
    queryKey: ["all-organizations"],
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

  /* ── Mutations ── */
  const approveMutation = useMutation({
    mutationFn: (id: string) => orgsAPI.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-organizations"] });
      qc.invalidateQueries({ queryKey: ["all-organizations"] });
      toast.success("Organization approved successfully! It is now active on the platform.");
      setInspectOrg(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      setInspectOrg(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to reject organization.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orgsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-organizations"] });
      qc.invalidateQueries({ queryKey: ["pending-organizations"] });
      toast.success("Organization deleted from platform.");
      setConfirmDelete(null);
      setInspectOrg(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete organization.");
    },
  });

  /* ── Stats ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeOrgs = (allOrgs as any[]).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (o: any) => o.status === "ACTIVE" || o.status === "APPROVED" || o.status === "active"
  );
  const pendingCount = (pendingOrgs as unknown[]).length;
  const activeCount = activeOrgs.length;
  const totalCount = (allOrgs as unknown[]).length + pendingCount;

  /* ── Filtered data ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source: any[] = tab === "pending" ? pendingOrgs : allOrgs;
  const isLoading = tab === "pending" ? pendingLoading : allLoading;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return source.filter((o: any) => {
      const name = (o.organization_name ?? o.name ?? "").toLowerCase();
      const loc = (o.address ?? o.district ?? "").toLowerCase();
      const desc = (o.description ?? "").toLowerCase();
      const email = (o.email ?? "").toLowerCase();
      const q = search.toLowerCase().trim();
      return (
        !q ||
        name.includes(q) ||
        loc.includes(q) ||
        desc.includes(q) ||
        email.includes(q)
      );
    });
  }, [source, search]);

  function statusColor(status: string) {
    const s = status?.toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED") return "Approved";
    if (s === "PENDING") return "Pending";
    if (s === "REJECTED") return "Rejected";
    if (s === "SUSPENDED" || s === "INACTIVE") return "Suspended";
    return status || "Pending";
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title="Organizations Management"
        description="Review incoming onboarding applications, verify relief organizations, and manage active platform tenants."
      />

      {/* Metric Quick-Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => { setTab("all"); setSearch(""); }}
          className={`p-4 rounded-xl border bg-card flex items-center justify-between cursor-pointer transition-all ${
            tab === "all" ? "border-primary/50 ring-1 ring-primary/20 shadow-sm" : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-foreground">{totalCount}</div>
              <div className="text-xs text-muted-foreground font-medium">Total Registered</div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">View All &rarr;</span>
        </div>

        <div
          onClick={() => { setTab("pending"); setSearch(""); }}
          className={`p-4 rounded-xl border bg-card flex items-center justify-between cursor-pointer transition-all ${
            tab === "pending" ? "border-amber-500/50 ring-1 ring-amber-500/20 shadow-sm" : "border-border hover:border-border/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{pendingCount}</div>
              <div className="text-xs text-muted-foreground font-medium">Pending Review</div>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              Action Required
            </span>
          )}
        </div>

        <div
          onClick={() => { setTab("all"); setSearch(""); }}
          className="p-4 rounded-xl border border-border bg-card flex items-center justify-between cursor-pointer hover:border-border/80 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{activeCount}</div>
              <div className="text-xs text-muted-foreground font-medium">Active Operational Hubs</div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">Verified</span>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/60 p-1 w-fit">
          <button
            type="button"
            onClick={() => { setTab("pending"); setSearch(""); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              tab === "pending"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Pending Applications</span>
            {pendingCount > 0 && (
              <span className="size-5 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setTab("all"); setSearch(""); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              tab === "all"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>All Organizations</span>
            <span className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground border border-border">
              {allOrgs.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, address, or email..."
            className="pl-8 text-xs h-9 bg-card"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              message={
                tab === "pending"
                  ? "No organizations pending approval. All onboarding requests have been reviewed!"
                  : "No organizations found matching your search."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="py-3 px-4 font-semibold text-xs">Organization</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">
                  {tab === "pending" ? "Applicant Details" : "Headquarters"}
                </TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">Operations Scope / Mission</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">Status</TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs">
                  {tab === "pending" ? "Applied Date" : "Registered"}
                </TableHead>
                <TableHead className="py-3 px-4 font-semibold text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filtered.map((org: any) => {
                const id = org.organization_id ?? org.id;
                const name = org.organization_name ?? org.name ?? "—";
                const isPending = tab === "pending" || org.status?.toUpperCase() === "PENDING";
                const initial = name.slice(0, 2).toUpperCase();

                const applicant = org.users || {};
                const applicantName = [applicant.first_name, applicant.last_name].filter(Boolean).join(" ") || applicant.email || "Applicant";
                const applicantEmail = applicant.email || org.email || "";

                return (
                  <TableRow key={id} className="hover:bg-muted/20 transition-colors">
                    {/* Organization Name & Avatar */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                            {name}
                          </div>
                          {org.address && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                              <span className="truncate max-w-[180px]">{org.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Applicant details (Pending) or Location/Contact (All) */}
                    <TableCell className="py-3.5 px-4 text-xs">
                      {isPending && org.applicant_id ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-foreground flex items-center gap-1">
                            <User className="size-3 text-muted-foreground shrink-0" />
                            <span>{applicantName}</span>
                          </div>
                          {applicantEmail && (
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                              <span className="truncate max-w-[160px]">{applicantEmail}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-muted-foreground">
                          <div>{org.address || "Sri Lanka"}</div>
                          {org.phone && <div className="text-[11px]">{org.phone}</div>}
                        </div>
                      )}
                    </TableCell>

                    {/* Scope / Mission description */}
                    <TableCell className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs">
                      <p className="line-clamp-2 leading-relaxed">
                        {org.description || "Relief resource coordination and emergency management unit."}
                      </p>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3.5 px-4">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                          <Clock className="size-3" />
                          Pending Review
                        </span>
                      ) : (
                        <StatusBadge value={statusColor(org.status)} />
                      )}
                    </TableCell>

                    {/* Registered Date */}
                    <TableCell className="py-3.5 px-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground/70" />
                        <span>
                          {org.created_at
                            ? new Date(org.created_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick View / Inspect Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectOrg(org)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                          title="View Full Application Details"
                        >
                          <Eye className="size-3.5" />
                          <span className="hidden md:inline">Inspect</span>
                        </Button>

                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(id)}
                              className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-sm"
                              title="Approve Organization"
                            >
                              <Check className="size-3.5" />
                              <span className="hidden sm:inline">Approve</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={rejectMutation.isPending}
                              onClick={() => setRejectingOrg(org)}
                              className="h-8 px-2 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1"
                              title="Reject Application"
                            >
                              <X className="size-3.5" />
                              <span className="hidden sm:inline">Reject</span>
                            </Button>
                          </>
                        )}

                        {!isPending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Delete organization"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => setConfirmDelete(org)}
                            title="Delete Organization"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Inspect & Review Modal */}
      <Dialog open={!!inspectOrg} onOpenChange={(o) => !o && setInspectOrg(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                {(inspectOrg?.organization_name || inspectOrg?.name || "O").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  {inspectOrg?.organization_name || inspectOrg?.name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Organization Tenant &bull; ID: {inspectOrg?.organization_id?.slice(0, 13)}...
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Mission Statement */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="font-semibold text-foreground mb-1 text-xs">Mission &amp; Operational Scope</div>
              <p className="text-muted-foreground leading-relaxed">
                {inspectOrg?.description || "No description provided."}
              </p>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-border/70">
                <div className="text-muted-foreground font-medium mb-1">Headquarters Base</div>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" />
                  <span>{inspectOrg?.address || "Sri Lanka"}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70">
                <div className="text-muted-foreground font-medium mb-1">Current Status</div>
                <div>
                  <StatusBadge value={statusColor(inspectOrg?.status)} />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70">
                <div className="text-muted-foreground font-medium mb-1">Official Email</div>
                <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                  <Mail className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{inspectOrg?.email || "—"}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/70">
                <div className="text-muted-foreground font-medium mb-1">Official Phone</div>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary shrink-0" />
                  <span>{inspectOrg?.phone || "—"}</span>
                </div>
              </div>
            </div>

            {/* Applicant Information if present */}
            {inspectOrg?.users && (
              <div className="p-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.03]">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                  <User className="size-3.5" />
                  Applicant Coordinator Details
                </div>
                <div className="text-muted-foreground">
                  <strong>{[inspectOrg.users.first_name, inspectOrg.users.last_name].filter(Boolean).join(" ")}</strong>
                  {inspectOrg.users.email && ` (${inspectOrg.users.email})`}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            {inspectOrg?.status?.toUpperCase() === "PENDING" ? (
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const toReject = inspectOrg;
                    setInspectOrg(null);
                    setRejectingOrg(toReject);
                  }}
                  className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                >
                  Reject Application
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(inspectOrg.organization_id)}
                  disabled={approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <Check className="size-4" />
                  Approve Organization
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setInspectOrg(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Modal */}
      <Dialog open={!!rejectingOrg} onOpenChange={(o) => !o && setRejectingOrg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Reject Organization Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the application for{" "}
              <strong>{rejectingOrg?.organization_name || rejectingOrg?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Reason for Rejection (Optional)
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
                  rejectMutation.mutate({
                    id: rejectingOrg.organization_id ?? rejectingOrg.id,
                    reason: rejectionReason,
                  });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>
                {confirmDelete?.organization_name ?? confirmDelete?.name}
              </strong>{" "}
              and all its associated inventories and coordinator memberships from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteMutation.mutate(
                  confirmDelete?.organization_id ?? confirmDelete?.id
                )
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
