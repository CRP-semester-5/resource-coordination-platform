import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RotateCcw,
  Eye,
  Check,
  X,
  Truck,
  Phone,
  PhoneCall,
  Copy,
  MapPin,
  Calendar,
  Package, PackageCheck, Boxes, ArrowUpRight,
  User,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ClipboardList,
  Activity,
  ShieldCheck,
  HeartHandshake,
  AlertTriangle,
  Loader2,
  KeyRound,
} from "lucide-react";
import { requestsAPI, tasksAPI, inventoryAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
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
        content: "Review, approve and dispatch volunteer relief delivery missions for community help requests.",
      },
      { property: "og:title", content: "Help Requests — ResQ Hub Coordinator" },
      { property: "og:description", content: "Approve, reject and dispatch volunteer response for disaster relief requests." },
    ],
  }),
  component: RequestsPage,
});

const STATUSES = ["Pending", "Under Review", "Approved", "Partially Fulfilled", "Fulfilled", "Rejected", "Cancelled"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const PAGE_SIZE = 8;

function mapStatus(s?: string): string {
  if (!s) return "Pending";
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

function cleanAddress(addr?: string): string {
  if (!addr) return "";
  return addr.trim().replace(/,\s*$/, "");
}

interface NormalizedRequest {
  id: string;
  code: string;
  orgId: string;
  requester: string;
  requesterPhone: string;
  requesterEmail: string;
  category: string;
  resourceType: string;
  quantity: number;
  unit: string;
  priority: string;
  location: string;
  requiredDate: string;
  createdAt: string;
  description: string;
  status: string;
  rejectionReason?: string | undefined;
}

function RequestsPage() {
  const navigate = useNavigate();
  const { orgId } = useOrganization();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  // Selected request for Preview Modal
  const [previewRequestId, setPreviewRequestId] = useState<string | null>(null);

  // Saved Resource Allocations from Inventory
  const [savedAllocations, setSavedAllocations] = useState<Record<string, any>>(() => {
    try {
      return JSON.parse(localStorage.getItem("resq_hub_allocations") || "{}");
    } catch (_) {
      return {};
    }
  });

  const handleStartAllocation = (request: any) => {
    if (!request) return;
    const allocPayload = {
      requestId: request.id,
      requestCode: request.code,
      category: request.category || "Food",
      item: request.resourceType || request.category || "Relief Supplies",
      quantity: request.quantity || 1,
      unit: request.unit || "units",
      requester: request.requester || "Citizen",
      location: request.location || "",
      priority: request.priority,
    };
    try {
      localStorage.setItem("resq_hub_active_allocation", JSON.stringify(allocPayload));
    } catch (_) {}
    toast.info("🎯 Opening Inventory Allocation Sorter...", {
      description: `Navigating to ${request.category || 'Relief'} shelves to select variant.`,
    });
    setPreviewRequestId(null);
    navigate({ to: "/coordinator/inventory" });
  };

  // Accept & Reject Dialog states
  const [approving, setApproving] = useState<NormalizedRequest | null>(null);
  const [rejecting, setRejecting] = useState<NormalizedRequest | null>(null);
  const [reason, setReason] = useState("");
  const [revealedDispatchPins, setRevealedDispatchPins] = useState<Record<string, boolean>>({});
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Create Task from Request state
  const [taskCreatingRequest, setTaskCreatingRequest] = useState<NormalizedRequest | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [taskPriority, setTaskPriority] = useState("HIGH");
  const [taskSkill, setTaskSkill] = useState("Logistics & Transport");
  const [taskType, setTaskType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [volunteersRequired, setVolunteersRequired] = useState<number>(1);

  // 1. Fetch Requests
  const { data: rawRequests = [], isLoading } = useQuery({
    queryKey: ["requests", orgId],
    queryFn: async () => {
      try {
        const res = await requestsAPI.getAll(orgId);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.error("Failed to fetch requests:", err);
        return [];
      }
    },
    refetchInterval: 3000,
    enabled: !!orgId,
  });

  // 2. Fetch Tasks for linking volunteer delivery progress
  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: () => tasksAPI.getAll(),
    refetchInterval: 2500,
  });

  const allTasks: any[] = useMemo(() => {
    const list = tasksRes?.data?.data ?? tasksRes?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [tasksRes]);

  const requests: NormalizedRequest[] = useMemo(() => {
    if (!Array.isArray(rawRequests)) return [];
    return rawRequests.map((r: any) => {
      const u = r.users || {};
      const g = (r.guest_request_contacts && r.guest_request_contacts[0]) || {};
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
      const requester = fullName || g.contact_name || r.requester_name || r.requester || "Citizen in Need";
      const requesterPhone = u.phone || g.contact_phone || r.requester_phone || r.contact_phone || "";
      const requesterEmail = u.email || g.contact_email || r.requester_email || "";
      const reqId = r.request_id || r.id || "";
      const resourceType = r.title || r.resource_type || r.resource_name || r.category || "Relief Supplies";
      const cat = r.category || "General";
      const quantity = Number(r.quantity_required ?? r.quantity ?? 1);
      const unit = r.unit || "units";
      const prio = capitalize(r.urgency || r.priority || "Medium");
      const loc = cleanAddress(r.location || r.delivery_address || "");
      const requiredDate = r.required_date || r.needed_by || "";
      const createdAt = r.created_at || new Date().toISOString();
      const desc = r.description || "";
      const stat = mapStatus(r.status);
      const rejectionReason = r.rejection_reason || undefined;
      const code = reqId.length > 8 ? reqId.slice(0, 8).toUpperCase() : reqId;

      return {
        id: reqId,
        code,
        orgId: r.organization_id || orgId || "",
        requester,
        requesterPhone,
        requesterEmail,
        category: cat,
        resourceType,
        quantity,
        unit,
        priority: prio,
        location: loc,
        requiredDate,
        createdAt,
        description: desc,
        status: stat,
        rejectionReason,
      };
    });
  }, [rawRequests, orgId]);

    const previewRequest = useMemo(() => {
    if (!previewRequestId) return null;
    return requests.find((r) => r.id === previewRequestId) || null;
  }, [requests, previewRequestId]);

  // Auto-open Request Preview Popup after allocating resource from inventory
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fromUrl = urlParams.get("allocatedRequestId");
      const fromStorage = localStorage.getItem("resq_hub_auto_open_request_id");
      const targetReqId = fromUrl || fromStorage;

      if (targetReqId) {
        setPreviewRequestId(targetReqId);
        localStorage.removeItem("resq_hub_auto_open_request_id");
        const existing = JSON.parse(localStorage.getItem("resq_hub_allocations") || "{}");
        setSavedAllocations(existing);
        if (fromUrl) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (err) {
      console.warn("Auto-open effect:", err);
    }
  }, [requests]);

  // Sync allocations whenever preview is opened
  useEffect(() => {
    if (previewRequestId) {
      try {
        setSavedAllocations(JSON.parse(localStorage.getItem("resq_hub_allocations") || "{}"));
      } catch (_) {}
    }
  }, [previewRequestId]);

  // Robust matching helper to link a volunteer delivery task to a request
  const getLinkedTask = (r: NormalizedRequest) => {
    const cleanReqLoc = cleanAddress(r.location).toLowerCase();
    const cleanResource = r.resourceType.toLowerCase().trim();
    const cleanRequester = r.requester.toLowerCase().trim();
    const rId = (r.id || "").toLowerCase();
    const rCode = (r.code || "").toLowerCase();

    return allTasks.find((t: any) => {
      const desc = (t.description || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      const taskLoc = cleanAddress(t.location || "").toLowerCase();
      const tReqId = (t.request_id || "").toLowerCase();

      // 1. Explicit ID / Code Tag match (EXACT)
      if (rId && (tReqId === rId || desc.includes(`[request_id:${rId}]`) || desc.includes(rId))) return true;
      if (rCode && (desc.includes(`[request_code:${rCode}]`) || desc.includes(rCode) || title.includes(rCode))) return true;

      // 2. If this task has a tag explicitly for a DIFFERENT request, NEVER link it to this request!
      const hasExplicitOtherTag = desc.includes("[request_id:") || desc.includes("[request_code:") || (tReqId && tReqId !== rId);
      if (hasExplicitOtherTag) return false;

      // 3. Fallback only for untagged legacy tasks: must match requester AND resource AND exact quantity
      if (title.includes("deliver") && (title.includes(cleanResource) || desc.includes(cleanResource))) {
        if (cleanRequester && (desc.includes(cleanRequester) || title.includes(cleanRequester))) {
          if (r.quantity && (title.includes(String(r.quantity)) || desc.includes(String(r.quantity)))) return true;
        }
      }

      return false;
    });
  };

  const previewLinkedTask = previewRequest ? getLinkedTask(previewRequest) : null;
  const linkedTaskId = previewLinkedTask?.task_id || previewLinkedTask?.id || null;

  // Live Task Details Query (polls every 2s while preview is open and task is linked)
  const { data: liveTaskDetailRes } = useQuery({
    queryKey: ["task-details", linkedTaskId],
    queryFn: () => (linkedTaskId ? tasksAPI.getById(linkedTaskId) : null),
    enabled: !!linkedTaskId && !!previewRequestId,
    refetchInterval: 2000,
  });

  const detailedTask = liveTaskDetailRes?.data?.data || previewLinkedTask;

  const decide = useMutation({
    mutationFn: async ({ id, decision, note }: { id: string; decision: "Approved" | "Rejected" | "Unapprove"; note?: string }) => {
      if (decision === "Approved") return requestsAPI.approve(id, orgId);
      if (decision === "Unapprove") return requestsAPI.unapprove(id, orgId);
      return requestsAPI.reject(id, note ?? "", orgId);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (vars.decision === "Unapprove") {
        toast.success("Request approval undone. Reset to pending.");
      } else {
        toast.success(`Request ${vars.decision.toLowerCase()} successfully`);
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Action failed. Please try again.";
      toast.error(msg);
    },
  });

  
  // Real-time stock check for task dispatch modal
  const { data: stockCheckRes, isLoading: isCheckingStock } = useQuery({
    queryKey: ["check-stock", orgId, taskCreatingRequest?.category, taskCreatingRequest?.quantity],
    queryFn: () => inventoryAPI.checkStock(taskCreatingRequest?.category || "", taskCreatingRequest?.quantity || 1),
    enabled: !!taskCreatingRequest && !!taskCreatingRequest.category,
  });
  const stockCheck = stockCheckRes?.data?.data || stockCheckRes?.data;
  const isStockInsufficient = stockCheck ? !stockCheck.isSufficient : false;

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await tasksAPI.create(data);
      // Auto-approve request if pending
      if (taskCreatingRequest && (taskCreatingRequest.status === "Pending" || taskCreatingRequest.status === "Under Review")) {
        try {
          await requestsAPI.approve(taskCreatingRequest.id);
        } catch (e) {
          console.warn("Auto-approve request note:", e);
        }
      }
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Volunteer delivery task dispatched successfully!");
      setTaskCreatingRequest(null);
    },
    onError: (err: any) => {
      console.error("Create task error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create delivery task";
      toast.error(msg);
    },
  });

  const openTaskCreateForRequest = (r: NormalizedRequest) => {
    setTaskCreatingRequest(r);
    setTaskTitle(`Deliver Aid: ${r.resourceType} (${r.quantity} ${r.unit}) to ${r.requester}`);
    setTaskDescription(
      `[REQUEST_ID:${r.id}] [REQUEST_CODE:${r.code}] Volunteer relief distribution mission for ${r.quantity} ${r.unit} of ${r.resourceType}.\n` +
      `Requester: ${r.requester} (${r.requesterPhone || "Contact in App"})\n` +
      `Delivery Location: ${r.location || "Contact requester for exact address"}\n` +
      `Needed By: ${r.requiredDate ? new Date(r.requiredDate).toLocaleDateString() : "Immediate"}\n` +
      `Reason/Situation: ${r.description || "Emergency disaster relief assistance."}`
    );
    setTaskLocation(r.location || "");
    const upPriority = r.priority.toUpperCase();
    setTaskPriority(TASK_PRIORITIES.includes(upPriority) ? upPriority : "HIGH");
    setTaskSkill("Logistics & Transport");
    setTaskType("INDIVIDUAL");
    setVolunteersRequired(1);
  };

  const handleCopyPhone = (phone: string) => {
    if (!phone || phone === "Not provided") {
      toast.error("No phone number available");
      return;
    }
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast.success("Requester phone copied to clipboard");
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const categories = useMemo(() => [...new Set(requests.map((r) => r.category).filter(Boolean))], [requests]);

  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          (status === "all" || r.status === status) &&
          (priority === "all" || r.priority === priority) &&
          (category === "all" || r.category === category) &&
          (search === "" ||
            [r.code, r.requester, r.resourceType, r.location, r.requesterPhone].join(" ").toLowerCase().includes(search.toLowerCase())),
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
        title="Help Requests"
        description={`${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting review and volunteer dispatch.`}
      />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by requester, resource, phone or location"
        filters={[
          { label: "Status", value: status, options: STATUSES, onChange: (v) => { setStatus(v); setPage(1); } },
          { label: "Priority", value: priority, options: PRIORITIES, onChange: (v) => { setPriority(v); setPage(1); } },
          { label: "Category", value: category, options: categories, onChange: (v) => { setCategory(v); setPage(1); } },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No help requests match the current filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Requester</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Delivery Location</TableHead>
                <TableHead>Volunteer Mission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const linkedTask = getLinkedTask(r);
                return (
                  <TableRow
                    key={r.id || Math.random().toString()}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setPreviewRequestId(r.id)}
                  >
                    <TableCell>
                      <span className="block font-medium text-foreground">{r.requester}</span>
                      <span className="block text-xs font-mono text-muted-foreground">{r.requesterPhone || "Contact in App"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block font-semibold text-foreground">{r.resourceType}</span>
                      <span className="block text-xs text-muted-foreground">{r.category}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {r.quantity} {r.unit}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={r.priority} />
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span className="truncate">{r.location || "Contact requester for location"}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {linkedTask ? (
                        <div className="flex items-center gap-1.5">
                          {linkedTask.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Fulfilled
                            </span>
                          ) : linkedTask.status === "IN_PROGRESS" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                              <Activity className="h-3 w-3 animate-pulse" /> Delivering
                            </span>
                          ) : linkedTask.status === "ASSIGNED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                              <User className="h-3 w-3" /> Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                              <Clock className="h-3 w-3" /> Dispatched
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={r.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setPreviewRequestId(r.id)}
                      >
                        <Eye className="size-3.5" />
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {/* 👁️ PREVIEW & VERIFICATION MODAL */}
      <Dialog open={!!previewRequest} onOpenChange={(open) => !open && setPreviewRequestId(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {previewRequest && (
            <div>
              {/* Header */}
              <div className="border-b border-border bg-muted/30 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {previewRequest.category}
                    </span>
                    <StatusBadge value={previewRequest.priority} />
                    <span className="text-xs text-muted-foreground">
                      #{previewRequest.code}
                    </span>
                  </div>
                  <StatusBadge value={previewRequest.status} />
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {previewRequest.resourceType}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Requested on {new Date(previewRequest.createdAt).toLocaleDateString()} • Needed by:{" "}
                  <strong className="text-foreground">
                    {previewRequest.requiredDate ? new Date(previewRequest.requiredDate).toLocaleDateString() : "Immediate"}
                  </strong>
                </p>
              </div>

              {/* Body Content */}
              <div className="space-y-5 p-6 max-h-[70vh] overflow-y-auto">
                {/* 🚚 LIVE VOLUNTEER TASK PROGRESS BANNER */}
                {detailedTask ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Volunteer Relief Delivery Mission
                          </span>
                          <h4 className="text-sm font-bold text-foreground">{detailedTask.title}</h4>
                        </div>
                      </div>
                      <Link
                        to="/coordinator/tasks"
                        className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-background px-2.5 py-1 text-xs font-semibold text-primary shadow-xs hover:bg-primary/10 transition-colors"
                      >
                        View in Tasks <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    {/* Progress Bar & Status details */}
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">Mission Status:</span>
                        {detailedTask.status === "COMPLETED" ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Delivered to Requester
                          </span>
                        ) : detailedTask.status === "IN_PROGRESS" ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5 animate-pulse" /> Volunteer Delivering Supplies
                          </span>
                        ) : detailedTask.status === "ASSIGNED" ? (
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            Volunteer Assigned (En Route)
                          </span>
                        ) : (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            Dispatched (Waiting for Volunteer)
                          </span>
                        )}
                      </div>

                      <Progress
                        value={
                          detailedTask.status === "COMPLETED"
                            ? 100
                            : detailedTask.status === "IN_PROGRESS"
                            ? 60
                            : detailedTask.status === "ASSIGNED"
                            ? 30
                            : 10
                        }
                        className="h-2"
                      />

                      {/* Assigned Volunteer list if available */}
                      {detailedTask.volunteers && detailedTask.volunteers.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span>
                            Assigned Responder:{" "}
                            <strong className="text-foreground">
                              {detailedTask.volunteers.map((v: any) => v.name || v.first_name || "Volunteer").join(", ")}
                            </strong>
                          </span>
                        </div>
                      )}

                      
                      {/* Dual-Leg Security PINs Verification Box */}
                      {(() => {
                        const isWarehouseDone = (detailedTask.task_progress || []).some(
                          (p: any) => (p.remarks || '').toLowerCase().includes('warehouse') || (p.progress_percent || 0) >= 50
                        ) || detailedTask.status === 'COMPLETED';
                        const isCompleted = detailedTask.status === 'COMPLETED';
                        const isAssigned = detailedTask.status === 'ASSIGNED' || detailedTask.status === 'IN_PROGRESS';
                        const warehousePin = detailedTask.warehouse_pickup_pin || '8421';
                        const isPinRevealed = revealedDispatchPins[detailedTask.id || detailedTask.task_id || ''] || false;

                        return (
                          <div className="mt-3 rounded-lg border border-primary/25 bg-background/90 p-3 text-xs space-y-2.5 shadow-xs">
                            <div className="flex items-center justify-between font-semibold text-foreground border-b border-border/50 pb-1.5">
                              <span className="flex items-center gap-1.5 text-primary font-bold">
                                <ShieldCheck className="h-4 w-4" /> Multi-Stage Security PIN Lifecycle
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">Stage-by-Stage Verification</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {/* Stage 1: Warehouse Dispatch PIN (Disappears after entered) */}
                              <div className={`rounded-md p-2.5 border flex flex-col justify-between ${
                                isWarehouseDone
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                                  : isAssigned
                                  ? 'bg-primary/5 border-primary/30 text-foreground'
                                  : 'bg-muted/30 border-dashed border-border text-muted-foreground'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[11px]">📦 Stage 1: Warehouse Dispatch PIN</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isWarehouseDone
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                      : isAssigned
                                      ? 'bg-primary/20 text-primary animate-pulse'
                                      : 'bg-slate-500/10 text-slate-500'
                                  }`}>
                                    {isWarehouseDone ? 'RELEASED & CLOSED' : isAssigned ? 'ACTIVE FOR STAFF' : 'PENDING ASSIGNMENT'}
                                  </span>
                                </div>

                                <div className="mt-1.5 flex flex-col gap-0.5">
                                  {isWarehouseDone ? (
                                    <>
                                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> PIN Verified & Expired (Closed)
                                      </span>
                                      <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300">
                                        Stock released to volunteer; goods now in vehicle transit.
                                      </span>
                                    </>
                                  ) : isAssigned ? (
                                    isPinRevealed ? (
                                      <>
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="font-mono text-base font-extrabold tracking-widest text-primary">
                                            {warehousePin}
                                          </span>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigator.clipboard.writeText(warehousePin);
                                              toast.success('Warehouse Dispatch PIN copied to clipboard');
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-1" /> Copy
                                          </Button>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                          Provide to volunteer at warehouse upon goods collection.
                                        </span>
                                      </>
                                    ) : (
                                      <div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-6 text-[10px] font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 w-full justify-center gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRevealedDispatchPins((prev) => ({
                                              ...prev,
                                              [detailedTask.id || detailedTask.task_id || '']: true,
                                            }));
                                            toast.info('Warehouse Dispatch PIN revealed for staff handover.');
                                          }}
                                        >
                                          <KeyRound className="h-3 w-3" /> Reveal Dispatch PIN
                                        </Button>
                                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                                          Click to view 4-digit code for volunteer dispatch.
                                        </span>
                                      </div>
                                    )
                                  ) : (
                                    <>
                                      <span className="font-mono text-xs italic text-muted-foreground">
                                        ⏳ PIN Inactive (Awaiting volunteer mission assignment)
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        Generated once volunteer is assigned to task.
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Stage 2: Recipient Doorstep PIN (Private to Recipient) */}
                              <div className={`rounded-md p-2.5 border flex flex-col justify-between ${
                                isCompleted
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                                  : 'bg-muted/40 border-border text-foreground'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[11px]">🤝 Stage 2: Recipient Doorstep PIN</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isCompleted
                                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                                  }`}>
                                    {isCompleted ? 'DELIVERED & FULFILLED' : 'AWAITING HANDOVER'}
                                  </span>
                                </div>
                                <div className="mt-1.5 flex flex-col gap-0.5">
                                  {isCompleted ? (
                                    <>
                                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> •••• (Verified at Doorstep)
                                      </span>
                                      <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300">
                                        Relief delivery verified by recipient; request fulfilled.
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-mono text-sm font-bold tracking-widest text-muted-foreground">
                                        🔒 •••• (Private to Recipient)
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        Recipient provides 4-digit PIN directly from mobile app to volunteer.
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Delivered Banner */}
                      {detailedTask.status === "COMPLETED" && (
                        <div className="mt-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs text-emerald-950 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              <strong>Aid Delivered:</strong> Volunteer has delivered relief items to the requester.
                            </span>
                          </div>
                          {previewRequest.status !== "Fulfilled" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-7 text-xs px-3 shadow-xs"
                              onClick={() => {
                                decide.mutate({ id: previewRequest.id, decision: "Approved" });
                              }}
                            >
                              Mark Request Fulfilled
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/10 p-3.5 text-xs text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      No volunteer delivery mission dispatched yet.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs font-semibold"
                      onClick={() => openTaskCreateForRequest(previewRequest)}
                    >
                      <PlusCircle className="mr-1 h-3.5 w-3.5" />
                      Dispatch Delivery Task
                    </Button>
                  </div>
                )}

                {/* Rejection notice if rejected */}
                {previewRequest.status === "Rejected" && previewRequest.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      Rejection Reason
                    </div>
                    <p className="mt-1 text-xs">{previewRequest.rejectionReason}</p>
                  </div>
                )}

                {/* Request Spec Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">Quantity Needed</span>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {previewRequest.quantity} <span className="text-sm font-normal text-muted-foreground">{previewRequest.unit}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">Urgency Priority</span>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {previewRequest.priority} Priority
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">Required By</span>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {previewRequest.requiredDate ? new Date(previewRequest.requiredDate).toLocaleDateString() : "Immediate"}
                    </p>
                  </div>
                </div>

                
                {/* 📦 HIGH-PRIORITY RESOURCE ALLOCATION & WAREHOUSE STOCK (MIDDLE OF POPUP) */}
                <div className={`rounded-2xl border-2 p-5 shadow-sm transition-all ${
                  savedAllocations[previewRequest.id]
                    ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-background"
                    : "border-primary/40 bg-gradient-to-br from-primary/10 via-amber-500/5 to-background"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${
                        savedAllocations[previewRequest.id]
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/20 border-primary/40 text-primary"
                      }`}>
                        {savedAllocations[previewRequest.id] ? (
                          <PackageCheck className="h-6 w-6" />
                        ) : (
                          <Boxes className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white shadow-xs ${
                            savedAllocations[previewRequest.id] ? "bg-emerald-600" : "bg-primary"
                          }`}>
                            Humanitarian Relief Stock
                          </span>
                          {savedAllocations[previewRequest.id] ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Allocated & Reserved in Warehouse
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> Awaiting Shelf Allocation
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm font-bold text-foreground mt-1">
                          {savedAllocations[previewRequest.id] ? (
                            <>
                              Reserved: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{savedAllocations[previewRequest.id].quantity} {savedAllocations[previewRequest.id].unit}</span> of <span className="text-foreground font-black">{savedAllocations[previewRequest.id].variantName}</span>
                            </>
                          ) : (
                            <>
                              Required: <span className="text-primary font-black">{previewRequest.quantity} {previewRequest.unit}</span> of <span className="text-foreground font-bold">{previewRequest.resourceType || previewRequest.category}</span>
                            </>
                          )}
                        </p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {savedAllocations[previewRequest.id]
                            ? "Stock has been deducted from inventory and reserved. Ready to dispatch volunteer delivery mission."
                            : "Click below to browse warehouse shelves and allocate the exact supply variant for this citizen."}
                        </p>
                      </div>
                    </div>

                    {/* BIG ALLOCATION ACTION BUTTON */}
                    <Button
                      size="lg"
                      onClick={() => handleStartAllocation(previewRequest)}
                      className={`w-full sm:w-auto px-5 py-5 text-sm font-bold shadow-sm gap-2 rounded-xl shrink-0 transition-transform active:scale-95 ${
                        savedAllocations[previewRequest.id]
                          ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <Boxes className="h-5 w-5" />
                      {savedAllocations[previewRequest.id] ? "Change Shelf Allocation" : "📦 Allocate from Inventory"}
                      <ArrowUpRight className="h-4 w-4 ml-0.5 opacity-80" />
                    </Button>
                  </div>

                  {/* If allocated, show clear breakdown grid */}
                  {savedAllocations[previewRequest.id] && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 mt-3.5 border-t border-emerald-500/25 text-xs bg-emerald-500/5 rounded-xl p-3">
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Allocated Variant</span>
                        <strong className="text-foreground font-bold text-sm">{savedAllocations[previewRequest.id].variantName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Warehouse Shelf</span>
                        <strong className="text-foreground font-bold text-sm">{savedAllocations[previewRequest.id].typeName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Reserved Quantity</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                          {savedAllocations[previewRequest.id].quantity} {savedAllocations[previewRequest.id].unit}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block font-medium">Relief Category</span>
                        <span className="text-xs font-semibold text-foreground">
                          {savedAllocations[previewRequest.id].categoryName || previewRequest.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>


                {/* Requester Information & Verification Card */}
                <div className="rounded-xl border border-border bg-muted/10 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    Requester Contact & Verification
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Requester Name</span>
                      <p className="text-sm font-semibold text-foreground">{previewRequest.requester}</p>
                      {previewRequest.requesterEmail && (
                        <p className="text-xs text-muted-foreground">{previewRequest.requesterEmail}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Contact Phone</span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {previewRequest.requesterPhone || "Contact in App"}
                        </span>
                        {previewRequest.requesterPhone && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Copy phone number"
                            onClick={() => handleCopyPhone(previewRequest.requesterPhone)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Location & Maps Link */}
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <span className="text-xs text-muted-foreground">Delivery / Relief Location</span>
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="flex items-start gap-1.5 text-sm text-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <span className="font-medium">
                          {previewRequest.location || "Contact requester for exact location coordinates"}
                        </span>
                      </p>
                      {previewRequest.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(previewRequest.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 rounded bg-muted px-2.5 py-1 text-xs font-medium text-primary hover:underline shadow-xs"
                        >
                          Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Coordinator Phone Call Verification Aid */}
                  {previewRequest.requesterPhone && (
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-950 dark:text-emerald-200">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Call citizen to confirm emergency needs and location:</span>
                      </div>
                      <a
                        href={`tel:${previewRequest.requesterPhone}`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        <Phone className="h-3 w-3" />
                        Call {previewRequest.requesterPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Requester Reason / Description */}
                {previewRequest.description && (
                  <div className="rounded-lg border border-border bg-card p-3.5">
                    <span className="text-xs font-medium text-muted-foreground">Situation & Request Details</span>
                    <p className="mt-1 text-sm text-foreground/90 italic">"{previewRequest.description}"</p>
                  </div>
                )}
              </div>

              {/* Modal Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 p-4">
                <Button variant="ghost" size="sm" onClick={() => setPreviewRequestId(null)}>
                  Close
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  {(previewRequest.status === "Pending" || previewRequest.status === "Under Review") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setReason("");
                        setRejecting(previewRequest);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  )}

                  
                  {/* Allocate from Inventory Button */}
                  {previewRequest.status !== "Fulfilled" && previewRequest.status !== "Rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-bold gap-1.5 shadow-2xs"
                      onClick={() => handleStartAllocation(previewRequest)}
                    >
                      <Boxes className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      {savedAllocations[previewRequest.id] ? "Change Shelf Allocation" : "Allocate from Inventory"}
                    </Button>
                  )}

                  {/* Create or View Volunteer Delivery Task button */}
                  {detailedTask ? (
                    <Link to="/coordinator/tasks">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 font-semibold gap-1.5"
                      >
                        <Truck className="h-4 w-4 text-primary" />
                        View Task ({detailedTask.status})
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/15 font-semibold gap-1.5"
                      onClick={() => openTaskCreateForRequest(previewRequest)}
                    >
                      <Truck className="h-4 w-4 text-primary" />
                      Create Volunteer Delivery Task
                    </Button>
                  )}

                  {previewRequest.status === "Pending" && (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold shadow-xs"
                      onClick={() => setApproving(previewRequest)}
                    >
                      <Check className="h-4 w-4" /> Approve Request
                    </Button>
                  )}

                  {(previewRequest.status === "Approved" || previewRequest.status === "Under Review") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400 font-semibold gap-1.5"
                      onClick={() => {
                        decide.mutate({ id: previewRequest.id, decision: "Unapprove" });
                      }}
                      disabled={decide.isPending}
                    >
                      <RotateCcw className="h-4 w-4" /> Disapprove Request
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🚚 CREATE VOLUNTEER DELIVERY TASK DIALOG */}
      <Dialog open={!!taskCreatingRequest} onOpenChange={(open) => !open && setTaskCreatingRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Truck className="h-5 w-5" />
              Create Volunteer Delivery Task
            </DialogTitle>
            <DialogDescription>
              Dispatch this relief supply delivery mission to volunteers. They can accept and complete it via their mobile app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Task Title</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Deliver 10 Packs Food Ration"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Delivery Location / Address</Label>
              <Input
                value={taskLocation}
                onChange={(e) => setTaskLocation(e.target.value)}
                placeholder="e.g., Relief Camp, Galle"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Required Skill</Label>
                <Input
                  value={taskSkill}
                  onChange={(e) => setTaskSkill(e.target.value)}
                  placeholder="e.g., Logistics & Transport"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Assignment Mode: Individual vs Team */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Assignment Mode</Label>
                <span className="text-xs text-muted-foreground">Who executes this?</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={taskType === "INDIVIDUAL" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setTaskType("INDIVIDUAL");
                    setVolunteersRequired(1);
                  }}
                >
                  <User className="h-4 w-4" /> Individual (1 Volunteer)
                </Button>
                <Button
                  type="button"
                  variant={taskType === "TEAM" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setTaskType("TEAM");
                    if (volunteersRequired < 2) setVolunteersRequired(3);
                  }}
                >
                  <Users className="h-4 w-4" /> Team Mission
                </Button>
              </div>

              {taskType === "TEAM" && (
                <div className="pt-2 border-t border-border">
                  <Label className="text-xs font-semibold">Number of Volunteers Needed</Label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={volunteersRequired}
                    onChange={(e) => setVolunteersRequired(Math.max(2, parseInt(e.target.value) || 2))}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Multiple volunteers can join and contribute to this mission.
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold">Mission Instructions & Details</Label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={4}
                className="mt-1 font-mono text-xs"
              />
            </div>

            {/* Live Warehouse Stock Verification Banner */}
            {isCheckingStock ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                Checking warehouse inventory availability...
              </div>
            ) : stockCheck ? (
              stockCheck.isSufficient ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold">Warehouse Stock Available:</span> In Stock: <strong>{stockCheck.available}</strong> units (Requested: {stockCheck.required} units).
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    SUFFICIENT
                  </span>
                </div>
              ) : (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-800 dark:text-red-300 space-y-1">
                  <div className="flex items-center justify-between font-bold text-red-700 dark:text-red-400">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                      INSUFFICIENT WAREHOUSE STOCK
                    </span>
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                      SHORTAGE: -{stockCheck.shortage} units
                    </span>
                  </div>
                  <p className="text-[11px] text-red-600 dark:text-red-300">
                    Warehouse only has <strong>{stockCheck.available}</strong> units in stock, but this citizen request requires <strong>{stockCheck.required}</strong> units. Please restock warehouse before dispatching task.
                  </p>
                </div>
              )
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskCreatingRequest(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
              disabled={!taskTitle.trim() || createTaskMutation.isPending || isStockInsufficient}
              onClick={() => {
                const tag = taskCreatingRequest ? `[REQUEST_ID:${taskCreatingRequest.id}] [REQUEST_CODE:${taskCreatingRequest.code}] ` : '';
                createTaskMutation.mutate({
                  title: taskTitle.trim(),
                  description: `${tag}${taskDescription.trim()}`,
                  priority: taskPriority,
                  required_skill: taskSkill.trim() || undefined,
                  task_type: taskType,
                  volunteers_required: volunteersRequired,
                  location: taskLocation.trim() || undefined,
                });
              }}
            >
              {createTaskMutation.isPending ? "Dispatching..." : isStockInsufficient ? "Insufficient Warehouse Stock" : "Dispatch Task to Volunteers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ APPROVE CONFIRMATION DIALOG */}
      <AlertDialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request {approving?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {approving?.quantity} {approving?.unit} of {approving?.resourceType} requested by {approving?.requester} will be approved for fulfillment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (approving) decide.mutate({ id: approving.id, decision: "Approved" });
                setApproving(null);
              }}
            >
              Confirm Approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ❌ REJECT WITH MANDATORY REASON DIALOG */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>A reason is mandatory and will be visible to the requester.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this request cannot be fulfilled (e.g., duplicated, outside coverage area, or insufficient resources)..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 5 || decide.isPending}
              onClick={() => {
                if (rejecting) decide.mutate({ id: rejecting.id, decision: "Rejected", note: reason.trim() });
                setRejecting(null);
              }}
            >
              {decide.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
