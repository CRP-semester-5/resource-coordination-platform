import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  User,
  UserCheck,
  CheckCircle2,
  Clock,
  Phone,
  PhoneCall,
  Mail,
  Copy,
  Wrench,
  ShieldCheck,
  Activity,
  Truck,
  PlusCircle,
  ExternalLink,
  Calendar,
  Eye,
  Award,
  MapPin,
  Briefcase,
  AlertCircle,
  Search,
  ArrowRight,
} from "lucide-react";
import { volunteersAPI, tasksAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { PageHeader } from "@/components/page-header";
import { Toolbar, EmptyState } from "@/components/toolbar";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/coordinator/volunteers")({
  head: () => ({
    meta: [
      { title: "Volunteers — ResQ Hub Coordinator" },
      {
        name: "description",
        content: "Manage volunteer deployment, skills, active field missions, and availability for emergency relief.",
      },
    ],
  }),
  component: VolunteersPage,
});

const PAGE_SIZE = 8;
const AVAILABILITY_OPTIONS = ["Available", "On Mission", "Unavailable"];
const EXPERIENCE_OPTIONS = ["0-1 Years", "1-3 Years", "3+ Years"];

function getVolunteerName(v: any): string {
  const u = v.users || {};
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return full || u.name || v.name || "Volunteer";
}

function getVolunteerSkills(v: any): string[] {
  if (!v.volunteer_skills || !Array.isArray(v.volunteer_skills)) return [];
  return v.volunteer_skills
    .map((s: any) => s.skills?.skill_name || s.skill_name || "")
    .filter(Boolean);
}

function getInitials(name: string): string {
  if (!name) return "VO";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VO";
  if (parts.length === 1) return (parts[0] || "").slice(0, 2).toUpperCase();
  const first = parts[0]?.charAt(0) || "V";
  const last = parts[parts.length - 1]?.charAt(0) || "O";
  return (first + last).toUpperCase();
}

