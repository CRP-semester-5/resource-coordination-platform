import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authAPI } from "@/api/auth";
import { setToken, clearToken, getToken, setStoredOrgId, getStoredOrgId } from "@/api/http";
import { orgsAPI } from "@/api/real";

/* ------------------------------------------------------------------ types */

export type GlobalRole = "USER" | "VOLUNTEER" | "SUPER_ADMIN";
export type OrgRole = "COORDINATOR" | "ORGANIZATION_ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  globalRoles: GlobalRole[];
  /** Initials for avatar */
  avatar: string;
}

export interface OrgMembership {
  organization_id: string;
  name: string;
  district: string;
  category: string;
  my_role: OrgRole;
  status: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  myOrgs: OrgMembership[];
  selectedOrg: OrgMembership | null;
  setSelectedOrg: (org: OrgMembership) => void;
  loading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
  isCoordinator: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

/* --------------------------------------------------------------- context */

const AuthCtx = createContext<AuthContextValue | null>(null);

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [myOrgs, setMyOrgs] = useState<OrgMembership[]>([]);
  const [selectedOrg, _setSelectedOrg] = useState<OrgMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const setSelectedOrg = useCallback((org: OrgMembership) => {
    _setSelectedOrg(org);
    setStoredOrgId(org.organization_id);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      const raw = res.data?.user ?? res.data;
      const authUser: AuthUser = {
        id: raw.user_id ?? raw.id,
        name: raw.name ?? raw.email,
        email: raw.email,
        globalRoles: raw.globalRoles ?? raw.roles ?? [],
        avatar: initials(raw.name ?? raw.email),
      };
      setUser(authUser);

      // Fetch orgs the user belongs to
      try {
        const orgsRes = await orgsAPI.getMyOrgs();
        const orgs: OrgMembership[] = orgsRes.data?.data ?? orgsRes.data ?? [];
        setMyOrgs(orgs);

        // Auto-select preserved org or first
        const storedId = getStoredOrgId();
        const match = orgs.find((o) => o.organization_id === storedId) ?? orgs[0] ?? null;
        if (match) _setSelectedOrg(match);
      } catch {
        // Super admin may have no orgs — that's fine
        setMyOrgs([]);
      }
    } catch {
      setUser(null);
      setMyOrgs([]);
      clearToken();
    }
  }, []);

  // On mount: if there's a stored token, rehydrate profile
  useEffect(() => {
    if (getToken()) {
      fetchProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const res = await authAPI.login({ email, password });
        setToken(res.data.token);
        await fetchProfile();
        return { success: true };
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Invalid email or password.";
        return { success: false, message: msg };
      } finally {
        setLoading(false);
      }
    },
    [fetchProfile],
  );

  const logout = useCallback(() => {
    authAPI.logout().catch(() => {});
    clearToken();
    setUser(null);
    setMyOrgs([]);
    _setSelectedOrg(null);
  }, []);

  const globalRoles = user?.globalRoles ?? [];
  const isSuperAdmin = globalRoles.includes("SUPER_ADMIN");
  const isOrgAdmin = selectedOrg?.my_role === "ORGANIZATION_ADMIN";
  const isCoordinator =
    selectedOrg?.my_role === "COORDINATOR" || isOrgAdmin;

  return (
    <AuthCtx.Provider
      value={{
        user,
        myOrgs,
        selectedOrg,
        setSelectedOrg,
        loading,
        isAuthenticated: !!user,
        isSuperAdmin,
        isOrgAdmin,
        isCoordinator,
        login,
        logout,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
