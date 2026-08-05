/**
 * Mock API client.
 *
 * Every function below mirrors one endpoint of the ResQ Hub REST API.
 * Right now each one resolves from the in-memory fixtures in `./fixtures`
 * after a small artificial delay. To go live, replace the bodies with
 * `fetch(`${BASE_URL}/...`)` calls — the signatures stay identical.
 */
import * as fx from "./fixtures";
import type {
  AppNotification,
  AuditEntry,
  DashboardSummary,
  Donation,
  HelpRequest,
  InventoryItem,
  Organization,
  PlatformUser,
  RequestStatus,
  ResourceCategory,
  Role,
  Task,
  TaskStatus,
  UUID,
  Volunteer,
  AccountStatus,
} from "./types";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

const db = {
  organizations: clone(fx.organizations),
  categories: clone(fx.resourceCategories),
  requests: clone(fx.requests),
  donations: clone(fx.donations),
  inventory: clone(fx.inventory),
  volunteers: clone(fx.volunteers),
  tasks: clone(fx.tasks),
  users: clone(fx.users),
  audit: clone(fx.auditLog),
  notifications: clone(fx.notifications),
};

const latency = () => new Promise((r) => setTimeout(r, 180 + Math.random() * 160));

async function ok<T>(value: T): Promise<T> {
  await latency();
  return clone(value);
}

const nowIso = () => new Date().toISOString();

function pushAudit(actor: string, action: string, service: string, target: string) {
  db.audit.unshift({ id: `aud-${Date.now()}`, actor, action, service, target, at: nowIso() });
}

function pushNotification(n: Omit<AppNotification, "id" | "at" | "read">) {
  db.notifications.unshift({ ...n, id: `nt-${Date.now()}`, at: nowIso(), read: false });
}

/* ---------------------------------------------------------- Auth / profile */

export interface Session {
  id: UUID;
  name: string;
  email: string;
  role: Role;
  organizationIds: UUID[];
}

export const getProfile = () =>
  ok<Session>({
    id: "usr-1",
    name: "Dilhara Weerasinghe",
    email: "dilhara@kvrelief.lk",
    role: "Organization Coordinator",
    organizationIds: fx.coordinatorOrgIds,
  });

/* ------------------------------------------------------------ Organizations */

export const getOrganizations = (params?: { ids?: UUID[] }) =>
  ok(params?.ids ? db.organizations.filter((o) => params.ids!.includes(o.id)) : db.organizations);

export const getOrganization = (id: UUID) => ok(db.organizations.find((o) => o.id === id) ?? null);

export async function verifyOrganization(id: UUID, decision: "Approved" | "Rejected") {
  const org = db.organizations.find((o) => o.id === id);
  if (org) {
    org.verification = decision;
    pushAudit("Kavindu Rathnasiri", `${decision} organization ${org.name}`, "Organization", "Organization Service");
    pushNotification({
      title: `Organization ${decision.toLowerCase()}`,
      description: `${org.name} was ${decision.toLowerCase()} by an administrator.`,
      type: "Organization",
    });
  }
  return ok(org as Organization);
}

/* ------------------------------------------------------- Resource categories */

export const getResourceCategories = () => ok(db.categories);

export async function createResourceCategory(input: Omit<ResourceCategory, "id">) {
  const cat: ResourceCategory = { ...input, id: `cat-${Date.now()}` };
  db.categories.push(cat);
  return ok(cat);
}

export async function updateResourceCategory(id: UUID, input: Partial<ResourceCategory>) {
  const cat = db.categories.find((c) => c.id === id);
  if (cat) Object.assign(cat, input);
  return ok(cat as ResourceCategory);
}

export async function deleteResourceCategory(id: UUID) {
  db.categories = db.categories.filter((c) => c.id !== id);
  return ok({ id });
}

/* ------------------------------------------------------------------ Requests */

export const getRequests = (orgId: UUID) => ok(db.requests.filter((r) => r.orgId === orgId));
export const getAllRequests = () => ok(db.requests);

export async function verifyRequest(id: UUID, decision: "Approved" | "Rejected", reason?: string) {
  const req = db.requests.find((r) => r.id === id);
  if (req) {
    req.status = decision;
    if (decision === "Rejected") req.rejectionReason = reason;
    req.timeline.push({ status: decision, at: nowIso(), note: reason ?? "Reviewed by coordinator" });
    pushAudit("Dilhara Weerasinghe", `${decision} request ${req.code}`, "Request", "Request Service");
    pushNotification({
      title: `Request ${decision.toLowerCase()}`,
      description: `${req.code} from ${req.requester} was ${decision.toLowerCase()}.`,
      type: "Request",
    });
  }
  return ok(req as HelpRequest);
}

