import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Eye, X } from "lucide-react";
import { requestsAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export const Route = createFileRoute("/coordinator/requests")({
  head: () => ({
    meta: [
      { title: "Help Requests — ResQ Hub Coordinator" },
      {
        name: "description",
        content: "Review, approve or reject community help requests and follow each request through its status timeline.",
      },
      { property: "og:title", content: "Help Requests — ResQ Hub Coordinator" },
      { property: "og:description", content: "Approve, reject and track disaster relief requests submitted by the community." },
    ],
  }),
  component: RequestsPage,
});

const STATUSES = ["Pending", "Under Review", "Approved", "Partially Fulfilled", "Fulfilled", "Rejected", "Cancelled"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const PAGE_SIZE = 8;

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


function RequestsPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [detail, setDetail] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [approving, setApproving] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ["requests", orgId],
    queryFn: async () => {
      const res = await requestsAPI.getAll();
      const list = res.data?.data ?? res.data ?? [];
      // Normalize backend shape to UI shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return list.map((r: any) => ({
        id: r.request_id ?? r.id,
        code: r.request_id?.slice(0, 8) ?? r.id?.slice(0, 8) ?? "—",
        orgId: r.organization_id ?? "",
        requester: r.requester_name ?? r.requester ?? "Unknown",
        requesterPhone: r.requester_phone ?? "",
        category: r.category ?? "General",
        resourceType: r.title ?? r.resource_type ?? r.resource_name ?? "",
        quantity: r.quantity_required ?? r.quantity ?? 0,
        unit: r.unit ?? "",
        priority: capitalize(r.urgency ?? r.priority ?? "medium"),
        location: r.location ?? "",
        requiredDate: r.required_date ?? r.needed_by ?? "",
        createdAt: r.created_at ?? "",
        description: r.description ?? "",
        status: mapStatus(r.status),
        rejectionReason: r.rejection_reason,
        timeline: r.timeline ?? [
          { status: mapStatus(r.status), at: r.created_at ?? "", note: undefined },
        ],
      }));
    },
    enabled: !!orgId,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requests: any[] = rawRequests;

  const decide = useMutation({
    mutationFn: async ({ id, decision, note }: { id: string; decision: "Approved" | "Rejected"; note?: string }) => {
      if (decision === "Approved") return requestsAPI.approve(id);
      return requestsAPI.reject(id, note ?? "");
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["requests", orgId] });
      qc.invalidateQueries({ queryKey: ["dashboard", orgId] });
      toast.success(`Request ${vars.decision.toLowerCase()}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Action failed. Please try again.";
      toast.error(msg);
    },
  });

  const categories = useMemo(() => [...new Set(requests.map((r) => r.category))], [requests]);

  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (priority === "all" || r.priority === priority) &&
          (category === "all" || r.category === category) &&
          (search === "" ||
            [r.code, r.requester, r.resourceType, r.location].join(" ").toLowerCase().includes(search.toLowerCase())),
      ),
    [requests, status, priority, category, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pendingCount = requests.filter((r) => r.status === "Pending" || r.status === "Under Review").length;

  return (
    <>
      <PageHeader
        title="Help requests"
        description={`${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting your review.`}
      />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by code, requester, resource or location"
        filters={[
          { label: "Status", value: status, options: STATUSES, onChange: (v) => { setStatus(v); setPage(1); } },
          { label: "Priority", value: priority, options: PRIORITIES, onChange: (v) => { setPriority(v); setPage(1); } },
          { label: "Category", value: category, options: categories, onChange: (v) => { setCategory(v); setPage(1); } },
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
          <EmptyState message="No requests match the current filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.code}</TableCell>
                  <TableCell>{r.requester}</TableCell>
                  <TableCell>
                    <span className="block">{r.resourceType}</span>
                    <span className="block text-xs text-muted-foreground">{r.category}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.quantity} {r.unit}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={r.priority} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.requiredDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={r.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="View request" onClick={() => setDetail(r)}>
                        <Eye className="size-4" />
                      </Button>
                      {(r.status === "Pending" || r.status === "Under Review") && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Approve request"
                            className="text-status-success-foreground hover:bg-status-success-muted"
                            onClick={() => setApproving(r)}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Reject request"
                            className="text-status-danger-foreground hover:bg-status-danger-muted"
                            onClick={() => {
                              setReason("");
                              setRejecting(r);
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
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

      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.code}</SheetTitle>
                <SheetDescription>{detail.description}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Requester", detail.requester],
                    ["Contact", detail.requesterPhone],
                    ["Category", detail.category],
                    ["Resource", detail.resourceType],
                    ["Quantity", `${detail.quantity} ${detail.unit}`],
                    ["Location", detail.location],
                    ["Required by", new Date(detail.requiredDate).toLocaleDateString()],
                    ["Submitted", new Date(detail.createdAt).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>

                {detail.rejectionReason && (
                  <div className="rounded-lg border border-status-danger/30 bg-status-danger-muted p-3 text-sm text-status-danger-foreground">
                    <p className="font-medium">Rejection reason</p>
                    <p className="mt-1">{detail.rejectionReason}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold">Status timeline</p>
                  <ol className="mt-3 space-y-4 border-l border-border pl-4">
                    {detail.timeline.map((t: { status: string; at: string; note?: string }, i: number) => (
                      <li key={i} className="relative">
                        <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" />
                        <StatusBadge value={t.status} />
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(t.at).toLocaleString()}</p>
                        {t.note && <p className="mt-0.5 text-sm">{t.note}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {approving?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {approving?.quantity} {approving?.unit} of {approving?.resourceType} will be reserved for{" "}
              {approving?.requester}. The requester is notified immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (approving) decide.mutate({ id: approving.id, decision: "Approved" });
                setApproving(null);
              }}
            >
              Approve request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejecting?.code}</DialogTitle>
            <DialogDescription>A reason is mandatory and is shared with the requester.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this request cannot be fulfilled..."
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
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
