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
  approve: (id: string) => http.patch(`/api/v1/requests/${id}/approve`),
  reject: (id: string, rejection_reason: string) =>
    http.patch(`/api/v1/requests/${id}/reject`, { rejection_reason }),
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
  getAll: () => http.get("/api/v1/inventory"),
  add: (category_id: string, quantity: number) => http.post("/api/v1/inventory", { category_id, quantity }),
  restock: (id: string, quantity: number) => http.post(`/api/v1/inventory/${id}/restock`, { quantity }),
  allocate: (id: string, quantity: number, code: string) => http.post(`/api/v1/inventory/${id}/allocate`, { quantity, request_code: code }),
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
};

export const notificationsAPI = {
  getAll: () => http.get("/api/v1/notifications"),
  markRead: (id: string) => http.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: () => http.post("/api/v1/notifications/mark-all-read"),
};