export async function setRequestStatus(id: UUID, status: RequestStatus, note?: string) {
  const req = db.requests.find((r) => r.id === id);
  if (req) {
    req.status = status;
    req.timeline.push({ status, at: nowIso(), note });
  }
  return ok(req as HelpRequest);
}

export const fulfillRequest = (id: UUID) => setRequestStatus(id, "Fulfilled", "All resources delivered");
export const cancelRequest = (id: UUID) => setRequestStatus(id, "Cancelled", "Cancelled by coordinator");

/* ----------------------------------------------------------------- Donations */

export const getDonations = (orgId: UUID) => ok(db.donations.filter((d) => d.orgId === orgId));

export async function verifyDonation(id: UUID, decision: "Accepted" | "Rejected", reason?: string) {
  const don = db.donations.find((d) => d.id === id);
  if (don) {
    don.status = decision;
    if (decision === "Rejected") don.rejectionReason = reason;
    if (decision === "Accepted") {
      const item = db.inventory.find((i) => i.orgId === don.orgId && i.resource === don.resource);
      if (item) item.available += don.quantity;
      else
        db.inventory.push({
          id: `inv-${Date.now()}`,
          orgId: don.orgId,
          category: don.category,
          resource: don.resource,
          unit: don.unit,
          available: don.quantity,
          reserved: 0,
          allocated: 0,
          minThreshold: Math.round(don.quantity * 0.2),
          warehouse: "Unassigned",
          expiryDate: don.expiryDate,
        });
    }
    pushAudit("Dilhara Weerasinghe", `${decision} donation ${don.code}`, "Resource", "Resource Service");
    pushNotification({
      title: `Donation ${decision.toLowerCase()}`,
      description: `${don.code} from ${don.donorName} was ${decision.toLowerCase()}.`,
      type: "Donation",
    });
  }
  return ok(don as Donation);
}

export async function cancelDonation(id: UUID) {
  const don = db.donations.find((d) => d.id === id);
  if (don) don.status = "Cancelled";
  return ok(don as Donation);
}

/* ----------------------------------------------------------------- Inventory */

export const getInventory = (orgId: UUID) => ok(db.inventory.filter((i) => i.orgId === orgId));

export async function restockInventory(id: UUID, quantity: number) {
  const item = db.inventory.find((i) => i.id === id);
  if (item) {
    item.available += quantity;
    pushAudit("Dilhara Weerasinghe", `Restocked ${item.resource} by ${quantity}`, "Resource", "Resource Service");
  }
  return ok(item as InventoryItem);
}

export async function allocateInventory(id: UUID, quantity: number, requestCode: string) {
  const item = db.inventory.find((i) => i.id === id);
  if (item) {
    const qty = Math.min(quantity, item.available);
    item.available -= qty;
    item.allocated += qty;
    pushAudit(
      "Dilhara Weerasinghe",
      `Allocated ${qty} ${item.unit} of ${item.resource} to ${requestCode}`,
      "Resource",
      "Resource Service",
    );
    pushNotification({
      title: "Resources allocated",
      description: `${qty} ${item.unit} of ${item.resource} allocated to ${requestCode}.`,
      type: "Inventory",
    });
  }
  return ok(item as InventoryItem);
}

/* ---------------------------------------------------------------- Volunteers */

export const getVolunteers = (orgId: UUID) => ok(db.volunteers.filter((v) => v.orgId === orgId));

export async function approveVolunteer(id: UUID, decision: "Approved" | "Rejected") {
  const vol = db.volunteers.find((v) => v.id === id);
  if (vol) {
    vol.verification = decision;
    pushAudit("Dilhara Weerasinghe", `${decision} volunteer ${vol.name}`, "Volunteer", "Volunteer Service");
    pushNotification({
      title: `Volunteer ${decision.toLowerCase()}`,
      description: `${vol.name}'s registration was ${decision.toLowerCase()}.`,
      type: "Volunteer",
    });
  }
  return ok(vol as Volunteer);
}

export async function setVolunteerAvailability(id: UUID, availability: Volunteer["availability"]) {
  const vol = db.volunteers.find((v) => v.id === id);
  if (vol) vol.availability = availability;
  return ok(vol as Volunteer);
}

/* --------------------------------------------------------------------- Tasks */

export const getTasks = (orgId: UUID) => ok(db.tasks.filter((t) => t.orgId === orgId));

