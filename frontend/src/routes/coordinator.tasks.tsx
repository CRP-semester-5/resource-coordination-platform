import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tasksAPI, volunteersAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, User, Clock, CheckCircle2, MapPin, Wrench, Calendar, PlusCircle, Activity, Copy, KeyRound, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/coordinator/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — ResQ Hub Coordinator" },
    ],
  }),
  component: TasksPage,
});

const PAGE_SIZE = 8;
const STATUSES = ["UNASSIGNED", "PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function TasksPage() {
  const { orgId } = useOrganization();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
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
    queryFn: () => tasksAPI.getAll(),
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
    queryFn: () => volunteersAPI.getAll(),
    enabled: creating || !!selectedTaskId,
  });

  const availableVolunteers = volunteersResponse?.data?.data || [];

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
    }
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
    }
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

  const tasks = response?.data?.data || [];

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t: any) =>
          (status === "all" || t.status === status) &&
          (priority === "all" || t.priority === priority) &&
          (search === "" ||
            [t.title, t.description, t.required_skill, t.location]
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase())),
      ),
    [tasks, status, priority, search],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <>
      <PageHeader 
        title="Tasks" 
        description={`Manage ${tasks.length} task${tasks.length === 1 ? "" : "s"} for your organization.`} 
        actions={
          <Button onClick={() => setCreating(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Task
          </Button>
        }
      />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search tasks by title, description or skill..."
        filters={[
          { label: "Status", value: status, options: STATUSES, onChange: (v) => { setStatus(v); setPage(1); } },
          { label: "Priority", value: priority, options: PRIORITIES, onChange: (v) => { setPriority(v); setPage(1); } },
        ]}
      />

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
                <TableHead>Type</TableHead>
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
                const isTeam = t.task_type === 'TEAM' || required > 1;

                return (
                  <TableRow 
                    key={t.task_id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedTaskId(t.task_id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{t.title}</span>
                      </div>
                      <span className="block text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                        {t.description || "No description provided"}
                      </span>
                    </TableCell>

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

                    <TableCell>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        t.priority === 'CRITICAL' 
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                          : t.priority === 'HIGH' 
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' 
                          : t.priority === 'LOW'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}>
                        {t.priority}
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {t.required_skill ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted">
                          <Wrench className="h-3 w-3 text-muted-foreground" />
                          {t.required_skill}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Any Skill</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <StatusBadge value={(t.status || 'UNASSIGNED').replace("_", " ")} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                          isFull 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                            : assignedCount > 0 
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300' 
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}>
                          {assignedCount} / {required}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isFull ? "Filled" : `${required - assignedCount} needed`}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.task_id);
                        }}
                        className="text-xs"
                      >
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
      <Dialog open={creating} onOpenChange={(o) => { if (!o) { setCreating(false); resetCreateForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Task</DialogTitle>
            <DialogDescription>Add a new task for volunteers to pick up or be assigned.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="font-semibold">Title</Label>
              <Input 
                id="task-title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Distribute water rations" 
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc" className="font-semibold">Description</Label>
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
                        <span>Individual (1 Person)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TEAM">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-500" />
                        <span>Team / Multi-Volunteer</span>
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
                <Label htmlFor="task-priority" className="font-semibold">Priority</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger id="task-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-skill" className="font-semibold">Required Skill (Optional)</Label>
                <Input 
                  id="task-skill" 
                  value={requiredSkill} 
                  onChange={(e) => setRequiredSkill(e.target.value)} 
                  placeholder="e.g. Driver, First Aid" 
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="task-location" className="font-semibold">Location (Optional)</Label>
              <Input 
                id="task-location" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder="e.g. Colombo Flood Relief Center #3" 
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setCreating(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button
              disabled={!title.trim() || createMutation.isPending}
              className="bg-primary hover:bg-primary/90"
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
      {/* 2. TASK DETAILS & LIVE PROGRESS INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedTask && (
        <Dialog open={!!selectedTaskId} onOpenChange={(o) => { if (!o) setSelectedTaskId(null); }}>
          <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedTask.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      selectedTask.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {selectedTask.priority} Priority
                    </span>
                    <StatusBadge value={(selectedTask.status || 'UNASSIGNED').replace("_", " ")} />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedTask.task_type === 'TEAM' || (selectedTask.volunteers_required || 1) > 1
                        ? `Team Mission (${selectedTask.volunteers_required || 1} Volunteers)`
                        : 'Individual Mission (1 Volunteer)'}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold">{selectedTask.title}</DialogTitle>
                </div>
              </div>
              <DialogDescription className="text-sm mt-1">
                {selectedTask.description || "No description provided."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-3">
              {/* Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Required Skill</span>
                  <span className="font-semibold text-foreground">{selectedTask.required_skill || "None required"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Location</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-red-500 inline" />
                    {selectedTask.location || "On-site"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Created At</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-500 inline" />
                    {new Date(selectedTask.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* SECTION A: ASSIGNED VOLUNTEERS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">
                      Assigned Volunteers ({selectedTask.task_assignments?.length || 0} / {selectedTask.volunteers_required || 1})
                    </h3>
                  </div>

                  {/* Quick Assign button if slots remaining */}
                  {(selectedTask.task_assignments?.length || 0) < (selectedTask.volunteers_required || 1) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 gap-1"
                      onClick={() => setAssigningVolunteer(true)}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Assign Volunteer
                    </Button>
                  )}
                </div>

                {/* Assignment List */}
                {(!selectedTask.task_assignments || selectedTask.task_assignments.length === 0) ? (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 rounded-xl text-center">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      No volunteers assigned yet. Open for registered volunteers to pick up or assign manually above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTask.task_assignments.map((a: any, idx: number) => {
                      const user = a.volunteers?.users || {};
                      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || `Volunteer #${idx + 1}`;
                      const phone = user.phone || a.volunteers?.phone_number || "No phone";
                      const email = user.email || "";
                      const isTeam = selectedTask.task_type === 'TEAM' || (selectedTask.volunteers_required || 1) > 1;
                      const isLeader = a.is_leader === true || idx === 0;

                      return (
                        <div 
                          key={a.assignment_id || idx}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            isTeam && isLeader 
                              ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10' 
                              : 'border-border bg-card hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isTeam && isLeader 
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                              {isTeam && isLeader ? '⭐' : name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-xs text-foreground">{name}</p>
                                {isTeam && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isLeader 
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' 
                                      : 'bg-muted text-muted-foreground border-border'
                                  }`}>
                                    {isLeader ? '⭐ Team Leader' : '👥 Member'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">{email} • {phone}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {a.assignment_status === 'VERIFIED_ON_SITE' ? (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                🟢 Verified on Site
                              </span>
                            ) : a.assignment_status === 'REPORTED_ON_SITE' ? (
                              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                🟡 Reported on Site
                              </span>
                            ) : a.assignment_status === 'COMPLETED' ? (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                ✅ Completed
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
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

              {/* SECTION: DUAL-LEG SECURITY VERIFICATION PINS */}
              {(() => {
                const isWarehouseDone = (selectedTask.task_progress || []).some(
                  (p: any) => (p.remarks || '').toLowerCase().includes('warehouse') || (p.progress_percent || 0) >= 50
                ) || selectedTask.status === 'COMPLETED';
                const isCompleted = selectedTask.status === 'COMPLETED';
                const isAssigned = selectedTask.status === 'ASSIGNED' || selectedTask.status === 'IN_PROGRESS';
                const warehousePin = selectedTask.warehouse_pickup_pin || '8421';
                const isPinRevealed = revealedTaskPins[selectedTask.id || selectedTask.task_id || ''] || false;
                const isDonation = (selectedTask.title || '').toLowerCase().includes('pickup') || (selectedTask.description || '').toLowerCase().includes('donation');

                return (
                  <div className="p-3.5 bg-background rounded-xl border border-border shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <span className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" /> Multi-Stage Security PIN Lifecycle
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">Stage-by-Stage Verification</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Stage 1 Box */}
                      <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                        isWarehouseDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                          : isAssigned
                          ? 'bg-primary/5 border-primary/30 text-foreground'
                          : 'bg-muted/30 border-dashed border-border text-muted-foreground'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">
                            {isDonation ? '🎁 Stage 1: Donor Collection PIN' : '📦 Stage 1: Warehouse Dispatch PIN'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isWarehouseDone
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                              : isAssigned
                              ? 'bg-primary/20 text-primary animate-pulse'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}>
                            {isWarehouseDone ? 'VERIFIED & CLOSED' : isAssigned ? 'ACTIVE FOR STAFF' : 'PENDING ASSIGNMENT'}
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
                                      toast.success('Warehouse Dispatch PIN copied!');
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
                                      [selectedTask.id || selectedTask.task_id || '']: true,
                                    }));
                                    toast.info('Warehouse Dispatch PIN revealed for staff.');
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
                      <div className={`p-3 rounded-lg border flex flex-col justify-between ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                          : isWarehouseDone && isDonation
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200'
                          : 'bg-muted/40 border-border text-foreground'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">
                            {isDonation ? '🏛️ Stage 2: Warehouse Deposit PIN' : '🤝 Stage 2: Recipient Doorstep PIN'}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                              : isWarehouseDone && isDonation
                              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 animate-pulse'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'
                          }`}>
                            {isCompleted
                              ? 'COMPLETED & CLOSED'
                              : isWarehouseDone && isDonation
                              ? 'ACTIVE FOR STORE'
                              : 'AWAITING STAGE 1'}
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
                                      toast.success('Warehouse Deposit PIN copied!');
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
                                      [selectedTask.id || selectedTask.task_id || '']: true,
                                    }));
                                    toast.info('Warehouse Deposit PIN revealed for store staff.');
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
                                🔒 •••• ({isDonation ? 'Pending Stage 1 Collection' : 'Private to Recipient'})
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
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-foreground">Live Progress & Field SitReps</h3>
                </div>

                {(!selectedTask.task_progress || selectedTask.task_progress.length === 0) ? (
                  <div className="p-4 bg-muted/30 border border-border rounded-xl text-center">
                    <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-1 opacity-50" />
                    <p className="text-xs text-muted-foreground font-medium">
                      No live progress recorded yet. When volunteers update status (En Route, On Scene, Done) or send SitRep reports from the mobile app, updates will stream here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Calculated Team / Overall Progress Bar */}
                      {(() => {
                        const isTeam = selectedTask.task_type === 'TEAM' || (selectedTask.volunteers_required || 1) > 1;
                        const requiredCount = selectedTask.volunteers_required || 1;
                        
                        // Map latest / highest progress per assigned volunteer
                        const volProgMap = new Map();

                        // 1. Check all assigned volunteers
                        if (selectedTask.task_assignments) {
                          for (const a of selectedTask.task_assignments) {
                            const u = a.volunteers?.users;
                            const uid = u?.email || a.volunteers?.volunteer_id || a.assignment_id;
                            if (a.assignment_status === 'COMPLETED') {
                              volProgMap.set(uid, 100);
                            } else {
                              volProgMap.set(uid, 25);
                            }
                          }
                        }

                        // 2. Check all SitRep / progress entries
                        if (selectedTask.task_progress) {
                          for (const p of selectedTask.task_progress) {
                            const uid = p.users?.email || p.updated_by_user_id;
                            if (uid) {
                              const curr = volProgMap.get(uid) || 0;
                              const pPercent = typeof p.progress_percent === 'number' ? p.progress_percent : 0;
                              volProgMap.set(uid, Math.max(curr, pPercent));
                            }
                          }
                        }

                        let sumProg = 0;
                        volProgMap.forEach((v) => { sumProg += v; });
                        const teamPercent = isTeam 
                          ? Math.min(100, Math.round(sumProg / requiredCount))
                          : (selectedTask.status === 'COMPLETED' ? 100 : (selectedTask.task_progress?.[0]?.progress_percent || (selectedTask.task_assignments?.[0]?.assignment_status === 'COMPLETED' ? 100 : 25)));

                        return (
                          <div className="p-3 bg-card border border-border rounded-lg space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-foreground flex items-center gap-1.5">
                                {isTeam ? `Team Mission Progress (${volProgMap.size} of ${requiredCount} volunteers active)` : "Mission Progress"}
                              </span>
                              <span className="text-emerald-600 font-bold">
                                {teamPercent}% {isTeam ? `(${sumProg} / ${requiredCount * 100} pts)` : ""}
                              </span>
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
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {[...selectedTask.task_progress].sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map((p: any, idx: number) => {
                        const user = p.users || {};
                        const author = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Volunteer';
                        
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
                                {new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(p.updated_at).toLocaleDateString()})
                              </span>
                            </div>
                            <p className="text-muted-foreground pl-4">
                              {p.remarks || "Status updated"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button variant="outline" onClick={() => setSelectedTaskId(null)}>
                Close
              </Button>
            </DialogFooter>
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
                Select a registered volunteer to add to this {selectedTask?.task_type === 'TEAM' ? 'team mission' : 'task'}.
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
                    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || vol.volunteer_id;
                    const phone = u.phone || vol.phone_number || '';
                    return (
                      <SelectItem key={vol.volunteer_id} value={vol.volunteer_id}>
                        {name} {phone ? `(${phone})` : ''}
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
                onClick={() => {
                  if (selectedTask && chosenVolunteerId) {
                    assignMutation.mutate({
                      taskId: selectedTask.task_id,
                      volunteerId: chosenVolunteerId
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
