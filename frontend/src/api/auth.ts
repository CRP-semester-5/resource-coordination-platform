/**
 * Authentication API — login, logout, org onboarding, member invite.
 */
import { http } from "./http";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  roles: string[];
}

export interface RegisterOrgPayload {
  // Representative (becomes ORGANIZATION_ADMIN on approval)
  rep_name: string;
  rep_email: string;
  rep_password: string;
  rep_phone?: string;
  // Organization details
  org_name: string;
  org_category: string;
  org_district: string;
  org_description: string;
  org_registration_number?: string;
  org_contact_email?: string;
  org_contact_phone?: string;
}

export interface InvitePayload {
  email: string;
  role?: "COORDINATOR" | "ORGANIZATION_ADMIN";
}

export const authAPI = {
  /** POST /api/v1/auth/login */
  login: (payload: LoginPayload) =>
    http.post<LoginResponse>("/api/v1/auth/login", payload),

  /** POST /api/v1/auth/logout */
  logout: () => http.post("/api/v1/auth/logout"),

  /** GET /api/v1/users/me */
  getMe: () => http.get("/api/v1/users/me"),

  /** POST /api/v1/organizations/apply
   *  Creates a pending org application with the rep's details.
   *  Super Admin must approve → creates org + makes rep ORGANIZATION_ADMIN.
   */
  applyOrganization: (payload: RegisterOrgPayload) =>
    http.post("/api/v1/organizations/apply", payload),

  /** POST /api/v1/organizations/:id/invite
   *  Invites a user by email to join the org as COORDINATOR.
   */
  inviteMember: (orgId: string, payload: InvitePayload) =>
    http.post(`/api/v1/organizations/${orgId}/invite`, payload),
};
