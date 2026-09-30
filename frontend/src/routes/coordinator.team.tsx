import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mail,
  UserPlus,
  Check,
  Shield,
  UserCheck,
  Search,
  Users,
  Copy,
  Calendar,
  Sparkles,
  Building2,
  Clock,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { useOrganization } from "@/context/organization";
import { orgsAPI } from "@/api/real";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/coordinator/team")({
  head: () => ({
    meta: [
      { title: "Team & Staff — ResQ Hub Coordinator" },
      {
        name: "description",
        content: "Manage coordinators and administrators for your organization.",
      },
    ],
  }),
  component: TeamPage,
});

interface Member {
  organization_member_id?: string;
  user_id: string;
  name: string;
  email: string;
  role: "COORDINATOR" | "ORGANIZATION_ADMIN" | string;
  joined_at?: string;
  status: string;
  users?: {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_image?: string;
  };
}

const ROLE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string; icon: typeof Shield }
> = {
  ORGANIZATION_ADMIN: {
    label: "Organization Admin",
    bg: "rgba(124, 58, 237, 0.1)",
    color: "#7C3AED",
    border: "rgba(124, 58, 237, 0.25)",
    icon: Shield,
  },
  COORDINATOR: {
    label: "Coordinator",
    bg: "rgba(37, 99, 235, 0.1)",
    color: "#2563EB",
    border: "rgba(37, 99, 235, 0.25)",
    icon: UserCheck,
  },
};

