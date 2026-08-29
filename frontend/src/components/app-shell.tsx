import { useState, type ReactNode } from "react";
import { Link, useRouterState, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, LogOut, Menu, ShieldCheck, LifeBuoy, ChevronsUpDown, X } from "lucide-react";
import { notificationsAPI } from "@/api/real";
import { useOrganization } from "@/context/organization";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

function NotificationsBell() {
  const qc = useQueryClient();
  const { data: itemsRaw = [] } = useQuery({ 
    queryKey: ["notifications"], 
    queryFn: async () => {
      const res = await notificationsAPI.getAll();
      return res.data?.data ?? res.data ?? [];
    },
    refetchInterval: 5000, // Poll every 5s for pseudo-realtime
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: { id: string; title: string; description: string; read: boolean; at: string }[] = itemsRaw.map((n: any) => ({
    id: String(n.notification_id),
    title: String(n.type || "Notification").replace(/_/g, ' '),
    description: String(n.message),
    read: Boolean(n.is_read),
    at: String(n.created_at),
  }));
  
  const unread = items.filter((n) => !n.read).length;

  const readOne = useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readAll = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-status-danger text-[10px] font-semibold text-white">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <button
            onClick={() => readAll.mutate()}
            className="text-xs text-primary hover:underline"
            type="button"
          >
            Mark all read
          </button>
        </div>
        <ScrollArea className="h-80">
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => readOne.mutate(n.id)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                    !n.read && "bg-accent/40",
                  )}
                >
                  <span
                    className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{n.description}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {new Date(n.at).toLocaleString()}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function OrgSwitcher() {
  const { organizations, orgId, organization, setOrgId } = useOrganization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/60"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            {organization?.name.slice(0, 2).toUpperCase() ?? "RQ"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{organization?.name ?? "Select organization"}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {organization ? `${organization.district} district` : "No organization"}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Your organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onSelect={() => setOrgId(org.id)} className="gap-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{org.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{org.district}</span>
            </span>
            {org.id === orgId && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserAvatarBadge({ variant }: { variant: "coordinator" | "admin" }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.navigate({ to: "/login" });
  }

  const roleLabel = isSuperAdmin
    ? "System Administrator"
    : variant === "coordinator"
    ? "Coordinator"
    : "Org Admin";

  return (
    <>
      <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        {user?.avatar ?? (variant === "admin" ? "SA" : "CO")}
      </span>
      <span className="hidden text-xs sm:block">
        <span className="block font-medium leading-tight">{user?.name ?? "User"}</span>
        <span className="block text-muted-foreground leading-tight">{roleLabel}</span>
      </span>
      <button
        type="button"
        onClick={handleLogout}
        title="Sign out"
        className="ml-1 p-1 rounded hover:bg-muted transition-colors"
        aria-label="Sign out"
      >
        <LogOut className="size-3.5 text-muted-foreground" />
      </button>
    </>
  );
}

function SidebarLogoutRow() {
  const { logout, user } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.navigate({ to: "/login" });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        {user?.avatar ?? "??"}
      </span>
      <span className="min-w-0 flex-1 text-xs">
        <span className="block truncate font-medium">{user?.name ?? "User"}</span>
        <span className="block truncate text-muted-foreground">{user?.email ?? ""}</span>
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-sidebar-accent/50 transition-colors"
        title="Sign out"
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

export function AppShell({
  nav,
  title,
  variant,
  children,
}: {
  nav: NavItem[];
  title: string;
  variant: "coordinator" | "admin";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sidebar = (
    <div className="flex h-full flex-col gap-6 border-r border-sidebar-border bg-sidebar px-4 py-5">
      <div className="flex items-center gap-2 px-1">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {variant === "admin" ? <ShieldCheck className="size-4" /> : <LifeBuoy className="size-4" />}
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight">ResQ Hub</p>
          <p className="text-[11px] text-muted-foreground">{title}</p>
        </div>
      </div>

      {variant === "coordinator" && <OrgSwitcher />}

      <nav className="flex-1 space-y-1">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border pt-4">
        <SidebarLogoutRow />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-72 shrink-0 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 z-10 rounded-md p-1 hover:bg-sidebar-accent"
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="truncate text-xs text-muted-foreground">Resource Coordination Platform</p>
          </div>
          <NotificationsBell />
          <div className="flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1">
            <UserAvatarBadge variant={variant} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
