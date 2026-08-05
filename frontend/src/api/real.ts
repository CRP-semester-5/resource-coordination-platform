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
    http.post(`/api/v1/organizations/${orgId}/invite`, { email, role }),
  getMembers: (orgId: string) =>
    http.get(`/api/v1/organizations/${orgId}/members`),
};

/* --------------------------------------------------------------- Requests */

export const requestsAPI = {
  getAll: (params?: Record<string, string | number>) =>
    http.get("/api/v1/requests", { params }),
  getById: (id: string) => http.get(`/api/v1/requests/${id}`),
  approve: (id: string) => http.patch(`/api/v1/requests/${id}/approve`),
  reject: (id: string, rejection_reason: string) =>
    http.patch(`/api/v1/requests/${id}/reject`, { rejection_reason }),
  cancel: (id: string) => http.patch(`/api/v1/requests/${id}/cancel`),
};

/* --------------------------------------------------------------- Logistics */

export const donationsAPI = {
  getAll: () => http.get("/api/v1/donations"),
  approve: (id: string) => http.patch(`/api/v1/donations/${id}/approve`),
  reject: (id: string) => http.patch(`/api/v1/donations/${id}/reject`),
};

export const inventoryAPI = {
  getAll: () => http.get("/api/v1/inventory"),
};

export const volunteersAPI = {
  getAll: () => http.get("/api/v1/volunteers"),
};

export const tasksAPI = {
  getAll: () => http.get("/api/v1/tasks"),
};
