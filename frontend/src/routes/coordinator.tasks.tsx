import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksAPI, volunteersAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  User,
  Clock,
  CheckCircle2,
  MapPin,
  Wrench,
  Calendar,
  PlusCircle,
  Activity,
  Copy,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  Package,
  ExternalLink,
  ArrowRight,
  Eye,
  Phone,
  PhoneCall,
} from "lucide-react";

export const Route = createFileRoute("/coordinator/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — ResQ Hub Coordinator" },
      {
        name: "description",
        content: "Dispatch, monitor, and verify volunteer tasks, field missions, and multi-stage delivery PINs.",
      },
    ],
  }),
  component: TasksPage,
});

const PAGE_SIZE = 8;
const STATUSES = ["UNASSIGNED", "PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPE_OPTIONS = ["INDIVIDUAL", "TEAM"];

function cleanTaskDescription(desc?: string): string {
  if (!desc) return "No description provided.";
  return desc
    .replace(/\[DONATION_ID:[^\]]+\]/gi, "")
    .replace(/\[DONATION_CODE:[^\]]+\]/gi, "")
    .replace(/\[REQUEST_ID:[^\]]+\]/gi, "")
    .replace(/\[REQUEST_CODE:[^\]]+\]/gi, "")
    .trim() || "Emergency relief operation instructions.";
}

function getTaskOrigin(title: string, desc: string): "DONATION" | "REQUEST" | "GENERAL" {
  const combined = `${title || ""} ${desc || ""}`.toLowerCase();
  if (combined.includes("[donation_") || combined.includes("pickup donation") || combined.includes("donor")) {
    return "DONATION";
  }
  if (combined.includes("[request_") || combined.includes("deliver aid") || combined.includes("requester")) {
    return "REQUEST";
  }
  return "GENERAL";
}

function TasksPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"all" | "needs_volunteers" | "active" | "critical" | "completed">("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Create Task Form State
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [requiredSkill, setRequiredSkill] = useState("");
  const [taskType, setTaskType] = useState<"INDIVIDUAL" | "TEAM">("INDIVIDUAL");
  const [volunteersRequired, setVolunteersRequired] = useState<number>(1);
  const [location, setLocation] = useState("");

  // Details Modal State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [assigningVolunteer, setAssigningVolunteer] = useState(false);
  const [chosenVolunteerId, setChosenVolunteerId] = useState("");
  const [revealedTaskPins, setRevealedTaskPins] = useState<Record<string, boolean>>({});

  const { data: response, isLoading } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await tasksAPI.getAll(orgId);
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!orgId,
    refetchInterval: 5000,
  });

  const { data: selectedTaskResponse } = useQuery({
    queryKey: ["task-details", selectedTaskId],
    queryFn: () => (selectedTaskId ? tasksAPI.getById(selectedTaskId) : null),
    enabled: !!selectedTaskId,
    refetchInterval: selectedTaskId ? 2000 : false, // Live stream updates while dialog is open!
  });

  const selectedTask = selectedTaskResponse?.data?.data || null;

  const { data: volunteersResponse } = useQuery({
    queryKey: ["volunteers", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await volunteersAPI.getAll(orgId);
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!orgId && (creating || !!selectedTaskId),
  });

  const availableVolunteers = Array.isArray(volunteersResponse)
    ? volunteersResponse
    : ((volunteersResponse as any)?.data?.data || []);

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", orgId] });
      toast.success("Task created successfully");
      setCreating(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      console.error("Create task error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to create task";
      toast.error(msg);
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ taskId, volunteerId }: { taskId: string; volunteerId: string }) =>
      tasksAPI.assign(taskId, volunteerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", orgId] });
      if (selectedTaskId) {
        qc.invalidateQueries({ queryKey: ["task-details", selectedTaskId] });
      }
      toast.success("Volunteer assigned successfully");
      setAssigningVolunteer(false);
      setChosenVolunteerId("");
    },
    onError: () => {
      toast.error("Failed to assign volunteer");
    },
  });

  const resetCreateForm = () => {
    setTitle("");
    setDescription("");
    setTaskPriority("MEDIUM");
    setRequiredSkill("");
    setTaskType("INDIVIDUAL");
    setVolunteersRequired(1);
    setLocation("");
  };

  const tasks: any[] = Array.isArray(response) ? response : ((response as any)?.data?.data || []);

  // Operational metrics
  const totalCount = tasks.length;
  const needsVolunteersCount = tasks.filter((t: any) => {
    const required = t.volunteers_required || 1;
    const assignedCount = t.task_assignments?.length || 0;
    const isUnfilled = assignedCount < required;
    const isOpenStatus = t.status === "UNASSIGNED" || t.status === "PENDING" || t.status === "OPEN";
    return (isUnfilled || isOpenStatus) && t.status !== "COMPLETED" && t.status !== "CANCELLED";
  }).length;

  const activeInFieldCount = tasks.filter(
    (t: any) => (t.status === "IN_PROGRESS" || t.status === "ASSIGNED") && t.status !== "COMPLETED",
  ).length;

  const criticalCount = tasks.filter(
    (t: any) =>
      (t.priority === "CRITICAL" || t.priority === "HIGH") &&
      t.status !== "COMPLETED" &&
      t.status !== "CANCELLED",
  ).length;

  const completedCount = tasks.filter((t: any) => t.status === "COMPLETED").length;

  const quickTabs = [
    { id: "all" as const, label: "All Tasks", count: totalCount },
    { id: "needs_volunteers" as const, label: "Needs Volunteers", count: needsVolunteersCount },
    { id: "active" as const, label: "Active in Field", count: activeInFieldCount },
    { id: "critical" as const, label: "Critical Priority", count: criticalCount },
    { id: "completed" as const, label: "Completed", count: completedCount },
  ];

  // Filtering Logic
  const filtered = useMemo(() => {
    return tasks.filter((t: any) => {
      const required = t.volunteers_required || 1;
      const assignedCount = t.task_assignments?.length || 0;
      const isNeedsVolunteers =
        (assignedCount < required || t.status === "UNASSIGNED" || t.status === "PENDING") &&
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED";
      const isActive =
        (t.status === "IN_PROGRESS" || t.status === "ASSIGNED") && t.status !== "COMPLETED";
      const isCritical =
        (t.priority === "CRITICAL" || t.priority === "HIGH") &&
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED";
      const isCompleted = t.status === "COMPLETED";

      // Tab filter
      if (activeTab === "needs_volunteers" && !isNeedsVolunteers) return false;
      if (activeTab === "active" && !isActive) return false;
      if (activeTab === "critical" && !isCritical) return false;
      if (activeTab === "completed" && !isCompleted) return false;

      // Dropdown filters
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (taskTypeFilter !== "all" && t.task_type !== taskTypeFilter) return false;

      // Search filter
      if (search.trim() !== "") {
        const cleanDesc = cleanTaskDescription(t.description);
        const target = [t.title, cleanDesc, t.required_skill, t.location]
          .join(" ")
          .toLowerCase();
        if (!target.includes(search.toLowerCase())) return false;
      }

      return true;
    });
  }, [tasks, activeTab, status, priority, taskTypeFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`Manage ${tasks.length} volunteer relief task${tasks.length === 1 ? "" : "s"} for your organization.`}
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2 font-bold shadow-xs">
            <PlusCircle className="h-4 w-4" />
            Create Task
          </Button>
        }
      />

      {/* 📊 Key Operational Metrics Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        <div
          onClick={() => {
            setActiveTab(activeTab === "needs_volunteers" ? "all" : "needs_volunteers");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "needs_volunteers" && "ring-2 ring-amber-500/50 rounded-xl",
          )}
        >
          <StatCard
            label="Needs Volunteers"
            value={needsVolunteersCount}
            hint="Unassigned or open slots"
            icon={Clock}
            tone="warning"
          />
        </div>

        <div
          onClick={() => {
            setActiveTab(activeTab === "active" ? "all" : "active");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "active" && "ring-2 ring-primary/50 rounded-xl",
          )}
        >
          <StatCard
            label="Active in Field"
            value={activeInFieldCount}
            hint="Assigned & in transit"
            icon={Activity}
            tone="default"
          />
        </div>

        <div
          onClick={() => {
            setActiveTab(activeTab === "critical" ? "all" : "critical");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "critical" && "ring-2 ring-red-500/50 rounded-xl",
          )}
        >
          <StatCard
            label="Critical Priority"
            value={criticalCount}
            hint="Immediate response needed"
            icon={AlertTriangle}
            tone="danger"
          />
        </div>

        <div
          onClick={() => {
            setActiveTab(activeTab === "completed" ? "all" : "completed");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "completed" && "ring-2 ring-emerald-500/50 rounded-xl",
          )}
        >
          <StatCard
            label="Completed Missions"
            value={completedCount}
            hint="Safely delivered & verified"
            icon={CheckCircle2}
            tone="success"
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
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
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
                  : "bg-muted text-muted-foreground",
              )}
            >
              {tab.count}
            </span>
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search tasks by title, clean description, location or skill..."
        filters={[
          {
            label: "Status",
            value: status,
            options: STATUSES,
            onChange: (v) => {
              setStatus(v);
              setPage(1);
            },
          },
          {
            label: "Priority",
            value: priority,
            options: PRIORITIES,
            onChange: (v) => {
              setPriority(v);
              setPage(1);
            },
          },
          {
            label: "Type",
            value: taskTypeFilter,
            options: TYPE_OPTIONS,
            onChange: (v) => {
              setTaskTypeFilter(v);
              setPage(1);
            },
          },
        ]}
      />

      {/* Tasks Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No tasks match the current search filters." />
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Task Details</TableHead>
                <TableHead>Mission Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Skill Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Volunteers Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t: any) => {
                const required = t.volunteers_required || 1;
                const assignedCount = t.task_assignments?.length || 0;
                const isFull = assignedCount >= required;
                const isTeam = t.task_type === "TEAM" || required > 1;
                const cleanDesc = cleanTaskDescription(t.description);
                const origin = getTaskOrigin(t.title, t.description);

                return (
                  <TableRow
                    key={t.task_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTaskId(t.task_id)}
                  >
                    {/* Task Title & Sanitized Subtitle */}
                    <TableCell className="max-w-[320px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {origin === "DONATION" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <Package className="h-2.5 w-2.5" /> Pickup Donation
                          </span>
                        ) : origin === "REQUEST" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            <HeartHandshake className="h-2.5 w-2.5" /> Relief Delivery
                          </span>
                        ) : null}
                        <span className="font-semibold text-foreground text-sm line-clamp-1">
                          {t.title}
                        </span>
                      </div>
                      <span className="block text-xs text-muted-foreground truncate mt-1" title={cleanDesc}>
                        {cleanDesc}
                      </span>
                      {t.location && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-0.5 truncate max-w-xs">
                          <MapPin className="h-3 w-3 shrink-0 text-red-500/80" />
                          <span className="truncate">{t.location}</span>
                        </span>
                      )}
                    </TableCell>

                    {/* Mission Type */}
                    <TableCell>
                      {isTeam ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300">
                          <Users className="h-3 w-3" />
                          Team ({required})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
                          <User className="h-3 w-3" />
                          Solo (1)
                        </span>
                      )}
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          t.priority === "CRITICAL"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200"
                            : t.priority === "HIGH"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200"
                            : t.priority === "LOW"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </TableCell>

                    {/* Required Skill */}
                    <TableCell className="text-sm text-muted-foreground">
                      {t.required_skill ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted font-medium text-foreground">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          {t.required_skill}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Any Skill</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge value={(t.status || "UNASSIGNED").replace("_", " ")} />
                    </TableCell>

                    {/* Volunteers Assigned Ratio */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                            isFull
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300"
                              : assignedCount > 0
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300"
                          }`}
                        >
                          {assignedCount} / {required}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isFull ? "Filled" : `${required - assignedCount} needed`}
                        </span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTaskId(t.task_id)}
                        className="h-8 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Eye className="size-3.5" />
                        View & Progress
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
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

      {/* ========================================================================= */}
      {/* 1. CREATE TASK MODAL (With Individual vs Team Selection & Count) */}
      {/* ========================================================================= */}
      <Dialog
        open={creating}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            resetCreateForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
              <PlusCircle className="h-5 w-5" />
              Create Humanitarian Relief Task
            </DialogTitle>
            <DialogDescription>
              Dispatch this mission to volunteer field teams for immediate relief operations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="font-semibold text-xs">
                Task Title
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distribute clean drinking water rations"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc" className="font-semibold text-xs">
                Task Instructions & Mission Details
              </Label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details and instructions about the task..."
                rows={3}
              />
            </div>

            {/* Task Type & Volunteer Capacity Selector */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border">
              <div className="space-y-1.5">
                <Label htmlFor="task-type" className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  Mission Type
                </Label>
                <Select
                  value={taskType}
                  onValueChange={(val: "INDIVIDUAL" | "TEAM") => {
                    setTaskType(val);
                    if (val === "INDIVIDUAL") {
                      setVolunteersRequired(1);
                    } else if (volunteersRequired <= 1) {
                      setVolunteersRequired(3);
                    }
                  }}
                >
                  <SelectTrigger id="task-type" className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIVIDUAL">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>Individual (Solo)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TEAM">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <span>Team Mission</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="volunteer-count" className="font-semibold text-xs text-foreground uppercase tracking-wider">
                  {taskType === "TEAM" ? "Volunteers Needed" : "Capacity"}
                </Label>
                <Input
                  id="volunteer-count"
                  type="number"
                  min={taskType === "TEAM" ? 2 : 1}
                  max={50}
                  disabled={taskType === "INDIVIDUAL"}
                  value={volunteersRequired}
                  onChange={(e) => setVolunteersRequired(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="bg-background"
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            {/* Priority & Required Skill */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-priority" className="font-semibold text-xs">
                  Priority
                </Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-skill" className="font-semibold text-xs">
                  Required Skill (Optional)
                </Label>
                <Input
                  id="task-skill"
                  value={requiredSkill}
                  onChange={(e) => setRequiredSkill(e.target.value)}
                  placeholder="e.g. Logistics & Transport, First Aid"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="task-location" className="font-semibold text-xs">
                Field Location / Destination
              </Label>
              <Input
                id="task-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Colombo Flood Relief Center #3"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCreating(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!title.trim() || createMutation.isPending}
              className="bg-primary hover:bg-primary/90 font-bold"
              onClick={() => {
                createMutation.mutate({
                  title: title.trim(),
                  description: description.trim(),
                  priority: taskPriority,
                  required_skill: requiredSkill.trim() || undefined,
                  task_type: taskType,
                  volunteers_required: volunteersRequired,
                  location: location.trim() || undefined,
                });
              }}
            >
              {createMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. TASK DETAILS & LIVE PROGRESS INSPECTOR MODAL (Wide 2-Column Layout) */}
      {/* ========================================================================= */}
      {selectedTask && (
        <Dialog
          open={!!selectedTaskId}
          onOpenChange={(o) => {
            if (!o) setSelectedTaskId(null);
          }}
        >
          <DialogContent className="max-w-4xl lg:max-w-5xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Modal Top Header */}
              <div className="border-b border-border bg-muted/30 px-6 py-5 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        selectedTask.priority === "CRITICAL"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/50 border border-red-300"
                          : selectedTask.priority === "HIGH"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 border border-orange-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 border border-amber-300"
                      }`}
                    >
                      {selectedTask.priority} Priority
                    </span>
                    <StatusBadge value={(selectedTask.status || "UNASSIGNED").replace("_", " ")} />
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {selectedTask.task_type === "TEAM" || (selectedTask.volunteers_required || 1) > 1
                        ? `Team Mission (${selectedTask.volunteers_required || 1} Volunteers)`
                        : "Individual Solo (1 Volunteer)"}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    #TASK-{selectedTask.task_id?.slice(0, 8).toUpperCase() || selectedTask.id?.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="mt-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">{selectedTask.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cleanTaskDescription(selectedTask.description)}
                  </p>
                </div>

                {/* 4 Quick Stat Metric Badges Bar */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Required Skill
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {selectedTask.required_skill || "General Relief"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Volunteers Assigned
                    </span>
                    <p className="text-base font-extrabold text-foreground mt-0.5">
                      {selectedTask.task_assignments?.length || 0} / {selectedTask.volunteers_required || 1}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {(selectedTask.task_assignments?.length || 0) >= (selectedTask.volunteers_required || 1)
                          ? "(Filled)"
                          : "(Needed)"}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Field Location
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                      {selectedTask.location || "On-site Relief Store"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Dispatched Date
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {new Date(selectedTask.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body: 2 Columns */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Security PIN Lifecycle & SitRep Timeline (7 cols) */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* SECTION: DUAL-LEG SECURITY VERIFICATION PINS */}
                    {(() => {
                      const isWarehouseDone =
                        (selectedTask.task_progress || []).some(
                          (p: any) =>
                            (p.remarks || "").toLowerCase().includes("warehouse") ||
                            (p.progress_percent || 0) >= 50,
                        ) || selectedTask.status === "COMPLETED";
                      const isCompleted = selectedTask.status === "COMPLETED";
                      const isAssigned =
                        selectedTask.status === "ASSIGNED" || selectedTask.status === "IN_PROGRESS";
                      const warehousePin = selectedTask.warehouse_pickup_pin || "8421";
                      const isPinRevealed =
                        revealedTaskPins[selectedTask.id || selectedTask.task_id || ""] || false;
                      const isDonation =
                        (selectedTask.title || "").toLowerCase().includes("pickup") ||
                        (selectedTask.description || "").toLowerCase().includes("donation");

                      return (
                        <div className="rounded-xl border border-primary/20 bg-background p-4 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <span className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                              <ShieldCheck className="h-4 w-4 text-primary" /> Multi-Stage Security PIN Lifecycle
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              Stage-by-Stage Verification
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Stage 1 Box */}
                            <div
                              className={`p-3 rounded-lg border flex flex-col justify-between ${
                                isWarehouseDone
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                                  : isAssigned
                                  ? "bg-primary/5 border-primary/30 text-foreground"
                                  : "bg-muted/30 border-dashed border-border text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold">
                                  {isDonation ? "🎁 Stage 1: Donor Collection PIN" : "📦 Stage 1: Warehouse Dispatch PIN"}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isWarehouseDone
                                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                      : isAssigned
                                      ? "bg-primary/20 text-primary animate-pulse"
                                      : "bg-slate-500/10 text-slate-500"
                                  }`}
                                >
                                  {isWarehouseDone
                                    ? "VERIFIED & CLOSED"
                                    : isAssigned
                                    ? "ACTIVE FOR STAFF"
                                    : "PENDING ASSIGNMENT"}
                                </span>
                              </div>

                              <div className="mt-2">
                                {isWarehouseDone ? (
                                  <div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> PIN Verified & Expired (Closed)
                                    </span>
                                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300 mt-0.5">
                                      {isDonation
                                        ? "Items collected from donor; en route to Central Warehouse."
                                        : "Stock released to volunteer; goods now in vehicle transit."}
                                    </p>
                                  </div>
                                ) : isDonation ? (
                                  <div>
                                    <span className="text-sm font-bold tracking-widest text-muted-foreground font-mono block">
                                      🔒 •••• (Private to Donor)
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Donor provides 4-digit code directly from mobile app to volunteer.
                                    </p>
                                  </div>
                                ) : isAssigned ? (
                                  isPinRevealed ? (
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xl font-black tracking-widest text-primary font-mono block">
                                          {warehousePin}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10"
                                          onClick={() => {
                                            navigator.clipboard.writeText(warehousePin);
                                            toast.success("Warehouse Dispatch PIN copied!");
                                          }}
                                        >
                                          <Copy className="h-3 w-3 mr-1" /> Copy
                                        </Button>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Provide to volunteer at warehouse upon goods collection.
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 w-full justify-center gap-1.5"
                                        onClick={() => {
                                          setRevealedTaskPins((prev) => ({
                                            ...prev,
                                            [selectedTask.id || selectedTask.task_id || ""]: true,
                                          }));
                                          toast.info("Warehouse Dispatch PIN revealed for staff.");
                                        }}
                                      >
                                        <KeyRound className="h-3.5 w-3.5" /> Reveal Warehouse PIN
                                      </Button>
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        Click to display 4-digit code for volunteer collection.
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div>
                                    <span className="text-xs italic text-muted-foreground block">
                                      ⏳ Inactive (Activates when volunteer accepts mission)
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Awaiting volunteer assignment.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stage 2 Box */}
                            <div
                              className={`p-3 rounded-lg border flex flex-col justify-between ${
                                isCompleted
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                                  : isWarehouseDone && isDonation
                                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200"
                                  : "bg-muted/40 border-border text-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold">
                                  {isDonation
                                    ? "🏛️ Stage 2: Warehouse Deposit PIN"
                                    : "🤝 Stage 2: Recipient Doorstep PIN"}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isCompleted
                                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                      : isWarehouseDone && isDonation
                                      ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 animate-pulse"
                                      : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                                  }`}
                                >
                                  {isCompleted
                                    ? "COMPLETED & CLOSED"
                                    : isWarehouseDone && isDonation
                                    ? "ACTIVE FOR STORE"
                                    : "AWAITING STAGE 1"}
                                </span>
                              </div>

                              <div className="mt-2">
                                {isCompleted ? (
                                  <div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> PIN Verified & Expired (Closed)
                                    </span>
                                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300 mt-0.5">
                                      {isDonation
                                        ? "Items safely deposited and credited to emergency relief inventory."
                                        : "Relief delivery verified by recipient; mission fulfilled."}
                                    </p>
                                  </div>
                                ) : isDonation && isWarehouseDone ? (
                                  isPinRevealed ? (
                                    <div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-xl font-black tracking-widest text-indigo-600 dark:text-indigo-400 font-mono block">
                                          {warehousePin}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 px-2 text-[10px] text-indigo-600 hover:bg-indigo-500/10"
                                          onClick={() => {
                                            navigator.clipboard.writeText(warehousePin);
                                            toast.success("Warehouse Deposit PIN copied!");
                                          }}
                                        >
                                          <Copy className="h-3 w-3 mr-1" /> Copy
                                        </Button>
                                      </div>
                                      <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300 mt-0.5">
                                        Store staff provide to volunteer to confirm inventory receipt.
                                      </p>
                                    </div>
                                  ) : (
                                    <div>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs font-semibold border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 w-full justify-center gap-1.5"
                                        onClick={() => {
                                          setRevealedTaskPins((prev) => ({
                                            ...prev,
                                            [selectedTask.id || selectedTask.task_id || ""]: true,
                                          }));
                                          toast.info("Warehouse Deposit PIN revealed for store staff.");
                                        }}
                                      >
                                        <KeyRound className="h-3.5 w-3.5" /> Reveal Store Deposit PIN
                                      </Button>
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        Click to display code for inventory inward receipt.
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div>
                                    <span className="text-sm font-bold tracking-widest text-muted-foreground font-mono block">
                                      🔒 •••• ({isDonation ? "Pending Stage 1 Collection" : "Private to Recipient"})
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      {isDonation
                                        ? "Activates once volunteer completes Stage 1 collection from donor."
                                        : "Recipient provides 4-digit PIN directly from mobile app to volunteer."}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SECTION B: LIVE PROGRESS & SITREP LOG */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-bold text-sm text-foreground">Live Progress & Field SitReps</h3>
                      </div>

                      {/* Calculated Progress Bar */}
                      {(() => {
                        const isTeam =
                          selectedTask.task_type === "TEAM" || (selectedTask.volunteers_required || 1) > 1;
                        const requiredCount = selectedTask.volunteers_required || 1;

                        const volProgMap = new Map();

                        if (selectedTask.task_assignments) {
                          for (const a of selectedTask.task_assignments) {
                            const u = a.volunteers?.users;
                            const uid = u?.email || a.volunteers?.volunteer_id || a.assignment_id;
                            if (a.assignment_status === "COMPLETED") {
                              volProgMap.set(uid, 100);
                            } else {
                              volProgMap.set(uid, 25);
                            }
                          }
                        }

                        if (selectedTask.task_progress) {
                          for (const p of selectedTask.task_progress) {
                            const uid = p.users?.email || p.updated_by_user_id;
                            if (uid) {
                              const curr = volProgMap.get(uid) || 0;
                              const pPercent = typeof p.progress_percent === "number" ? p.progress_percent : 0;
                              volProgMap.set(uid, Math.max(curr, pPercent));
                            }
                          }
                        }

                        let sumProg = 0;
                        volProgMap.forEach((v) => {
                          sumProg += v;
                        });
                        const teamPercent = isTeam
                          ? Math.min(100, Math.round(sumProg / requiredCount))
                          : selectedTask.status === "COMPLETED"
                          ? 100
                          : selectedTask.task_progress?.[0]?.progress_percent ||
                            (selectedTask.task_assignments?.[0]?.assignment_status === "COMPLETED" ? 100 : 25);

                        return (
                          <div className="p-3 bg-card border border-border rounded-lg space-y-1.5 shadow-2xs">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-foreground flex items-center gap-1.5">
                                {isTeam
                                  ? `Team Mission Progress (${volProgMap.size} of ${requiredCount} active)`
                                  : "Mission Progress"}
                              </span>
                              <span className="text-emerald-600 font-bold">{teamPercent}% Completed</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${teamPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Timeline */}
                      {(!selectedTask.task_progress || selectedTask.task_progress.length === 0) ? (
                        <div className="p-4 bg-muted/20 border border-border/80 rounded-xl text-center">
                          <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                          <p className="text-xs text-muted-foreground font-medium">
                            No live field SitReps recorded yet. When volunteers update status from their mobile app, updates will stream here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {[...selectedTask.task_progress]
                            .sort(
                              (a: any, b: any) =>
                                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
                            )
                            .map((p: any, idx: number) => {
                              const user = p.users || {};
                              const author =
                                `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Volunteer";

                              return (
                                <div
                                  key={p.progress_id || idx}
                                  className="p-2.5 rounded-lg border border-border/80 bg-muted/20 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-foreground flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                      {author} • {p.progress_percent}%
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(p.updated_at).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}{" "}
                                      ({new Date(p.updated_at).toLocaleDateString()})
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground pl-4">
                                    {p.remarks || "Status updated"}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Assigned Volunteers & Location Details (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* SECTION A: ASSIGNED VOLUNTEERS */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                            Assigned Volunteers ({selectedTask.task_assignments?.length || 0} /{" "}
                            {selectedTask.volunteers_required || 1})
                          </h3>
                        </div>

                        {(selectedTask.task_assignments?.length || 0) <
                          (selectedTask.volunteers_required || 1) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 gap-1 font-semibold border-primary/30 text-primary"
                            onClick={() => setAssigningVolunteer(true)}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Assign
                          </Button>
                        )}
                      </div>

                      {/* Assignment List */}
                      {!selectedTask.task_assignments || selectedTask.task_assignments.length === 0 ? (
                        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                            No volunteers assigned yet. Open for registered volunteers to pick up or assign manually above.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedTask.task_assignments.map((a: any, idx: number) => {
                            const user = a.volunteers?.users || {};
                            const name =
                              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                              `Volunteer #${idx + 1}`;
                            const phone = user.phone || a.volunteers?.phone_number || "";
                            const email = user.email || "";
                            const isTeam =
                              selectedTask.task_type === "TEAM" ||
                              (selectedTask.volunteers_required || 1) > 1;
                            const isLeader = a.is_leader === true || idx === 0;

                            return (
                              <div
                                key={a.assignment_id || idx}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isTeam && isLeader
                                    ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                                    : "border-border bg-card hover:bg-muted/30"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                      isTeam && isLeader
                                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30"
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {isTeam && isLeader ? "⭐" : name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-xs text-foreground">{name}</p>
                                      {isTeam && (
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                            isLeader
                                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                              : "bg-muted text-muted-foreground border-border"
                                          }`}
                                        >
                                          {isLeader ? "Leader" : "Member"}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      {phone || email || "Contact in App"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {phone && (
                                    <a
                                      href={`tel:${phone}`}
                                      className="p-1 rounded text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                                      title="Call Volunteer"
                                    >
                                      <Phone className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  {a.assignment_status === "VERIFIED_ON_SITE" ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                                      Assigned
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Field Location & Address Card */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Mission Location
                      </span>
                      <p className="text-xs font-semibold text-foreground flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>{selectedTask.location || "Central Relief Store / On-site"}</span>
                      </p>
                      {selectedTask.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            selectedTask.location,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted transition-colors shadow-2xs"
                        >
                          <MapPin className="h-3 w-3 text-red-500" />
                          Open Location in Google Maps <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Footer */}
              <div className="border-t border-border bg-muted/20 px-6 py-3 flex items-center justify-between shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setSelectedTaskId(null)}>
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  {(selectedTask.task_assignments?.length || 0) <
                    (selectedTask.volunteers_required || 1) && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 text-xs gap-1"
                      onClick={() => setAssigningVolunteer(true)}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Assign Volunteer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* 3. ASSIGN VOLUNTEER DIALOG */}
      {/* ========================================================================= */}
      {assigningVolunteer && (
        <Dialog open={assigningVolunteer} onOpenChange={setAssigningVolunteer}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Assign Volunteer to Task</DialogTitle>
              <DialogDescription>
                Select a registered volunteer to add to this{" "}
                {selectedTask?.task_type === "TEAM" ? "team mission" : "task"}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Available Volunteers
              </Label>
              <Select value={chosenVolunteerId} onValueChange={setChosenVolunteerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a volunteer..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVolunteers.map((vol: any) => {
                    const u = vol.users || {};
                    const name =
                      `${u.first_name || ""} ${u.last_name || ""}`.trim() || vol.volunteer_id;
                    const phone = u.phone || vol.phone_number || "";
                    return (
                      <SelectItem key={vol.volunteer_id} value={vol.volunteer_id}>
                        {name} {phone ? `(${phone})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setAssigningVolunteer(false)}>
                Cancel
              </Button>
              <Button
                disabled={!chosenVolunteerId || assignMutation.isPending}
                className="bg-primary hover:bg-primary/90 font-bold"
                onClick={() => {
                  if (selectedTask && chosenVolunteerId) {
                    assignMutation.mutate({
                      taskId: selectedTask.task_id,
                      volunteerId: chosenVolunteerId,
                    });
                  }
                }}
              >
                {assignMutation.isPending ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
