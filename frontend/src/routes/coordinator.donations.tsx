import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { getDonations, verifyDonation } from "@/api/client";
import type { Donation } from "@/api/types";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

export const Route = createFileRoute("/coordinator/donations")({
  head: () => ({
    meta: [
      { title: "Donations — ResQ Hub Coordinator" },
      {
        name: "description",
        content: "Verify donor offers, accept resources into inventory or reject them with a recorded reason.",
      },
      { property: "og:title", content: "Donations — ResQ Hub Coordinator" },
      { property: "og:description", content: "Review and verify community donations before they enter relief inventory." },
    ],
  }),
  component: DonationsPage,
});

const STATUSES = ["Pending", "Accepted", "Rejected", "Cancelled"];
const PAGE_SIZE = 8;

function DonationsPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [donor, setDonor] = useState("all");
  const [page, setPage] = useState(1);
  const [accepting, setAccepting] = useState<Donation | null>(null);
  const [rejecting, setRejecting] = useState<Donation | null>(null);
  const [reason, setReason] = useState("");

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["donations", orgId],
    queryFn: () => getDonations(orgId),
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "Accepted" | "Rejected"; note?: string }) =>
      verifyDonation(id, decision, note),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["donations", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", orgId] });
      qc.invalidateQueries({ queryKey: ["dashboard", orgId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Donation ${vars.decision.toLowerCase()}`);
    },
  });

  const categories = useMemo(() => [...new Set(donations.map((d) => d.category))], [donations]);
  const donors = useMemo(() => [...new Set(donations.map((d) => d.donorName))], [donations]);

  const filtered = useMemo(
    () =>
      donations.filter(
        (d) =>
          (status === "all" || d.status === status) &&
          (category === "all" || d.category === category) &&
          (donor === "all" || d.donorName === donor) &&
          (search === "" ||
            [d.code, d.donorName, d.resource, d.pickupLocation].join(" ").toLowerCase().includes(search.toLowerCase())),
      ),
    [donations, status, category, donor, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pending = donations.filter((d) => d.status === "Pending").length;

  return (
    <>
      <PageHeader title="Donations" description={`${pending} donation${pending === 1 ? "" : "s"} awaiting verification.`} />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by code, donor, resource or pickup location"
        filters={[
          { label: "Status", value: status, options: STATUSES, onChange: (v) => { setStatus(v); setPage(1); } },
          { label: "Category", value: category, options: categories, onChange: (v) => { setCategory(v); setPage(1); } },
          { label: "Donor", value: donor, options: donors, onChange: (v) => { setDonor(v); setPage(1); } },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No donations match the current filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Donation</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.code}</TableCell>
                  <TableCell>
                    <span className="block">{d.donorName}</span>
                    <span className="block text-xs text-muted-foreground">{d.donorPhone}</span>
                  </TableCell>
                  <TableCell>
                    <span className="block">{d.resource}</span>
                    <span className="block text-xs text-muted-foreground">{d.category}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {d.quantity} {d.unit}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.pickupLocation}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={d.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {d.status === "Pending" ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setAccepting(d)}>
                            <Check className="mr-1 size-3.5" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-status-danger-foreground hover:bg-status-danger-muted"
                            onClick={() => {
                              setReason("");
                              setRejecting(d);
                            }}
                          >
                            <X className="mr-1 size-3.5" /> Reject
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {d.rejectionReason ? d.rejectionReason : "No action needed"}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={current === pageCount} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!accepting} onOpenChange={(o) => !o && setAccepting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept {accepting?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {accepting?.quantity} {accepting?.unit} of {accepting?.resource} from {accepting?.donorName} will be added
              to your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (accepting) decide.mutate({ id: accepting.id, decision: "Accepted" });
                setAccepting(null);
              }}
            >
              Accept donation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.code}</DialogTitle>
            <DialogDescription>A reason is mandatory and is shared with the donor.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this donation cannot be accepted..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 5}
              onClick={() => {
                if (rejecting) decide.mutate({ id: rejecting.id, decision: "Rejected", note: reason.trim() });
                setRejecting(null);
              }}
            >
              Reject donation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
