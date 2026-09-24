/**
 * Real Organization + Request API calls.
 */
import { http } from "./http";

/* ---------------------------------------------------------------- Orgs */

export const orgsAPI = {
  getMyOrgs: () => http.get("/api/v1/organizations/me"),
  getAll: () => http.get("/api/v1/organizations"),
  getPending: () => http.get("/api/v1/organizations/pending"),
  getById: (id: string) => http.get(`/api/v1/organizations/${id}`),
  approve: (id: string) => http.patch(`/api/v1/organizations/${id}/approve`),
  reject: (id: string, reason?: string) =>
    http.patch(`/api/v1/organizations/${id}/reject`, { reason }),
  invite: (orgId: string, email: string, role = "COORDINATOR") =>
    http.post(`/api/v1/organizations/${orgId}/members`, { email, role }),
  getMembers: (orgId: string) =>
    http.get(`/api/v1/organizations/${orgId}/members`),
  delete: (id: string) => http.delete(`/api/v1/organizations/${id}`), 
};

/* --------------------------------------------------------------- Requests */

export const requestsAPI = {
  getAll: (orgId?: string) =>
    http.get("/api/v1/requests", orgId ? { headers: { "x-organization-id": orgId } } : {}),
  getById: (id: string) => http.get(`/api/v1/requests/${id}`),
  approve: (id: string, orgId?: string) => http.patch(`/api/v1/requests/${id}/approve`, {}, orgId ? { headers: { "x-organization-id": orgId } } : {}),
  unapprove: (id: string, orgId?: string) => http.patch(`/api/v1/requests/${id}/unapprove`, {}, orgId ? { headers: { "x-organization-id": orgId } } : {}),
  reject: (id: string, rejection_reason: string, orgId?: string) => http.patch(`/api/v1/requests/${id}/reject`, { rejection_reason }, orgId ? { headers: { "x-organization-id": orgId } } : {}),
  cancel: (id: string) => http.patch(`/api/v1/requests/${id}/cancel`),
  fulfill: (id: string) => http.patch(`/api/v1/requests/${id}/fulfill`),
  markInProgress: (id: string) => http.patch(`/api/v1/requests/${id}/progress`),
};

/* --------------------------------------------------------------- Logistics */

export const donationsAPI = {
  getAll: (orgId: string) => http.get("/api/v1/donations", { headers: { "x-organization-id": orgId } }),
  approve: (id: string) => http.patch(`/api/v1/donations/${id}/approve`),
  reject: (id: string, reason?: string) => http.patch(`/api/v1/donations/${id}/reject`, { rejection_reason: reason }),
};

export const categoriesAPI = {
  getAll: () => http.get("/api/v1/categories"),
  create: (data: any) => http.post("/api/v1/categories", data),
};

export const inventoryAPI = {
  getAll: (orgId?: string) => http.get("/api/v1/inventory", orgId ? { headers: { "x-organization-id": orgId } } : {}),
  getTransactions: (orgId?: string) => http.get("/api/v1/inventory/transactions", orgId ? { headers: { "x-organization-id": orgId } } : {}),
  checkStock: (category: string, quantity: number, orgId?: string) => http.post("/api/v1/inventory/check-stock", { category, quantity }, orgId ? { headers: { "x-organization-id": orgId } } : {}),
  add: (category_id: string, quantity: number, orgId?: string) => http.post("/api/v1/inventory", { category_id, quantity }, orgId ? { headers: { "x-organization-id": orgId } } : {}),
  restock: (id: string, quantity: number) => http.post(`/api/v1/inventory/${id}/restock`, { quantity }),
  allocate: (id: string, quantity: number, code: string) => http.post(`/api/v1/inventory/${id}/allocate`, { quantity, request_code: code }),
  deduct: (data: { category_id?: string; category_name?: string; quantity: number; request_id?: string; request_code?: string; item_name?: string; requester_name?: string }, orgId?: string) =>
    http.post("/api/v1/inventory/deduct", data, orgId ? { headers: { "x-organization-id": orgId } } : {}),
};

export const volunteersAPI = {
  getAll: () => http.get("/api/v1/volunteers"),
  getById: (id: string) => http.get(`/api/v1/volunteers/${id}`),
};

export const tasksAPI = {
  getAll: () => http.get("/api/v1/tasks"),
  getById: (id: string) => http.get(`/api/v1/tasks/${id}`),
  create: (data: any) => http.post("/api/v1/tasks", data),
  update: (id: string, data: any) => http.patch(`/api/v1/tasks/${id}`, data),
  assign: (id: string, volunteer_id: string) => http.post(`/api/v1/tasks/${id}/assign`, { volunteer_id }),
  verifyWarehousePickup: (id: string, pin: string) => http.post(`/api/v1/tasks/${id}/verify-warehouse-pickup`, { pin }),
  verifyHandover: (id: string, pin: string) => http.post(`/api/v1/tasks/${id}/verify-handover`, { pin }),
  regeneratePin: (id: string) => http.post(`/api/v1/tasks/${id}/regenerate-pin`),
};

export const notificationsAPI = {
  getAll: () => http.get("/api/v1/notifications"),
  markRead: (id: string) => http.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: () => http.post("/api/v1/notifications/mark-all-read"),
};
