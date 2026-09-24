import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  Check,
  X,
  Truck,
  Phone,
  PhoneCall,
  Copy,
  MapPin,
  Calendar,
  Package,
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
} from "lucide-react";
import { donationsAPI, tasksAPI } from "@/api/real";
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

export const Route = createFileRoute("/coordinator/donations")({
  head: () => ({
    meta: [
      { title: "Donations - ResQ Hub Coordinator" },
      {
        name: "description",
        content: "Verify donor offers, track volunteer pickup missions, and accept resources into inventory.",
      },
      { property: "og:title", content: "Donations - ResQ Hub Coordinator" },
      { property: "og:description", content: "Review and verify community donations before they enter relief inventory." },
    ],
  }),
  component: DonationsPage,
});

const STATUSES = ["Pending", "Accepted", "Rejected", "Cancelled"];
const PAGE_SIZE = 8;
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function mapStatus(s?: string): string {
  if (!s) return "Pending";
  const upper = s.toUpperCase();
  if (upper === "PENDING") return "Pending";
  if (upper === "ACCEPTED" || upper === "APPROVED" || upper === "VERIFIED") return "Accepted";
  if (upper === "REJECTED") return "Rejected";
  if (upper === "CANCELLED") return "Cancelled";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function cleanAddress(addr?: string): string {
  if (!addr) return "";
  return addr.trim().replace(/,\s*$/, "");
}

interface NormalizedDonation {
  id: string;
  code: string;
  orgId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string;
  category: string;
  resource: string;
  quantity: number;
  unit: string;
  expiryDate?: string | undefined;
  pickupLocation: string;
  deliveryMethod: string;
  remarks: string;
  createdAt: string;
  status: string;
  rejectionReason?: string | undefined;
}

function DonationsPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [donor, setDonor] = useState("all");
  const [page, setPage] = useState(1);

  // Selected donation for Preview Modal
  const [previewDonationId, setPreviewDonationId] = useState<string | null>(null);

  // Accept & Reject Dialog states
  const [accepting, setAccepting] = useState<NormalizedDonation | null>(null);
  const [rejecting, setRejecting] = useState<NormalizedDonation | null>(null);
  const [reason, setReason] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Create Task from Donation state
  const [taskCreatingDonation, setTaskCreatingDonation] = useState<NormalizedDonation | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskSkill, setTaskSkill] = useState("Logistics & Transport");
  const [taskType, setTaskType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [volunteersRequired, setVolunteersRequired] = useState<number>(1);

  // 1. Fetch Donations
  const { data: rawData = [], isLoading } = useQuery({
    queryKey: ["donations", orgId],
    queryFn: async () => {
      try {
        const res = await donationsAPI.getAll(orgId);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.error("Failed to fetch donations:", err);
        return [];
      }
    },
    refetchInterval: 3000,
  });

  // 2. Fetch Tasks for linking volunteer progress
  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: () => tasksAPI.getAll(),
    refetchInterval: 2500,
  });

  const allTasks: any[] = useMemo(() => {
    const list = tasksRes?.data?.data ?? tasksRes?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [tasksRes]);

  const donations: NormalizedDonation[] = useMemo(() => {
    if (!Array.isArray(rawData)) return [];
    return rawData.map((d: any) => {
      const donorUser = d.users || {};
      const fullName = [donorUser.first_name, donorUser.last_name].filter(Boolean).join(" ");
      const donorName = fullName || d.donor_name || d.donorName || "Community Donor";
      const donorPhone = donorUser.phone || d.donor_phone || d.donorPhone || "";
      const donorEmail = donorUser.email || d.donor_email || d.donorEmail || "";
      const donationId = d.donation_id || d.id || "";
      const resource = d.resource_name || d.resource || "Relief Items";
      const category = d.category || d.category_name || "General";
      const quantity = Number(d.quantity) || 0;
      const unit = d.unit || "units";
      const rawLocation = d.pickup_address || d.pickup_location || d.location || "";
      const pickupLocation = cleanAddress(rawLocation);
      const deliveryMethod = d.delivery_method || (pickupLocation ? "ORGANIZATION_PICKUP" : "DONOR_DELIVERY");
      const remarks = d.donation_notes || d.remarks || d.notes || "";
      const createdAt = d.created_at || d.createdAt || new Date().toISOString();
      const status = mapStatus(d.status);
      const rejectionReason = d.rejection_reason || d.rejectionReason || undefined;
      const code = donationId.length > 8 ? donationId.slice(0, 8).toUpperCase() : donationId;

      return {
        id: donationId,
        code,
        orgId: d.organization_id || orgId || "",
        donorName,
        donorPhone,
        donorEmail,
        category,
        resource,
        quantity,
        unit,
        expiryDate: d.expiry_date || d.expiryDate || undefined,
        pickupLocation,
        deliveryMethod,
        remarks,
        createdAt,
        status,
        rejectionReason,
      };
    });
  }, [rawData, orgId]);

  const previewDonation = useMemo(() => {
    if (!previewDonationId) return null;
    return donations.find((d) => d.id === previewDonationId) || null;
  }, [donations, previewDonationId]);

  // Robust matching helper to link a volunteer task to a donation
  const getLinkedTask = (d: NormalizedDonation) => {
    const cleanDonationLoc = cleanAddress(d.pickupLocation).toLowerCase();
    const cleanResource = d.resource.toLowerCase().trim();
    const cleanDonor = d.donorName.toLowerCase().trim();
    const dId = (d.id || "").toLowerCase();
    const dCode = (d.code || "").toLowerCase();

    return allTasks.find((t: any) => {
      const desc = (t.description || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      const taskLoc = cleanAddress(t.location || "").toLowerCase();

      // 1. Explicit ID / Code Tag match (EXACT)
      if (dId && (desc.includes(`[donation_id:${dId}]`) || desc.includes(dId))) return true;
      if (dCode && (desc.includes(`[donation_code:${dCode}]`) || desc.includes(dCode) || title.includes(dCode))) return true;

      // 2. If this task has a tag explicitly for a DIFFERENT donation, NEVER link it to this donation!
      const hasExplicitOtherTag = desc.includes("[donation_id:") || desc.includes("[donation_code:");
      if (hasExplicitOtherTag) return false;

      // 3. Fallback only for untagged legacy tasks:
      if (title.includes("pickup donation") && title.includes(cleanResource)) {
        if (d.quantity && (title.includes(String(d.quantity)) || desc.includes(String(d.quantity)))) {
          if (cleanDonor && desc.includes(cleanDonor)) return true;
        }
      }

      return false;
    });
  };

  const previewLinkedTask = previewDonation ? getLinkedTask(previewDonation) : null;
  const linkedTaskId = previewLinkedTask?.task_id || previewLinkedTask?.id || null;

  // Live Task Details Query (polls every 2s while preview is open and task is linked)
  const { data: liveTaskDetailRes } = useQuery({
    queryKey: ["task-details", linkedTaskId],
    queryFn: () => (linkedTaskId ? tasksAPI.getById(linkedTaskId) : null),
    enabled: !!linkedTaskId && !!previewDonationId,
    refetchInterval: 2000,
  });

  const detailedTask = liveTaskDetailRes?.data?.data || previewLinkedTask;

  const decide = useMutation({
    mutationFn: async (vars: { id: string; decision: "Accepted" | "Rejected"; note?: string }) => {
      if (vars.decision === "Accepted") {
        return donationsAPI.approve(vars.id);
      }
      return donationsAPI.reject(vars.id, vars.note || "No reason specified");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["donations", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", orgId] });
      qc.invalidateQueries({ queryKey: ["dashboard", orgId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Donation ${vars.decision.toLowerCase()} successfully`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update donation status";
      toast.error(msg);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", orgId] });
      toast.success("Volunteer pickup task dispatched successfully!");
      setTaskCreatingDonation(null);
    },
    onError: (err: any) => {
      console.error("Create task error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create task";
      toast.error(msg);
    },
  });

  const openTaskCreateForDonation = (d: NormalizedDonation) => {
    setTaskCreatingDonation(d);
    setTaskTitle(`Pickup Donation: ${d.resource} (${d.quantity} ${d.unit})`);
    setTaskDescription(
      `Volunteer pickup mission for ${d.quantity} ${d.unit} of ${d.resource}.\n` +
      `Donor: ${d.donorName} (${d.donorPhone || "Contact in App"})\n` +
      `Pickup Location: ${d.pickupLocation || "Contact donor for pickup address"}\n` +
      `Remarks: ${d.remarks || "Please verify item quality before collection."}`
    );
    setTaskLocation(d.pickupLocation || "");
    setTaskPriority("MEDIUM");
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
    toast.success("Donor phone copied to clipboard");
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const categories = useMemo(() => [...new Set(donations.map((d) => d.category).filter(Boolean))], [donations]);
  const donors = useMemo(() => [...new Set(donations.map((d) => d.donorName).filter(Boolean))], [donations]);

  const filtered = useMemo(
    () =>
      donations.filter(
        (d) =>
          (status === "all" || d.status === status) &&
          (category === "all" || d.category === category) &&
          (donor === "all" || d.donorName === donor) &&
          (search === "" ||
            [d.donorName, d.resource, d.pickupLocation, d.donorPhone, d.category].join(" ").toLowerCase().includes(search.toLowerCase())),
      ),
    [donations, status, category, donor, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const pending = donations.filter((d) => d.status === "Pending").length;

  return (
    <>
      <PageHeader
        title="Donations"
        description={`${pending} donation${pending === 1 ? "" : "s"} awaiting verification.`}
      />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by donor, resource, phone or pickup location"
        filters={[
          { label: "Status", value: status, options: STATUSES, onChange: (v) => { setStatus(v); setPage(1); } },
          { label: "Category", value: category, options: categories, onChange: (v) => { setCategory(v); setPage(1); } },
          { label: "Donor", value: donor, options: donors, onChange: (v) => { setDonor(v); setPage(1); } },
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
          <EmptyState message="No donations match the current filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Resource</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Pickup Address</TableHead>
                <TableHead>Volunteer Mission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const linkedTask = getLinkedTask(d);
                return (
                  <TableRow
                    key={d.id || Math.random().toString()}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setPreviewDonationId(d.id)}
                  >
                    <TableCell>
                      <span className="block font-semibold text-foreground">{d.resource}</span>
                      <span className="block text-xs text-muted-foreground">{d.category}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium">{d.donorName}</span>
                      <span className="block text-xs text-muted-foreground font-mono">
                        {d.donorPhone || "Contact in App"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {d.quantity} {d.unit}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span className="truncate">{d.pickupLocation || "Drop-off at relief center"}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {linkedTask ? (
                        <div className="flex items-center gap-1.5">
                          {linkedTask.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> Delivered
                            </span>
                          ) : linkedTask.status === "IN_PROGRESS" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                              <Activity className="h-3 w-3 animate-pulse" /> In Transit
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
                      <StatusBadge value={d.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setPreviewDonationId(d.id)}
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
            Showing {(current - 1) * PAGE_SIZE + 1}-{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
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
      <Dialog open={!!previewDonation} onOpenChange={(open) => !open && setPreviewDonationId(null)}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          {previewDonation && (
            <div>
              {/* Header */}
              <div className="border-b border-border bg-muted/30 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {previewDonation.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{previewDonation.code}
                    </span>
                  </div>
                  <StatusBadge value={previewDonation.status} />
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {previewDonation.resource}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Offered on {new Date(previewDonation.createdAt).toLocaleDateString()} at{" "}
                  {new Date(previewDonation.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                            Volunteer Pickup Mission
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
                            <CheckCircle2 className="h-3.5 w-3.5" /> 100% Delivered to Store
                          </span>
                        ) : detailedTask.status === "IN_PROGRESS" ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5 animate-pulse" /> Volunteer On The Way
                          </span>
                        ) : detailedTask.status === "ASSIGNED" ? (
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            Volunteer Assigned (Preparing)
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
                            Assigned Volunteer:{" "}
                            <strong className="text-foreground">
                              {detailedTask.volunteers.map((v: any) => v.name || v.first_name || "Volunteer").join(", ")}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Delivered Banner */}
                      {detailedTask.status === "COMPLETED" && (
                        <div className="mt-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs text-emerald-950 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              <strong>Package Delivered:</strong> Volunteer has delivered items to the relief store.
                            </span>
                          </div>
                          {previewDonation.status === "Pending" && (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-7 text-xs px-3 shadow-xs"
                              onClick={() => setAccepting(previewDonation)}
                            >
                              Accept to Inventory Now
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
                      No volunteer pickup mission created yet.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs font-semibold"
                      onClick={() => openTaskCreateForDonation(previewDonation)}
                    >
                      <PlusCircle className="mr-1 h-3.5 w-3.5" />
                      Dispatch Pickup Task
                    </Button>
                  </div>
                )}

                {/* Rejection notice if rejected */}
                {previewDonation.status === "Rejected" && previewDonation.rejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      Rejection Reason
                    </div>
                    <p className="mt-1 text-xs">{previewDonation.rejectionReason}</p>
                  </div>
                )}

                {/* Donation Spec Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">Quantity</span>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {previewDonation.quantity} <span className="text-sm font-normal text-muted-foreground">{previewDonation.unit}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">Category</span>
                    <p className="mt-1 text-sm font-semibold text-foreground truncate">
                      {previewDonation.category}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="text-xs font-medium text-muted-foreground">Expiry Date</span>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {previewDonation.expiryDate ? new Date(previewDonation.expiryDate).toLocaleDateString() : "No expiry"}
                    </p>
                  </div>
                </div>

                {/* Donor Information & Verification Card */}
                <div className="rounded-xl border border-border bg-muted/10 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <User className="h-4 w-4 text-primary" />
                    Donor Contact & Verification
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Donor Name</span>
                      <p className="text-sm font-semibold text-foreground">{previewDonation.donorName}</p>
                      {previewDonation.donorEmail && (
                        <p className="text-xs text-muted-foreground">{previewDonation.donorEmail}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Contact Phone</span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {previewDonation.donorPhone || "Contact in Mobile App"}
                        </span>
                        {previewDonation.donorPhone && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Copy phone number"
                            onClick={() => handleCopyPhone(previewDonation.donorPhone)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pickup Location & Maps Link */}
                  <div className="mt-3 border-t border-border/60 pt-3">
                    <span className="text-xs text-muted-foreground">Pickup Location / Destination</span>
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="flex items-start gap-1.5 text-sm text-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <span className="font-medium">
                          {previewDonation.pickupLocation || (previewDonation.deliveryMethod === "DONOR_DELIVERY" ? "Self drop-off at relief center" : "Contact donor for pickup address")}
                        </span>
                      </p>
                      {previewDonation.pickupLocation && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(previewDonation.pickupLocation)}`}
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
                  {previewDonation.donorPhone && (
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-950 dark:text-emerald-200">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Verify donor by calling before dispatching pickup:</span>
                      </div>
                      <a
                        href={`tel:${previewDonation.donorPhone}`}
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        <Phone className="h-3 w-3" />
                        Call {previewDonation.donorPhone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Donor Remarks */}
                {previewDonation.remarks && (
                  <div className="rounded-lg border border-border bg-card p-3.5">
                    <span className="text-xs font-medium text-muted-foreground">Donor Remarks & Notes</span>
                    <p className="mt-1 text-sm text-foreground/90 italic">"{previewDonation.remarks}"</p>
                  </div>
                )}
              </div>

              {/* Modal Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/20 p-4">
                <Button variant="ghost" size="sm" onClick={() => setPreviewDonationId(null)}>
                  Close
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  {previewDonation.status === "Pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setReason("");
                        setRejecting(previewDonation);
                      }}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  )}

                  {/* Create or View Volunteer Pickup Task button */}
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
                      onClick={() => openTaskCreateForDonation(previewDonation)}
                    >
                      <Truck className="h-4 w-4 text-primary" />
                      Create Volunteer Pickup Task
                    </Button>
                  )}

                  {previewDonation.status === "Pending" && (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
                      onClick={() => setAccepting(previewDonation)}
                    >
                      <Check className="h-4 w-4" /> Accept to Inventory
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🚚 CREATE VOLUNTEER PICKUP TASK DIALOG */}
      <Dialog open={!!taskCreatingDonation} onOpenChange={(open) => !open && setTaskCreatingDonation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Truck className="h-5 w-5" />
              Create Volunteer Pickup Task
            </DialogTitle>
            <DialogDescription>
              Dispatch this donation pickup mission to volunteers. They can accept and complete it via their mobile app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Task Title</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Pickup 50kg Rice Donation"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Pickup Location / Destination</Label>
              <Input
                value={taskLocation}
                onChange={(e) => setTaskLocation(e.target.value)}
                placeholder="e.g., 45 Galle Road, Colombo 03"
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskCreatingDonation(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-semibold"
              disabled={!taskTitle.trim() || createTaskMutation.isPending}
              onClick={() => {
                const tag = taskCreatingDonation ? `[DONATION_ID:${taskCreatingDonation.id}] [DONATION_CODE:${taskCreatingDonation.code}] ` : '';
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
              {createTaskMutation.isPending ? "Dispatching..." : "Dispatch Task to Volunteers"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ ACCEPT CONFIRMATION DIALOG */}
      <AlertDialog open={!!accepting} onOpenChange={(o) => !o && setAccepting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Donation into Inventory?</AlertDialogTitle>
            <AlertDialogDescription>
              {accepting?.quantity} {accepting?.unit} of {accepting?.resource} offered by {accepting?.donorName} will be credited to your relief inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (accepting) decide.mutate({ id: accepting.id, decision: "Accepted" });
                setAccepting(null);
              }}
            >
              Confirm Acceptance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ❌ REJECT WITH MANDATORY REASON DIALOG */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Donation</DialogTitle>
            <DialogDescription>A reason is mandatory and will be visible to the donor.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this donation cannot be accepted (e.g., outside delivery area, expired, or prohibited item)..."
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
              {decide.isPending ? "Rejecting..." : "Reject Donation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
