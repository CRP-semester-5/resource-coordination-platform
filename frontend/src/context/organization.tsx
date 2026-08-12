import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { orgsAPI } from "@/api/real";
import { useAuth } from "@/context/auth";
import { setStoredOrgId, getStoredOrgId } from "@/api/http";

interface OrgShape {
  id: string;
  name: string;
  district: string;
  category: string;
  status: string;
}

interface OrgContextValue {
  organizations: OrgShape[];
  orgId: string;
  organization: OrgShape | undefined;
  setOrgId: (id: string) => void;
  loading: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

function normalizeOrg(raw: any): OrgShape {
  const org = raw.organizations || raw;
  return {
    id: org.organization_id ?? org.id ?? raw.organization_id,
    name: org.organization_name ?? org.name ?? org.org_name ?? "Unknown Organization",
    district: org.district ?? "",
    category: org.category ?? "",
    status: org.status ?? "approved",
  };
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const storedId = getStoredOrgId();
  const [orgId, _setOrgId] = useState(storedId ?? "");

  const { data: orgsRaw = [], isLoading } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: async () => {
      const res = await orgsAPI.getMyOrgs();
      return res.data?.data ?? res.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const organizations: OrgShape[] = useMemo(
    () => (orgsRaw as Record<string, string>[]).map(normalizeOrg),
    [orgsRaw],
  );

  // Auto-select first org if none stored
  useEffect(() => {
    if (organizations.length && !organizations.some((o) => o.id === orgId)) {
      const first = organizations[0]!;
      _setOrgId(first.id);
      setStoredOrgId(first.id);
    }
  }, [organizations, orgId]);

  function setOrgId(id: string) {
    _setOrgId(id);
    setStoredOrgId(id);
  }

  const value = useMemo<OrgContextValue>(
    () => ({
      organizations,
      orgId,
      organization: organizations.find((o) => o.id === orgId),
      setOrgId,
      loading: isLoading,
    }),
    [organizations, orgId, isLoading],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrganization() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrganization must be used inside OrganizationProvider");
  return ctx;
}