export async function createTask(input: Omit<Task, "id" | "createdAt" | "status" | "progress" | "assignees">) {
  const task: Task = {
    ...input,
    id: `task-${Date.now()}`,
    assignees: [],
    status: "Assigned",
    progress: 0,
    createdAt: nowIso(),
  };
  db.tasks.unshift(task);
  pushAudit("Dilhara Weerasinghe", `Created task ${task.title}`, "Task", "Task Service");
  return ok(task);
}

export async function assignTask(id: UUID, volunteerIds: UUID[]) {
  const task = db.tasks.find((t) => t.id === id);
  if (task) {
    task.assignees = volunteerIds;
    task.status = task.status === "Completed" ? task.status : "Assigned";
    pushNotification({
      title: "Volunteers assigned",
      description: `${volunteerIds.length} volunteer(s) assigned to ${task.title}.`,
      type: "Task",
    });
  }
  return ok(task as Task);
}

export async function updateTaskStatus(id: UUID, status: TaskStatus) {
  const task = db.tasks.find((t) => t.id === id);
  if (task) {
    task.status = status;
    task.progress = status === "Completed" ? 100 : status === "In Progress" ? Math.max(task.progress, 25) : task.progress;
    pushAudit("Dilhara Weerasinghe", `Task ${task.title} set to ${status}`, "Task", "Task Service");
  }
  return ok(task as Task);
}

/* --------------------------------------------------------------------- Users */

export const getUsers = () => ok(db.users);

export async function updateUserRole(id: UUID, role: Role) {
  const user = db.users.find((u) => u.id === id);
  if (user) {
    user.role = role;
    pushAudit("Kavindu Rathnasiri", `Changed role of ${user.name} to ${role}`, "User", "User Service");
  }
  return ok(user as PlatformUser);
}

export async function updateUserStatus(id: UUID, status: AccountStatus) {
  const user = db.users.find((u) => u.id === id);
  if (user) {
    user.status = status;
    pushAudit("Kavindu Rathnasiri", `Set ${user.name} account to ${status}`, "User", "User Service");
  }
  return ok(user as PlatformUser);
}

/* ------------------------------------------------------ Notifications / audit */

export const getNotifications = () => ok(db.notifications);
export const getAuditLog = () => ok<AuditEntry[]>(db.audit);

export async function markNotificationRead(id: UUID) {
  const n = db.notifications.find((x) => x.id === id);
  if (n) n.read = true;
  return ok(n as AppNotification);
}

export async function markAllNotificationsRead() {
  db.notifications.forEach((n) => (n.read = true));
  return ok(db.notifications);
}

/* ----------------------------------------------------------------- Dashboard */

export async function getDashboard(orgId: UUID): Promise<DashboardSummary> {
  const reqs = db.requests.filter((r) => r.orgId === orgId);
  const dons = db.donations.filter((d) => d.orgId === orgId);
  const inv = db.inventory.filter((i) => i.orgId === orgId);
  const vols = db.volunteers.filter((v) => v.orgId === orgId);
  const tsk = db.tasks.filter((t) => t.orgId === orgId);
  const statuses: RequestStatus[] = [
    "Pending",
    "Under Review",
    "Approved",
    "Partially Fulfilled",
    "Fulfilled",
    "Rejected",
    "Cancelled",
  ];

  return ok<DashboardSummary>({
    openRequests: reqs.filter((r) => !["Fulfilled", "Rejected", "Cancelled"].includes(r.status)).length,
    criticalRequests: reqs.filter((r) => r.priority === "Critical" && r.status !== "Fulfilled").length,
    pendingDonations: dons.filter((d) => d.status === "Pending").length,
    lowStock: inv.filter((i) => i.available < i.minThreshold).length,
    activeVolunteers: vols.filter((v) => v.verification === "Approved" && v.availability !== "Unavailable").length,
    overdueTasks: tsk.filter((t) => t.status !== "Completed" && new Date(t.deadline).getTime() < Date.now()).length,
    requestsByStatus: statuses.map((status) => ({ status, count: reqs.filter((r) => r.status === status).length })),
    activity: db.audit.slice(0, 6).map((a) => ({ id: a.id, text: `${a.actor} — ${a.action}`, at: a.at })),
  });
}

export async function getAdminOverview() {
  return ok({
    organizations: db.organizations.length,
    pendingOrganizations: db.organizations.filter((o) => o.verification === "Pending").length,
    users: db.users.length,
    volunteers: db.volunteers.length,
    requests: db.requests.length,
    donations: db.donations.length,
    categories: db.categories.length,
    byDistrict: Object.entries(
      db.organizations.reduce<Record<string, number>>((acc, o) => {
        acc[o.district] = (acc[o.district] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([district, count]) => ({ district, count })),
  });
}
