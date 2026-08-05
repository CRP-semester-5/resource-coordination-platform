/**
 * Real Organization + Request API calls.
 */
import { http } from "./http";

/* ---------------------------------------------------------------- Orgs */

export const orgsAPI = {
  /** GET /api/v1/organizations/me — orgs I belong to */
  getMyOrgs: () => http.get("/api/v1/organizations/me"),

  /** GET /api/v1/organizations — all orgs (super admin) */
  getAll: () => http.get("/api/v1/organizations"),

  /** GET /api/v1/organizations/pending — pending applications (super admin) */
  getPending: () => http.get("/api/v1/organizations/pending"),

  /** GET /api/v1/organizations/:id */
  getById: (id: string) => http.get(`/api/v1/organizations/${id}`),

  /** PATCH /api/v1/organizations/:id/approve */
  approve: (id: string) => http.patch(`/api/v1/organizations/${id}/approve`),

  /** PATCH /api/v1/organizations/:id/reject */
  reject: (id: string, reason?: string) =>
    http.patch(`/api/v1/organizations/${id}/reject`, { reason }),

  /** POST /api/v1/organizations/:id/invite */
  invite: (orgId: string, email: string, role = "COORDINATOR") =>
    http.post(`/api/v1/organizations/${orgId}/invite`, { email, role }),

  /** GET /api/v1/organizations/:id/members */
  getMembers: (orgId: string) =>
    http.get(`/api/v1/organizations/${orgId}/members`),
};

/* --------------------------------------------------------------- Requests */

export const requestsAPI = {
  /** GET /api/v1/requests */
  getAll: (params?: Record<string, string | number>) =>
    http.get("/api/v1/requests", { params }),

  /** GET /api/v1/requests/:id */
  getById: (id: string) => http.get(`/api/v1/requests/${id}`),

  /** PATCH /api/v1/requests/:id/approve — sets status to VERIFIED */
  approve: (id: string) => http.patch(`/api/v1/requests/${id}/approve`),

  /** PATCH /api/v1/requests/:id/reject */
  reject: (id: string, rejection_reason: string) =>
    http.patch(`/api/v1/requests/${id}/reject`, { rejection_reason }),

  /** PATCH /api/v1/requests/:id/cancel */
  cancel: (id: string) => http.patch(`/api/v1/requests/${id}/cancel`),
};