function TeamPage() {
  const { isOrgAdmin, isCoordinator, user } = useAuth();
  const { orgId, organization } = useOrganization();
  const qc = useQueryClient();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole] = useState<string>("COORDINATOR");
  const [inviteError, setInviteError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "COORDINATOR" | "ORGANIZATION_ADMIN">("ALL");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["team", orgId],
    queryFn: async () => {
      const res = await orgsAPI.getMembers(orgId);
      const rawList = res.data?.data ?? res.data ?? [];
      return rawList.map((m: any) => {
        const u = m.users || {};
        const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
        return {
          organization_member_id: m.organization_member_id,
          user_id: u.user_id || m.user_id,
          name: fullName || m.name || u.email || m.email || "Staff Member",
          email: u.email || m.email || "",
          role: m.role || "COORDINATOR",
          joined_at: m.created_at || m.joined_at,
          status: m.status || "ACTIVE",
          users: u,
        };
      });
    },
    enabled: !!orgId,
  });

  const invite = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      orgsAPI.invite(orgId, email, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", orgId] });
      toast.success(`Invitation successfully sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail("");
      setInviteError("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to send invitation. Please verify the email and try again.";
      setInviteError(msg);
    },
  });

  const resend = useMutation({
    mutationFn: (membershipId: string) => orgsAPI.resendInvite(orgId, membershipId),
    onSuccess: () => {
      toast.success("Invitation email resent successfully.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to resend invitation.";
      toast.error(msg);
    },
  });

  const remove = useMutation({
    mutationFn: (membershipId: string) => orgsAPI.removeMember(orgId, membershipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", orgId] });
      toast.success("Member removed / invitation cancelled.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to remove member.";
      toast.error(msg);
    },
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    if (!inviteEmail.trim()) return;
    invite.mutate({ email: inviteEmail.trim(), role: inviteRole });
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);

      const matchesRole = roleFilter === "ALL" || m.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = members.length;
    const coordinators = members.filter((m) => m.role === "COORDINATOR").length;
    const admins = members.filter((m) => m.role === "ORGANIZATION_ADMIN").length;
    const pending = members.filter((m) => m.status === "PENDING" || m.status === "pending").length;
    const active = members.filter((m) => m.status === "ACTIVE" || m.status === "active").length;
    return { total, coordinators, admins, pending, active };
  }, [members]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Team & Staff"
          description={`Organization staff & coordinator roster for ${organization?.name ?? "your organization"}.`}
        />
        {(isCoordinator || isOrgAdmin) && (
          <Button
            id="invite-member-btn"
            onClick={() => {
              setShowInvite(true);
              setInviteError("");
            }}
            className="gap-2 shadow-sm font-semibold self-start sm:self-auto bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <UserPlus className="size-4" />
            Invite Staff Member
          </Button>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground font-medium">Total Staff</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <UserCheck className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {stats.coordinators}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Coordinators</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3.5">
          {stats.pending > 0 ? (
            <>
              <div className="size-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                  {stats.pending}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Pending Invites</div>
              </div>
            </>
          ) : (
            <>
              <div className="size-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Shield className="size-5" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
                  {stats.admins > 0 ? stats.admins : stats.coordinators}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {stats.admins > 0 ? "Org Admins" : "Roster Coordinators"}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.active}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Active Accounts</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Role Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit overflow-x-auto">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === "ALL"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Staff ({members.length})
          </button>
          <button
            onClick={() => setRoleFilter("COORDINATOR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              roleFilter === "COORDINATOR"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Coordinators ({stats.coordinators})
          </button>
          {stats.admins > 0 && (
            <button
              onClick={() => setRoleFilter("ORGANIZATION_ADMIN")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                roleFilter === "ORGANIZATION_ADMIN"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admins ({stats.admins})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-input bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg w-full" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Users className="size-6" />
            </div>
            <div className="text-sm font-semibold text-foreground">No staff members found</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery || roleFilter !== "ALL"
                ? "Try clearing your search filters to find what you are looking for."
                : "No coordinators or admins are assigned to this organization."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3.5 text-left">Staff Member</th>
                  <th className="px-5 py-3.5 text-left">Role & Permissions</th>
                  <th className="px-5 py-3.5 text-left hidden md:table-cell">Joined Date</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((m) => {
                  const roleConfig = ROLE_CONFIG[m.role] ?? {
                    label: m.role,
                    bg: "rgba(100, 116, 139, 0.1)",
                    color: "#64748B",
                    border: "rgba(100, 116, 139, 0.25)",
                    icon: UserCheck,
                  };
                  const RoleIcon = roleConfig.icon;
                  const isCurrent = user?.id === m.user_id || user?.email === m.email;

                  return (
                    <tr key={m.user_id || m.email} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm shadow-inner">
                            {(m.name || m.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                              {m.name}
                              {isCurrent && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground border border-border">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Mail className="size-3 text-muted-foreground/70" />
                              <span>{m.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold"
                          style={{
                            background: roleConfig.bg,
                            color: roleConfig.color,
                            border: `1px solid ${roleConfig.border}`,
                          }}
                        >
                          <RoleIcon className="size-3.5" />
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-foreground hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/70" />
                          {m.joined_at
                            ? new Date(m.joined_at).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {m.status === "ACTIVE" || m.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            <Clock className="size-3" />
                            Pending Acceptance
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {(m.status === "PENDING" || m.status === "pending") &&
                            m.organization_member_id && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resend.mutate(m.organization_member_id!)}
                                  disabled={resend.isPending}
                                  className="h-8 px-2.5 text-xs text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
                                  title="Resend Invitation Email"
                                >
                                  <RotateCw
                                    className={`size-3.5 ${resend.isPending ? "animate-spin" : ""}`}
                                  />
                                  <span className="hidden sm:inline">Resend Invite</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Cancel invitation for ${m.email}?`)) {
                                      remove.mutate(m.organization_member_id!);
                                    }
                                  }}
                                  disabled={remove.isPending}
                                  className="h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1"
                                  title="Cancel Invitation"
                                >
                                  <Trash2 className="size-3.5" />
                                  <span className="hidden sm:inline">Cancel</span>
                                </Button>
                              </>
                            )}
                          {(m.status === "ACTIVE" || m.status === "active") &&
                            !isCurrent &&
                            m.organization_member_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Remove ${m.name || m.email} from the organization team?`,
                                    )
                                  ) {
                                    remove.mutate(m.organization_member_id!);
                                  }
                                }}
                                disabled={remove.isPending}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 gap-1"
                                title="Remove Member"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(m.email, "email")}
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                            title="Copy Email"
                          >
                            <Copy className="size-3.5" />
                            <span className="hidden sm:inline">Copy Email</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Dialog open={showInvite} onOpenChange={(o) => !o && setShowInvite(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <UserPlus className="size-5" />
            </div>
            <DialogTitle className="text-lg">Invite Staff Member</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new staff member to <strong>{organization?.name ?? "this organization"}</strong>
              . They must have a registered account on the platform.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Email Address
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-2.5 focus-within:ring-1 focus-within:ring-primary shadow-sm">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coordinator@redcross.org"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 text-foreground">
                Staff Role
              </label>
              <select
                value="COORDINATOR"
                disabled
                className="w-full rounded-xl border border-input bg-muted/40 px-3 py-2.5 text-sm outline-none shadow-sm cursor-not-allowed text-foreground font-medium"
              >
                <option value="COORDINATOR">
                  Coordinator (Operations, Tasks, Requests, Donations)
                </option>
              </select>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                All staff members join as Organization Coordinators with operations and relief
                management access.
              </p>
            </div>

            {inviteError && (
              <div className="rounded-xl px-3.5 py-2.5 text-xs font-medium border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                {inviteError}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInvite(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                id="invite-submit"
                type="submit"
                disabled={invite.isPending}
                className="rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm"
              >
                {invite.isPending ? "Sending Invitation…" : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
