import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { orgsAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export const Route = createFileRoute("/admin/organizations")({
  head: () => ({
    meta: [{ title: "Organizations — ResQ Hub Admin" }],
  }),
  component: AdminOrganizationsPage,
});

type Tab = "pending" | "all";

function AdminOrganizationsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);

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
      toast.success("Organization approved successfully.");
    },
    onError: () => toast.error("Failed to approve organization."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => orgsAPI.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-organizations"] });
      qc.invalidateQueries({ queryKey: ["all-organizations"] });
      toast.success("Organization rejected.");
    },
    onError: () => toast.error("Failed to reject organization."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orgsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-organizations"] });
      toast.success("Organization deleted.");
      setConfirmDelete(null);
    },
    onError: () => toast.error("Failed to delete organization."),
  });

  /* ── Filtered data ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source: any[] = tab === "pending" ? pendingOrgs : allOrgs;
  const isLoading = tab === "pending" ? pendingLoading : allLoading;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = source.filter((o: any) => {
    const name = o.organization_name ?? o.name ?? "";
    const district = o.district ?? "";
    return (
      search === "" ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      district.toLowerCase().includes(search.toLowerCase())
    );
  });

  function statusColor(status: string) {
    const s = status?.toUpperCase();
    if (s === "APPROVED") return "Approved";
    if (s === "PENDING") return "Pending";
    if (s === "REJECTED") return "Rejected";
    return status;
  }

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Approve, reject and manage all organizations on the platform."
      />

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 rounded-lg border border-border bg-muted p-1 w-fit">
        {(["pending", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSearch(""); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "pending" ? (
              <span className="flex items-center gap-2">
                Pending
                {(pendingOrgs as unknown[]).length > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {(pendingOrgs as unknown[]).length}
                  </span>
                )}
              </span>
            ) : (
              "All organizations"
            )}
          </button>
        ))}
      </div>

      <Toolbar
        search={search}
        onSearch={(v) => setSearch(v)}
        placeholder="Search by name or district…"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card mt-4">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            message={
              tab === "pending"
                ? "No organizations pending approval."
                : "No organizations found."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Category</TableHead>
                {tab === "all" && <TableHead>Status</TableHead>}
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filtered.map((org: any) => {
                const id = org.organization_id ?? org.id;
                const name = org.organization_name ?? org.name ?? "—";
                const isPending =
                  tab === "pending" ||
                  org.status?.toUpperCase() === "PENDING";

                return (
                  <TableRow key={id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {org.district ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {org.category ?? "—"}
                    </TableCell>
                    {tab === "all" && (
                      <TableCell>
                        <StatusBadge value={statusColor(org.status)} />
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground">
                      {org.created_at
                        ? new Date(org.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {isPending && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Approve organization"
                              className="text-emerald-600 hover:bg-emerald-50"
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate(id)}
                              title="Approve"
                            >
                              <Check className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Reject organization"
                              className="text-red-600 hover:bg-red-50"
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(id)}
                              title="Reject"
                            >
                              <X className="size-4" />
                            </Button>
                          </>
                        )}
                        {tab === "all" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete organization"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setConfirmDelete(org)}
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
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

      {/* Delete confirm dialog */}
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
              and all its associated data. This action cannot be undone.
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
    </>
  );
}