function VolunteersPage() {
  const { orgId } = useOrganization();
  const [activeTab, setActiveTab] = useState<"all" | "available" | "on_mission" | "unavailable" | "skilled">("all");
  const [search, setSearch] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Volunteer Profile Modal
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);

  // 1. Fetch Volunteers
  const { data: response, isLoading } = useQuery({
    queryKey: ["volunteers", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const res = await volunteersAPI.getAll(orgId);
      const list = res.data?.data ?? res.data ?? [];
      return Array.isArray(list) ? list : [];
    },
    enabled: !!orgId,
    refetchInterval: 5000,
  });

  const volunteers: any[] = useMemo(() => {
    if (Array.isArray(response)) return response;
    return (response as any)?.data?.data || [];
  }, [response]);

  // 2. Fetch Tasks to link real-time volunteer mission workload
  const { data: tasksRes } = useQuery({
    queryKey: ["tasks", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      try {
        const res = await tasksAPI.getAll(orgId);
        const list = res.data?.data ?? res.data ?? [];
        return Array.isArray(list) ? list : [];
      } catch {
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

  // Helper to get active and completed missions for any volunteer
  const getVolunteerTasks = (volId: string) => {
    if (!volId) return { active: [] as any[], completed: [] as any[], all: [] as any[] };
    const matched = allTasks.filter((t: any) => {
      if (!t.task_assignments || !Array.isArray(t.task_assignments)) return false;
      return t.task_assignments.some((a: any) => {
        const vid = a.volunteer_id || a.volunteers?.volunteer_id;
        return vid === volId;
      });
    });
    const active = matched.filter((t: any) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
    const completed = matched.filter((t: any) => t.status === "COMPLETED");
    return { active, completed, all: matched };
  };

  const handleCopy = (text: string, label: string) => {
    if (!text || text === "No phone") {
      toast.error(`No ${label.toLowerCase()} available`);
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Distinct Skills across all volunteers
  const allSkills = useMemo(() => {
    const set = new Set<string>();
    volunteers.forEach((v) => {
      getVolunteerSkills(v).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [volunteers]);

  // Operational metrics
  const totalCount = volunteers.length;
  const onMissionCount = volunteers.filter((v) => getVolunteerTasks(v.volunteer_id).active.length > 0).length;
  const availableCount = volunteers.filter(
    (v) =>
      (v.availability_status === "AVAILABLE" || v.availability_status === "available") &&
      getVolunteerTasks(v.volunteer_id).active.length === 0,
  ).length;
  const unavailableCount = volunteers.filter(
    (v) =>
      (v.availability_status === "UNAVAILABLE" || v.availability_status === "unavailable") &&
      getVolunteerTasks(v.volunteer_id).active.length === 0,
  ).length;
  const skilledCount = volunteers.filter((v) => getVolunteerSkills(v).length > 0).length;

  const quickTabs = [
    { id: "all" as const, label: "All Volunteers", count: totalCount },
    { id: "available" as const, label: "Available Now", count: availableCount },
    { id: "on_mission" as const, label: "On Mission", count: onMissionCount },
    { id: "unavailable" as const, label: "Unavailable", count: unavailableCount },
    { id: "skilled" as const, label: "Specialized Skills", count: skilledCount },
  ];

  // Filtering Logic
  const filtered = useMemo(() => {
    return volunteers.filter((v: any) => {
      const tasks = getVolunteerTasks(v.volunteer_id);
      const isAvailable =
        (v.availability_status === "AVAILABLE" || v.availability_status === "available") &&
        tasks.active.length === 0;
      const isOnMission = tasks.active.length > 0;
      const isUnavailable =
        (v.availability_status === "UNAVAILABLE" || v.availability_status === "unavailable") &&
        tasks.active.length === 0;
      const skills = getVolunteerSkills(v);
      const exp = Number(v.experience_years) || 0;

      // Tab filter
      if (activeTab === "available" && !isAvailable) return false;
      if (activeTab === "on_mission" && !isOnMission) return false;
      if (activeTab === "unavailable" && !isUnavailable) return false;
      if (activeTab === "skilled" && skills.length === 0) return false;

      // Availability dropdown
      if (availabilityFilter === "Available" && !isAvailable) return false;
      if (availabilityFilter === "On Mission" && !isOnMission) return false;
      if (availabilityFilter === "Unavailable" && !isUnavailable) return false;

      // Skill dropdown
      if (skillFilter !== "all" && !skills.includes(skillFilter)) return false;

      // Experience dropdown
      if (experienceFilter === "0-1 Years" && exp > 1) return false;
      if (experienceFilter === "1-3 Years" && (exp < 1 || exp > 3)) return false;
      if (experienceFilter === "3+ Years" && exp < 3) return false;

      // Search
      if (search.trim() !== "") {
        const name = getVolunteerName(v);
        const email = v.users?.email || "";
        const phone = v.users?.phone || "";
        const skillsText = skills.join(" ");
        const target = [name, email, phone, skillsText].join(" ").toLowerCase();
        if (!target.includes(search.toLowerCase())) return false;
      }

      return true;
    });
  }, [volunteers, activeTab, availabilityFilter, skillFilter, experienceFilter, search, allTasks]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const selectedVolunteer = useMemo(() => {
    if (!selectedVolunteerId) return null;
    return volunteers.find((v) => v.volunteer_id === selectedVolunteerId) || null;
  }, [volunteers, selectedVolunteerId]);

  const selectedVolunteerTasks = useMemo(() => {
    if (!selectedVolunteer) return { active: [], completed: [], all: [] };
    return getVolunteerTasks(selectedVolunteer.volunteer_id);
  }, [selectedVolunteer, allTasks]);

  return (
    <>
      <PageHeader
        title="Volunteers"
        description={`${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"} registered for humanitarian operations.`}
      />

      {/* 📊 Key Operational Metrics Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-5">
        <div
          onClick={() => {
            setActiveTab(activeTab === "available" ? "all" : "available");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "available" && "ring-2 ring-emerald-500/50 rounded-xl",
          )}
        >
          <StatCard
            label="Available Now"
            value={availableCount}
            hint="Ready for immediate dispatch"
            icon={UserCheck}
            tone="success"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab(activeTab === "on_mission" ? "all" : "on_mission");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "on_mission" && "ring-2 ring-primary/50 rounded-xl",
          )}
        >
          <StatCard
            label="On Active Mission"
            value={onMissionCount}
            hint="Currently deployed in field"
            icon={Activity}
            tone="default"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab(activeTab === "skilled" ? "all" : "skilled");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "skilled" && "ring-2 ring-amber-500/50 rounded-xl",
          )}
        >
          <StatCard
            label="Specialized Skills"
            value={skilledCount}
            hint="Technical / Logistics certified"
            icon={Wrench}
            tone="warning"
          />
        </div>
        <div
          onClick={() => {
            setActiveTab("all");
            setPage(1);
          }}
          className={cn(
            "cursor-pointer transition-all hover:scale-[1.01]",
            activeTab === "all" && "ring-2 ring-muted-foreground/30 rounded-xl",
          )}
        >
          <StatCard
            label="Total Roster"
            value={totalCount}
            hint="All registered volunteers"
            icon={Users}
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

      {/* Filter Toolbar */}
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search by name, email, phone or skill"
        filters={[
          {
            label: "Availability",
            value: availabilityFilter,
            options: AVAILABILITY_OPTIONS,
            onChange: (v) => {
              setAvailabilityFilter(v);
              setPage(1);
            },
          },
          ...(allSkills.length > 0
            ? [
                {
                  label: "Skill",
                  value: skillFilter,
                  options: allSkills,
                  onChange: (v: string) => {
                    setSkillFilter(v);
                    setPage(1);
                  },
                },
              ]
            : []),
          {
            label: "Experience",
            value: experienceFilter,
            options: EXPERIENCE_OPTIONS,
            onChange: (v) => {
              setExperienceFilter(v);
              setPage(1);
            },
          },
        ]}
      />

      {/* Volunteers Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState message="No volunteers match the current filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Volunteer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Availability & Status</TableHead>
                <TableHead>Skills & Experience</TableHead>
                <TableHead className="text-center">Workload</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v: any) => {
                const name = getVolunteerName(v);
                const email = v.users?.email || "No email";
                const phone = v.users?.phone || "";
                const skills = getVolunteerSkills(v);
                const exp = Number(v.experience_years) || 0;
                const tasks = getVolunteerTasks(v.volunteer_id);
                const isOnMission = tasks.active.length > 0;
                const isAvailable =
                  (v.availability_status === "AVAILABLE" || v.availability_status === "available") &&
                  !isOnMission;

                return (
                  <TableRow
                    key={v.volunteer_id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedVolunteerId(v.volunteer_id)}
                  >
                    {/* Volunteer Column with Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                          {getInitials(name)}
                          {/* Live Status indicator dot */}
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background",
                              isOnMission
                                ? "bg-blue-500 animate-pulse"
                                : isAvailable
                                ? "bg-emerald-500"
                                : "bg-slate-400",
                            )}
                          />
                        </div>
                        <div>
                          <span className="block font-semibold text-foreground text-sm">{name}</span>
                          <span className="block text-[11px] text-muted-foreground font-mono">
                            #VOL-{v.volunteer_id.slice(0, 6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Details */}
                    <TableCell>
                      <span className="block text-xs text-foreground font-medium truncate max-w-[180px]" title={email}>
                        {email}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {phone || "No phone"}
                        </span>
                        {phone && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                              title="Copy Phone"
                              onClick={() => handleCopy(phone, "Phone")}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <a
                              href={`tel:${phone}`}
                              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-0.5 rounded transition-colors"
                              title="Call Volunteer"
                            >
                              <Phone className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Real-time Status Badge */}
                    <TableCell>
                      {isOnMission ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          <Activity className="h-3 w-3 animate-pulse" />
                          On Mission ({tasks.active.length})
                        </span>
                      ) : isAvailable ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                          <Clock className="h-3 w-3" />
                          Unavailable
                        </span>
                      )}
                    </TableCell>

                    {/* Skills & Experience */}
                    <TableCell className="max-w-[220px]">
                      {skills.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {skills.slice(0, 2).map((s, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {skills.length > 2 && (
                            <span className="rounded bg-muted/60 px-1 py-0.5 text-[10px] text-muted-foreground">
                              +{skills.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/70 italic">General relief</span>
                      )}
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        Exp: {exp > 0 ? `${exp} yrs` : "Entry level"}
                      </span>
                    </TableCell>

                    {/* Workload */}
                    <TableCell className="text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-foreground">
                          {tasks.active.length}{" "}
                          <span className="text-[10px] font-normal text-muted-foreground">active</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {tasks.completed.length} done
                        </span>
                      </div>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {new Date(v.created_at).toLocaleDateString()}
                    </TableCell>

                    {/* Action Column */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setSelectedVolunteerId(v.volunteer_id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Profile
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
            Showing {(current - 1) * PAGE_SIZE + 1}—{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
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

      {/* 👤 HIGH-CLARITY VOLUNTEER PROFILE MODAL */}
      <Dialog open={!!selectedVolunteer} onOpenChange={(open) => !open && setSelectedVolunteerId(null)}>
        <DialogContent className="max-w-4xl lg:max-w-5xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
          {selectedVolunteer && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Modal Top Header */}
              <div className="border-b border-border bg-muted/30 px-6 py-5 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base ring-2 ring-primary/20">
                      {getInitials(getVolunteerName(selectedVolunteer))}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">
                          {getVolunteerName(selectedVolunteer)}
                        </h2>
                        <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          #VOL-{selectedVolunteer.volunteer_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Registered Volunteer since {new Date(selectedVolunteer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Real-time Status Badge */}
                  {selectedVolunteerTasks.active.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      On Mission ({selectedVolunteerTasks.active.length} Active)
                    </span>
                  ) : (selectedVolunteer.availability_status === "AVAILABLE" ||
                      selectedVolunteer.availability_status === "available") ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Available for Dispatch
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-muted-foreground border border-border">
                      <Clock className="h-3.5 w-3.5" />
                      Currently Unavailable
                    </span>
                  )}
                </div>

                {/* 4 Quick Stat Metric Badges Bar */}
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Availability
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {selectedVolunteerTasks.active.length > 0
                        ? "Deployed in Field"
                        : selectedVolunteer.availability_status === "AVAILABLE"
                        ? "Ready for Tasks"
                        : "Off Duty"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Active Missions
                    </span>
                    <p className="text-base font-extrabold text-foreground mt-0.5">
                      {selectedVolunteerTasks.active.length} <span className="text-xs font-normal text-muted-foreground">tasks</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Completed Missions
                    </span>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedVolunteerTasks.completed.length} <span className="text-xs font-normal text-muted-foreground">tasks</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/80 bg-background/80 p-2.5 shadow-2xs">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Experience
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                      {selectedVolunteer.experience_years ? `${selectedVolunteer.experience_years} Years in Field` : "Entry Level"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Body: 2 Columns */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Assigned Missions & History (7 cols on lg) */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Active Missions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Truck className="h-4 w-4 text-primary" />
                          Active Field Missions ({selectedVolunteerTasks.active.length})
                        </h3>
                        <Link to="/coordinator/tasks">
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
                            Browse All Tasks <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>

                      {selectedVolunteerTasks.active.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                          <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500/70" />
                          <p className="mt-1 text-xs font-semibold text-foreground">No active missions right now</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            This volunteer is ready for humanitarian relief dispatch.
                          </p>
                          <Link to="/coordinator/tasks" className="mt-3 inline-block">
                            <Button size="sm" variant="outline" className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30">
                              <PlusCircle className="h-3 w-3" /> Assign to a Task
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {selectedVolunteerTasks.active.map((t: any) => (
                            <div
                              key={t.task_id || t.id}
                              className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-xs font-bold text-foreground">{t.title}</h4>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {t.description || "Relief distribution / pickup task."}
                                  </p>
                                </div>
                                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                                  {t.status || "IN_PROGRESS"}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                                {t.location && (
                                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                                    <MapPin className="h-3 w-3 text-red-500" />
                                    {t.location}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-blue-500" />
                                  {new Date(t.created_at).toLocaleDateString()}
                                </span>
                                <Link
                                  to="/coordinator/tasks"
                                  className="ml-auto font-semibold text-primary hover:underline text-[11px] inline-flex items-center gap-0.5"
                                >
                                  View Task <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completed Missions History */}
                    {selectedVolunteerTasks.completed.length > 0 && (
                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Completed Mission History ({selectedVolunteerTasks.completed.length})
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedVolunteerTasks.completed.map((t: any) => (
                            <div
                              key={t.task_id || t.id}
                              className="rounded-lg border border-border bg-card p-2.5 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-foreground block truncate">{t.title}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  Finished: {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                ✓ Completed
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Profile & Contacts (5 cols on lg) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Contact & Instant Call Card */}
                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3.5">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <User className="h-4 w-4 text-primary" />
                        Volunteer Contact & Direct Action
                      </h3>

                      <div>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Email Address
                        </span>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {selectedVolunteer.users?.email || "No email registered"}
                          </span>
                          {selectedVolunteer.users?.email && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopy(selectedVolunteer.users.email, "Email")}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Phone Contact
                        </span>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {selectedVolunteer.users?.phone || "No phone number registered"}
                          </span>
                          {selectedVolunteer.users?.phone && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleCopy(selectedVolunteer.users.phone, "Phone")}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                          )}
                        </div>

                        {selectedVolunteer.users?.phone && (
                          <a
                            href={`tel:${selectedVolunteer.users.phone}`}
                            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            Call Volunteer Now ({selectedVolunteer.users.phone})
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Verified Skills & Qualifications Card */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        Skills & Field Qualifications
                      </h4>

                      {getVolunteerSkills(selectedVolunteer).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {getVolunteerSkills(selectedVolunteer).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No specialized skills listed. Assigned to general relief tasks.
                        </p>
                      )}

                      <div className="pt-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                        <span>Humanitarian Experience:</span>
                        <strong className="text-foreground">
                          {selectedVolunteer.experience_years ? `${selectedVolunteer.experience_years} Years` : "Entry Level"}
                        </strong>
                      </div>
                    </div>

                    {/* Coordinator Quick Action */}
                    <div className="rounded-xl border border-border bg-muted/10 p-3.5 space-y-2">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Deployment Operations
                      </span>
                      <Link to="/coordinator/tasks" className="block">
                        <Button className="w-full text-xs font-bold gap-1.5">
                          <PlusCircle className="h-3.5 w-3.5" /> Dispatch / Assign to New Task
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-border bg-muted/20 px-6 py-3 flex items-center justify-between shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setSelectedVolunteerId(null)}>
                  Close
                </Button>
                <span className="text-xs text-muted-foreground">
                  Volunteer Database ID: <code className="font-mono">{selectedVolunteer.volunteer_id}</code>
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
