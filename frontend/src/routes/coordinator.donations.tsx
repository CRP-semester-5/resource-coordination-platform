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
  KeyRound,
} from "lucide-react";
import { donationsAPI, tasksAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
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

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "active_missions">("all");
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
  const [revealedDepositPins, setRevealedDepositPins] = useState<Record<string, boolean>>({});
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
    enabled: !!orgId,
    refetchInterval: 4000,
  });

  // 2. Fetch Tasks for linking volunteer progress
  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      try {
        const res = await tasksAPI.getAll();
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        return [];
      }
    },
    enabled: !!orgId,
    refetchInterval: 4000,
  });

  const allTasks: any[] = useMemo(() => {
    if (Array.isArray(tasksRes)) return tasksRes;
    const list = (tasksRes as any)?.data?.data ?? (tasksRes as any)?.data ?? [];
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

  const totalCount = donations.length;
  const pendingCount = donations.filter((d) => d.status === "Pending").length;
  const acceptedCount = donations.filter((d) => d.status === "Accepted").length;
  const activeMissionsCount = donations.filter((d) => {
    const task = getLinkedTask(d);
    return task && (task.status === "IN_PROGRESS" || task.status === "ASSIGNED" || task.status === "OPEN" || task.status === "TODO");
  }).length;

  const filtered = useMemo(
    () =>
      donations.filter((d) => {
        if (activeTab === "pending" && d.status !== "Pending") return false;
        if (activeTab === "accepted" && d.status !== "Accepted") return false;
        if (activeTab === "active_missions") {
          const task = getLinkedTask(d);
          if (!task || task.status === "COMPLETED" || task.status === "CANCELLED") return false;
        }

        if (status !== "all" && d.status !== status) return false;
        if (category !== "all" && d.category !== category) return false;
        if (donor !== "all" && d.donorName !== donor) return false;
        if (search.trim() !== "") {
          const target = [d.donorName, d.resource, d.pickupLocation, d.donorPhone, d.category, d.code].join(" ").toLowerCase();
          if (!target.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [donations, activeTab, status, category, donor, search, allTasks],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const quickTabs = [
    { id: "all" as const, label: "All Donations", count: totalCount },
    { id: "pending" as const, label: "Awaiting Review", count: pendingCount },
    { id: "active_missions" as const, label: "Active Missions", count: activeMissionsCount },
    { id: "accepted" as const, label: "In Relief Stock", count: acceptedCount },
  ];

  return (
    <>
      <PageHeader
        title="Donations"
        description={`${pendingCount} community donation${pendingCount === 1 ? "" : "s"} awaiting verification and warehouse intake.`}
      />

      {/* 📊 Key Operational Metrics Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        <div
          onClick={() => {
            setActiveTab(activeTab === "pending" ? "all" : "pending");
            setPage(1);
          }}
          className={cn("cursor-pointer transition-all hover:scale-[1.01]", activeTab === "pending" && "ring-2 ring-amber-500/50 rounded-xl")}
        >
          <StatCard
            label="Awaiting Review"
            value={pendingCount}
            hint="Offers needing verification"
            icon={Clock}
            tone="warning"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab(activeTab === "active_missions" ? "all" : "active_missions");
            setPage(1);
          }}
          className={cn("cursor-pointer transition-all hover:scale-[1.01]", activeTab === "active_missions" && "ring-2 ring-primary/50 rounded-xl")}
        >
          <StatCard
            label="Active Missions"
            value={activeMissionsCount}
            hint="Pickup tasks in progress"
            icon={Truck}
            tone="default"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab(activeTab === "accepted" ? "all" : "accepted");
            setPage(1);
          }}
          className={cn("cursor-pointer transition-all hover:scale-[1.01]", activeTab === "accepted" && "ring-2 ring-emerald-500/50 rounded-xl")}
        >
          <StatCard
            label="In Relief Stock"
            value={acceptedCount}
            hint="Verified & added to inventory"
            icon={CheckCircle2}
            tone="success"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
          className={cn("cursor-pointer transition-all hover:scale-[1.01]", activeTab === "all" && "ring-2 ring-muted-foreground/30 rounded-xl")}
        >
          <StatCard
            label="Total Donations"
            value={totalCount}
            hint="All registered donations"
            icon={Package}
            tone="default"
          />
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {quickTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-8 text-xs font-semibold transition-all",
              activeTab === tab.id
                ? "shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
            onClick={() => {
              setActiveTab(tab.id);
              setPage(1);
            }}
          >
            {tab.label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.count}
            </span>
          </Button>
        ))}
      </div>

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
                      <span className="inline-block mt-0.5 rounded bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {d.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="block font-medium text-foreground">{d.donorName}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">
                          {d.donorPhone || "Contact in App"}
                        </span>
                        {d.donorPhone && (
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Phone"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPhone(d.donorPhone);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="font-bold text-foreground text-sm">{d.quantity}</span>{" "}
                      <span className="text-xs text-muted-foreground">{d.unit}</span>
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        <span className="truncate text-foreground/90 font-medium" title={d.pickupLocation || "Drop-off at relief center"}>
                          {d.pickupLocation || "Drop-off at relief center"}
                        </span>
                        {d.pickupLocation && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.pickupLocation)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-primary p-0.5 rounded transition-colors"
                            title="Open in Google Maps"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {linkedTask ? (
                        <div className="flex items-center gap-1.5">
                          {linkedTask.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Delivered
                            </span>
                          ) : linkedTask.status === "IN_PROGRESS" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/20">
                              <Activity className="h-3 w-3 animate-pulse" /> In Transit
                            </span>
                          ) : linkedTask.status === "ASSIGNED" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400 border border-purple-500/20">
                              <User className="h-3 w-3" /> Assigned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="h-3 w-3" /> Dispatched
                            </span>
                          )}
                        </div>
                      ) : d.status === "Pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] font-semibold border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 gap-1 px-2"
                          onClick={() => openTaskCreateForDonation(d)}
                        >
                          <PlusCircle className="h-3 w-3" /> Dispatch Pickup
                        </Button>
                      ) : d.status === "Accepted" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/60">
                          <Package className="h-3 w-3 text-muted-foreground/70" /> Direct / Received
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None (Closed)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={d.status} />
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary font-semibold h-8 text-xs"
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
        <DialogContent className="max-w-4xl lg:max-w-5xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
          {previewDonation && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="border-b border-border bg-muted/30 px-6 py-5 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
                      {previewDonation.category}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      #{previewDonation.code}
                    </span>
                  </div>
                  <StatusBadge value={previewDonation.status} />
                </div>
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {previewDonation.resource}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Offered on {new Date(previewDonation.createdAt).toLocaleDateString()} at{" "}
                    {new Date(previewDonation.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* 4 Quick Stat Metric Badges Bar */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Quantity</span>
                    <p className="text-base font-extrabold text-foreground mt-0.5">
                      {previewDonation.quantity} <span className="text-xs font-normal text-muted-foreground">{previewDonation.unit}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Category</span>
                    <p className="text-sm font-bold text-foreground mt-0.5 truncate">
                      {previewDonation.category}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Delivery Mode</span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {previewDonation.deliveryMethod === "ORGANIZATION_PICKUP" ? "Volunteer Pickup" : "Direct Drop-off"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Expiry / Shelf Life</span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {previewDonation.expiryDate ? new Date(previewDonation.expiryDate).toLocaleDateString() : "Non-perishable"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body: 2 Columns */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Mission & Inspection (7 cols on lg) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Live Volunteer Task / Mission Banner */}
                    {detailedTask ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                              <Truck className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                Volunteer Pickup Mission
                              </span>
                              <h4 className="text-sm font-bold text-foreground">{detailedTask.title}</h4>
                            </div>
                          </div>
                          <Link
                            to="/coordinator/tasks"
                            className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-background px-2.5 py-1 text-xs font-semibold text-primary shadow-xs hover:bg-primary/10 transition-colors shrink-0"
                          >
                            View in Tasks <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Progress Bar & Status details */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">Mission Status:</span>
                            {detailedTask.status === "COMPLETED" ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Deposited in Warehouse
                              </span>
                            ) : detailedTask.status === "IN_PROGRESS" ? (
                              <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Activity className="h-3.5 w-3.5 animate-pulse" /> In Transit to Warehouse (50%)
                              </span>
                            ) : detailedTask.status === "ASSIGNED" ? (
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                Volunteer Assigned (En Route to Donor)
                              </span>
                            ) : (
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                Dispatched (Awaiting Volunteer)
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

                          {/* Assigned Volunteer list */}
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
                        </div>

                        {/* Multi-Stage Security PIN Lifecycle */}
                        {(() => {
                          const taskSeed = (parseInt((detailedTask.task_id || detailedTask.id || '').replace(/[^0-9]/g, '').slice(-4) || '8421', 10) % 9000) + 1000;
                          const warehousePin = detailedTask.warehouse_pickup_pin || taskSeed.toString();
                          const isDelivered = detailedTask.status === "COMPLETED";
                          const isPickedUp = isDelivered || detailedTask.status === "IN_PROGRESS";

                          return (
                            <div className="rounded-lg border border-primary/20 bg-background/90 p-3.5 text-xs space-y-2.5">
                              <div className="flex items-center justify-between font-semibold text-foreground">
                                <span className="flex items-center gap-1.5 text-primary font-bold">
                                  <ShieldCheck className="h-4 w-4" /> Multi-Stage Security PIN Lifecycle
                                </span>
                                <span className="text-[10px] text-muted-foreground">Central Warehouse Verification</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {/* Stage 1: Donor Collection */}
                                <div className={`rounded-md p-2.5 border ${isPickedUp ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200' : 'bg-muted/40 border-border text-foreground'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px]">Stage 1: Donor Collection</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPickedUp ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'}`}>
                                      {isPickedUp ? 'COLLECTED' : 'AWAITING PICKUP'}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    <span className="font-mono text-sm font-bold tracking-widest text-muted-foreground flex items-center gap-1">
                                      {isPickedUp ? (
                                        <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> •••• (Verified)</>
                                      ) : (
                                        <>🔒 •••• (Private to Donor)</>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {isPickedUp
                                        ? "Volunteer verified donor's app PIN at collection"
                                        : "Donor displays 4-digit PIN on mobile app to volunteer"}
                                    </span>
                                  </div>
                                </div>

                                {/* Stage 2: Warehouse Store Deposit PIN */}
                                <div className={`rounded-md p-2.5 border ${isDelivered ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200' : isPickedUp ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200' : 'bg-muted/30 border-dashed border-border text-muted-foreground'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px]">Stage 2: Warehouse Deposit PIN</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDelivered ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' : isPickedUp ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 animate-pulse' : 'bg-slate-500/10 text-slate-500'}`}>
                                      {isDelivered ? 'IN STOCK & CLOSED' : isPickedUp ? 'ACTIVE FOR STORE STAFF' : 'PENDING STAGE 1'}
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex flex-col gap-0.5">
                                    {isDelivered ? (
                                      <>
                                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="h-3.5 w-3.5" /> PIN Verified & Expired (Closed)
                                        </span>
                                        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300">
                                          Stock automatically credited to relief inventory
                                        </span>
                                      </>
                                    ) : isPickedUp ? (
                                      revealedDepositPins[detailedTask.id || detailedTask.task_id || ''] ? (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono text-base font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400">
                                              {warehousePin}
                                            </span>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 px-2 text-[10px] text-indigo-600 hover:bg-indigo-500/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(warehousePin);
                                                toast.success('Warehouse Deposit PIN copied!');
                                              }}
                                            >
                                              <Copy className="h-3 w-3 mr-1" /> Copy
                                            </Button>
                                          </div>
                                          <span className="text-[10px] text-indigo-700/80 dark:text-indigo-300 font-medium">
                                            Active Code: Warehouse staff provide to volunteer to store goods
                                          </span>
                                        </>
                                      ) : (
                                        <div>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-[10px] font-semibold border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 w-full justify-center gap-1"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRevealedDepositPins((prev) => ({
                                                ...prev,
                                                [detailedTask.id || detailedTask.task_id || '']: true,
                                              }));
                                              toast.info('Warehouse Deposit PIN revealed for store staff.');
                                            }}
                                          >
                                            <KeyRound className="h-3 w-3" /> Reveal Deposit PIN
                                          </Button>
                                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                                            Click to view code for volunteer drop-off receipt.
                                          </span>
                                        </div>
                                      )
                                    ) : (
                                      <>
                                        <span className="font-mono text-xs italic text-muted-foreground">
                                          ⏳ PIN Inactive (Activates when volunteer collects items)
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          Generated once volunteer completes Stage 1
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
                          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs text-emerald-950 dark:text-emerald-100 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>
                                <strong>Package Delivered:</strong> Volunteer has deposited items at the central relief store.
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
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 font-semibold text-foreground">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            No Volunteer Pickup Mission Dispatched
                          </span>
                          {previewDonation.status === "Pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary/40 text-primary hover:bg-primary/10 h-7 text-xs font-semibold"
                              onClick={() => openTaskCreateForDonation(previewDonation)}
                            >
                              <PlusCircle className="mr-1 h-3.5 w-3.5" />
                              Dispatch Pickup Task
                            </Button>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {previewDonation.pickupLocation
                            ? `Donor provided pickup address at "${previewDonation.pickupLocation}". You can dispatch a volunteer mission to collect and transport these supplies to your relief warehouse.`
                            : "Donor did not specify a separate pickup address. This item can be brought directly to the relief warehouse."}
                        </p>
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

                    {/* Donor Remarks */}
                    {previewDonation.remarks && (
                      <div className="rounded-lg border border-border bg-card p-3.5">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                          Donor Remarks & Notes
                        </span>
                        <p className="mt-1 text-sm text-foreground/90 italic">"{previewDonation.remarks}"</p>
                      </div>
                    )}

                    {/* Inventory Impact Note */}
                    <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        When accepted, <strong>{previewDonation.quantity} {previewDonation.unit}</strong> will be immediately credited to your organization's <strong>{previewDonation.category}</strong> relief stock in the database.
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Donor Profile & Actions (5 cols on lg) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Donor Contact Card */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3.5">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <User className="h-4 w-4 text-primary" />
                        Donor Information
                      </h3>

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Full Name</span>
                        <p className="text-base font-bold text-foreground">{previewDonation.donorName}</p>
                        {previewDonation.donorEmail && (
                          <p className="text-xs text-muted-foreground">{previewDonation.donorEmail}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Phone Contact</span>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {previewDonation.donorPhone || "Contact in Mobile App"}
                          </span>
                          {previewDonation.donorPhone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              title="Copy phone number"
                              onClick={() => handleCopyPhone(previewDonation.donorPhone)}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                            </Button>
                          )}
                        </div>

                        {previewDonation.donorPhone && (
                          <a
                            href={`tel:${previewDonation.donorPhone}`}
                            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            Call Donor Now ({previewDonation.donorPhone})
                          </a>
                        )}
                      </div>

                      {/* Pickup Address & Maps Link */}
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Pickup / Drop-off Location</span>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-foreground font-medium">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                          <span>
                            {previewDonation.pickupLocation || (previewDonation.deliveryMethod === "DONOR_DELIVERY" ? "Self drop-off at relief center" : "Contact donor for pickup address")}
                          </span>
                        </p>
                        {previewDonation.pickupLocation && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(previewDonation.pickupLocation)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted transition-colors shadow-2xs"
                          >
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            Open Location in Google Maps <ExternalLink className="h-3 w-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Workflow Actions Card */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Coordinator Decision & Actions
                      </h4>

                      {previewDonation.status === "Pending" ? (
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-bold shadow-xs"
                            onClick={() => setAccepting(previewDonation)}
                          >
                            <Check className="h-4 w-4" /> Accept into Relief Inventory
                          </Button>

                          {!detailedTask && (
                            <Button
                              variant="outline"
                              className="w-full border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 font-semibold gap-1.5"
                              onClick={() => openTaskCreateForDonation(previewDonation)}
                            >
                              <Truck className="h-4 w-4" /> Dispatch Volunteer Pickup Task
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold gap-1.5"
                            onClick={() => {
                              setReason("");
                              setRejecting(previewDonation);
                            }}
                          >
                            <X className="h-4 w-4" /> Reject Donation Offer
                          </Button>
                        </div>
                      ) : previewDonation.status === "Accepted" ? (
                        <div className="space-y-2">
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>Donation verified & recorded in relief inventory.</span>
                          </div>
                          <Link to="/coordinator/inventory" className="block">
                            <Button variant="outline" className="w-full text-xs font-semibold gap-1.5">
                              <Package className="h-3.5 w-3.5" /> View in Inventory Dashboard
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>This donation offer was closed or rejected.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Footer */}
              <div className="border-t border-border bg-muted/20 px-6 py-3 flex items-center justify-between shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setPreviewDonationId(null)}>
                  Close
                </Button>
                <span className="text-xs text-muted-foreground">
                  Donation ID: <code className="font-mono">{previewDonation.id}</code>
                </span>
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
