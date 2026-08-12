import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, UserPlus, Check, X } from "lucide-react";
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
      { title: "Team — ResQ Hub Coordinator" },
      { name: "description", content: "Invite coordinators and manage your organization team." },
    ],
  }),
  component: TeamPage,
});

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  status: string;
}

const ROLE_LABELS: Record<string, string> = {
  COORDINATOR: "Coordinator",
  ORGANIZATION_ADMIN: "Organization Admin",
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  COORDINATOR: { bg: "#DBEAFE", color: "#1E40AF" },
  ORGANIZATION_ADMIN: { bg: "#EDE9FE", color: "#5B21B6" },
};

function TeamPage() {
  const { isOrgAdmin } = useAuth();
  const { orgId, organization } = useOrganization();
  const qc = useQueryClient();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"COORDINATOR" | "ORGANIZATION_ADMIN">("COORDINATOR");
  const [inviteError, setInviteError] = useState("");

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["team", orgId],
    queryFn: async () => {
      const res = await orgsAPI.getMembers(orgId);
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!orgId,
  });

  const invite = useMutation({
    mutationFn: ({ email, role }: { email: string; role: string }) =>
      orgsAPI.invite(orgId, email, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team", orgId] });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail("");
      setInviteError("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to send invitation.";
      setInviteError(msg);
    },
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    if (!inviteEmail) return;
    invite.mutate({ email: inviteEmail, role: inviteRole });
  }

  return (
    <>
      <PageHeader
        title="Team"
        description={`Manage members of ${organization?.name ?? "your organization"}.`}
      />

      {isOrgAdmin && (
        <div className="mb-6">
          <Button
            id="invite-member-btn"
            onClick={() => { setShowInvite(true); setInviteError(""); }}
            className="gap-2"
          >
            <UserPlus className="size-4" />
            Invite member
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No team members found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const rc = ROLE_COLORS[m.role] ?? { bg: "#F1F5F9", color: "#475569" };
                return (
                  <tr key={m.user_id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(m.name ?? m.email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{m.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: rc.bg, color: rc.color }}
                      >
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {m.status === "active" || m.status === "ACTIVE" ? (
                        <span className="flex items-center gap-1 text-xs text-status-success-foreground">
                          <Check className="size-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <X className="size-3" /> {m.status ?? "Pending"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={(o) => !o && setShowInvite(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              They will receive an invitation email. Once they register, they'll be added to{" "}
              <strong>{organization?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                Email address
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-input px-3 py-2.5 focus-within:ring-1 focus-within:ring-ring">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coordinator@organization.lk"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "COORDINATOR" | "ORGANIZATION_ADMIN")}
                className="w-full rounded-lg border border-input px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="COORDINATOR">Coordinator</option>
                {isOrgAdmin && <option value="ORGANIZATION_ADMIN">Organization Admin</option>}
              </select>
            </div>
            {inviteError && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                {inviteError}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button id="invite-submit" type="submit" disabled={invite.isPending}>
                {invite.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
