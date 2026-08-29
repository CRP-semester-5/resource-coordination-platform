/**
 * Authentication API — login, logout, org onboarding, member invite.
 */
import { http, setToken } from "./http";

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
  rep_phone?: string | undefined;
  // Organization details
  org_name: string;
  org_category: string;
  org_district: string;
  org_description: string;
  org_registration_number?: string | undefined;
  org_contact_email?: string | undefined;
  org_contact_phone?: string | undefined;
}

export interface RegisterUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface OrgApplicationPayload {
  org_name: string;
  org_category?: string;
  org_district?: string;
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

  /**
   * POST /api/v1/auth/register
   * Registers a new user account. Returns 201 on success, throws 409 if
   * the email is already registered. The new account starts as PENDING
   * until the user clicks the verification link sent to their email.
   */
  registerUser: (payload: RegisterUserPayload) =>
    http.post("/api/v1/auth/register", payload),

  /**
   * Login and persist the JWT in localStorage so that subsequent http calls
   * are authenticated. Used in the org-apply returning-user flow.
   * Will throw if the account is PENDING (email not yet verified).
   */
  loginAndStoreToken: async (email: string, password: string): Promise<void> => {
    const res = await http.post<LoginResponse>("/api/v1/auth/login", { email, password });
    setToken(res.data.token);
  },

  /**
   * POST /api/v1/organizations
   * Submits a new organization application. Requires a valid JWT to already
   * be stored in localStorage (call loginAndStoreToken first).
   */
  submitOrgApplication: (payload: OrgApplicationPayload) =>
    http.post("/api/v1/organizations", {
      organization_name: payload.org_name,
      description:       payload.org_description,
      email:             payload.org_contact_email,
      phone:             payload.org_contact_phone,
      address:           payload.org_district,
    }),

  /** @deprecated Use registerUser + loginAndStoreToken + submitOrgApplication instead.
   *  POST /api/v1/organizations/apply
   *  Creates a pending org application with the rep's details.
   *  Super Admin must approve → creates org + makes rep ORGANIZATION_ADMIN.
   */
  applyOrganization: async (payload: RegisterOrgPayload) => {
    const parts = payload.rep_name.trim().split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ") || "User";

    try {
      await http.post("/api/v1/auth/register", {
        first_name: firstName,
        last_name: lastName,
        email: payload.rep_email,
        password: payload.rep_password,
      });
    } catch (error: any) {
      // 409 means Email already registered. We can safely ignore this and try to log in
      // with the provided credentials.
      if (error.response?.status !== 409) {
        throw error;
      }
    }

    const loginRes = await http.post<LoginResponse>("/api/v1/auth/login", {
      email: payload.rep_email,
      password: payload.rep_password,
    });

    localStorage.setItem("crp_token", loginRes.data.token);

    return http.post("/api/v1/organizations", {
      organization_name: payload.org_name,
      description: payload.org_description,
      email: payload.org_contact_email,
      phone: payload.org_contact_phone,
      address: payload.org_district,
    });
  },

  /** POST /api/v1/organizations/:id/invite
   *  Invites a user by email to join the org as COORDINATOR.
   */
  inviteMember: (orgId: string, payload: InvitePayload) =>
    http.post(`/api/v1/organizations/${orgId}/invite`, payload),
};
