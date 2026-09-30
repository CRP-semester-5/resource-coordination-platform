import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  HeartHandshake,
  Layers,
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import { BackgroundShader } from "./background-shader";


export const MOBILE_APP_DOWNLOAD_URL = "https://drive.google.com/YOUR_GOOGLE_DRIVE_LINK_HERE";

export function HomePageView() {
  const { isAuthenticated, isSuperAdmin, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-foreground flex flex-col selection:bg-primary/20 selection:text-primary relative">
      {/* Dynamic Background Shader & Ambient Fluid Mesh */}
      <BackgroundShader />

      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* TOP LEFT: Brand Logo & Title */}
          <Link to="/" className="flex items-center gap-3 sm:gap-3.5 group shrink-0">
            <img
              src="/logo.png"
              alt="ResQ Hub Logo"
              className="size-11 sm:size-12 object-contain rounded-full transition-transform duration-200 group-hover:scale-105 drop-shadow-md shrink-0"
            />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-foreground whitespace-nowrap leading-none">
                  ResQ Hub
                </span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 shrink-0 leading-none">
                  Platform
                </span>
              </div>
              <span className="hidden sm:block text-[11px] font-medium text-muted-foreground mt-1 whitespace-nowrap leading-none">
                Resource Coordination Platform
              </span>
            </div>
          </Link>

          {/* Quick Nav Anchor Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs sm:text-sm font-semibold text-muted-foreground">
            <a href="#roles" className="hover:text-foreground transition-colors whitespace-nowrap">
              Access Portals
            </a>
            <a href="#features" className="hover:text-foreground transition-colors whitespace-nowrap">
              Platform Features
            </a>
            <a href="#mobile" className="hover:text-foreground transition-colors whitespace-nowrap">
              Mobile App
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors whitespace-nowrap">
              How It Works
            </a>
          </nav>

          {/* TOP RIGHT: Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Download App Button (Opens Google Drive link) */}
            <a
              href={MOBILE_APP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              id="top-right-download-app-btn"
              title="Download ResQ Hub Mobile App from Google Drive"
              className="shrink-0"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-bold gap-1.5 border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary shadow-xs shrink-0 whitespace-nowrap"
              >
                <Download className="size-3.5" />
                <span>Download App</span>
              </Button>
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden xl:inline-block text-xs text-muted-foreground whitespace-nowrap">
                  Signed in as <strong className="text-foreground">{user?.email || "User"}</strong>
                </span>
                <Link to={isSuperAdmin ? "/admin" : "/coordinator"}>
                  <Button size="sm" className="h-9 font-bold text-xs gap-1.5 shadow-sm whitespace-nowrap shrink-0">
                    Open {isSuperAdmin ? "Admin Console" : "Workspace"} <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logout()}
                  className="h-9 text-xs font-semibold shrink-0"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/login" search={{ role: "coordinator" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold border-border hover:bg-muted/50 hidden sm:inline-flex whitespace-nowrap shrink-0"
                  >
                    Coordinator Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="h-9 text-xs font-bold gap-1.5 shadow-sm whitespace-nowrap shrink-0">
                    <Building2 className="size-3.5" /> Create Organization
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border/60 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-6 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Humanitarian & Disaster Relief Coordination Ecosystem
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.12]">
            Unified Resource Coordination for{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Disaster Relief & Resilience
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            ResQ Hub empowers humanitarian relief organizations, field coordinators, volunteer brigades, and emergency admins to collaborate in real-time without bottlenecks or relief duplication.
          </p>

          {/* Top Quick Actions Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link to="/login" search={{ role: "coordinator" }}>
              <Button size="lg" className="font-bold text-sm h-12 px-6 gap-2 shadow-md">
                <LifeBuoy className="size-4" /> Coordinator Login
              </Button>
            </Link>
            <Link to="/login" search={{ role: "admin" }}>
              <Button
                variant="outline"
                size="lg"
                className="font-bold text-sm h-12 px-6 gap-2 border-border hover:bg-muted/50"
              >
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" /> Admin Console
              </Button>
            </Link>
            <Link to="/register">
              <Button
                variant="secondary"
                size="lg"
                className="font-bold text-sm h-12 px-6 gap-2 border border-border"
              >
                <Building2 className="size-4 text-primary" /> Create Organization
              </Button>
            </Link>
          </div>

          {/* Live Quick Counter Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs text-center shadow-xs">
              <span className="block text-2xl font-black text-foreground">9+</span>
              <span className="text-xs text-muted-foreground font-medium">Relief Categories</span>
            </div>
            <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs text-center shadow-xs">
              <span className="block text-2xl font-black text-primary">Live DB</span>
              <span className="text-xs text-muted-foreground font-medium">PostgreSQL Stock</span>
            </div>
            <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs text-center shadow-xs">
              <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">Multi-Org</span>
              <span className="text-xs text-muted-foreground font-medium">Inter-agency Feed</span>
            </div>
            <div className="p-3.5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs text-center shadow-xs">
              <span className="block text-2xl font-black text-foreground">Mobile</span>
              <span className="text-xs text-muted-foreground font-medium">Offline Sync Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRIMARY ACCESS ROLES SECTION (Choose Admin, Coordinator or Create Organization) */}
      <section id="roles" className="relative z-10 py-16 sm:py-20 bg-transparent border-b border-border/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Choose Your Gateway
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              Access ResQ Hub According to Your Role
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Select your designated portal to sign in or register your humanitarian organization.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* PORTAL 1: COORDINATOR LOGIN */}
            <div className="rounded-2xl border-2 border-primary/30 bg-card/85 backdrop-blur-md p-6 sm:p-7 shadow-sm hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  Field & Ops
                </span>
              </div>
              <div>
                <div className="size-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <LifeBuoy className="size-6" />
                </div>
                <h3 className="text-xl font-black text-foreground">Coordinator Login</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  For relief managers, logistics officers & community responders.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Real-time warehouse inventory and shelf variant stock.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Triage, approve and allocate community help requests.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Inward donation intake, shelf assignment & donor tracking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>Volunteer dispatch, task verification and coordination feed.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border/80">
                <Link to="/login" search={{ role: "coordinator" }} className="w-full block">
                  <Button className="w-full font-bold text-xs gap-1.5 h-10 shadow-xs">
                    Sign In as Coordinator <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* PORTAL 2: SUPER ADMIN LOGIN */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-card/85 backdrop-blur-md p-6 sm:p-7 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Governance
                </span>
              </div>
              <div>
                <div className="size-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="text-xl font-black text-foreground">Admin Login</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  For platform super administrators, security auditors & officials.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Review, verify and approve new organization applications.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Create & manage standard disaster resource categories.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>System-wide user roles, permissions and memberships.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Platform audit trail and inter-agency coordination log.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border/80">
                <Link to="/login" search={{ role: "admin" }} className="w-full block">
                  <Button
                    variant="outline"
                    className="w-full font-bold text-xs gap-1.5 h-10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 shadow-xs"
                  >
                    Sign In as Admin <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* PORTAL 3: CREATE / REGISTER ORGANIZATION */}
            <div className="rounded-2xl border-2 border-indigo-500/30 bg-card/85 backdrop-blur-md p-6 sm:p-7 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group">
              <div className="absolute top-4 right-4">
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  New Partner
                </span>
              </div>
              <div>
                <div className="size-12 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <Building2 className="size-6" />
                </div>
                <h3 className="text-xl font-black text-foreground">Create Organization</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  For NGOs, Red Cross chapters, welfare trusts & local charities.
                </p>

                <ul className="mt-5 space-y-2.5 text-xs text-foreground/90">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Submit official registration documents and district coverage.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Designate initial organization representative credentials.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Gain access to shared regional relief warehouses.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>Receive real-time disaster alerts and citizen requests.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-border/80">
                <Link to="/register" className="w-full block">
                  <Button
                    variant="secondary"
                    className="w-full font-bold text-xs gap-1.5 h-10 border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-xs"
                  >
                    Apply & Create Organization <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PLATFORM PILLARS & FEATURES */}
      <section id="features" className="relative z-10 py-16 sm:py-20 border-b border-border/40 scroll-mt-20 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Core Capabilities
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              Engineered for Real Disaster Relief Conditions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Built to withstand emergency scenarios with live PostgreSQL synchronization, smart variant shelves, and audit trails.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 shadow-xs hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Boxes className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Warehouse Inventory</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Categorized across 9 humanitarian relief branches with sub-types, variant shelves, and live audit transaction ledgers.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 shadow-xs hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <ClipboardList className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Community Requests</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Triage incoming community requests with urgency indicators, direct stock reserving, and fulfillment handoff PINs.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 shadow-xs hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <HeartHandshake className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Donation Pipeline</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Track donor pledges, coordinate organization pickups, verify physical condition, and shelve directly into warehouse inventory.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 shadow-xs hover:border-primary/40 transition-colors">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <MessageSquare className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Coordination Feed</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Inter-organization communication channel for requesting new main categories, broadcast announcements, and real-time coordinator chat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MOBILE APP COMPANION SPOTLIGHT */}
      <section id="mobile" className="relative z-10 py-16 sm:py-20 bg-transparent border-b border-border/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-md p-8 sm:p-12 lg:p-16 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Smartphone className="size-3.5" /> ResQ Hub Citizen Mobile App
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                Connecting Citizens and Donors Directly to Relief Teams
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our Flutter mobile app lets affected families submit urgent requests even with unstable connectivity. Donors can pledge supplies, and field volunteers can check in at distribution points.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Offline Request Queuing
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Dynamic Category Sync
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" /> Multilingual Support
                </div>
              </div>

              {/* Direct Download Action */}
              <div className="pt-2">
                <a
                  href={MOBILE_APP_DOWNLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button size="lg" className="h-11 px-5 font-bold text-xs gap-2 shadow-sm">
                    <Download className="size-4" /> Download ResQ Hub Mobile App (APK)
                  </Button>
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/80 backdrop-blur-xs p-6 shadow-sm max-w-sm w-full space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Mobile Integration Highlights
              </div>
              <div className="p-3 rounded-xl bg-card/90 border border-border flex items-center gap-3">
                <Layers className="size-5 text-primary shrink-0" />
                <div className="text-xs">
                  <strong className="block text-foreground">Synchronized Categories</strong>
                  <span className="text-muted-foreground">Every category in DB updates live on mobile.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-card/90 border border-border flex items-center gap-3">
                <Users className="size-5 text-primary shrink-0" />
                <div className="text-xs">
                  <strong className="block text-foreground">Volunteer Field Tasks</strong>
                  <span className="text-muted-foreground">GPS check-ins, pin validation and tasks.</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-card/90 border border-border flex items-center gap-3">
                <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <strong className="block text-foreground">Zero Hoarding Verification</strong>
                  <span className="text-muted-foreground">Secure tracking from donor to recipient.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS WORKFLOW */}
      <section id="workflow" className="relative z-10 py-16 sm:py-20 border-b border-border/40 scroll-mt-20 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Operational Workflow
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              How Relief Flows Through ResQ Hub
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A 3-step transparent coordination pipeline connecting need, stock, and distribution.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 relative">
              <span className="text-4xl font-black text-primary/20">01</span>
              <h3 className="text-base font-bold text-foreground mt-2">Intake & Verification</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Community members and relief camps log emergency needs via mobile or portal. Coordinators triage urgency and prevent duplicates.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 relative">
              <span className="text-4xl font-black text-emerald-600/20 dark:text-emerald-400/20">02</span>
              <h3 className="text-base font-bold text-foreground mt-2">Warehouse Shelving & Stock</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Donations are checked in, sorted into specific variant shelves, and tracked in a transparent audit ledger connected to Supabase PostgreSQL.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/85 backdrop-blur-md p-6 relative">
              <span className="text-4xl font-black text-indigo-600/20 dark:text-indigo-400/20">03</span>
              <h3 className="text-base font-bold text-foreground mt-2">Dispatch & Delivery</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Stock is reserved for approved requests, volunteer drivers receive mission waypoints, and handoff PINs confirm safe receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="relative z-10 mt-auto border-t border-border/60 bg-card/85 backdrop-blur-md py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ResQ Hub Logo"
              className="size-11 object-contain rounded-full shadow-sm"
            />
            <div>
              <span className="font-bold text-sm text-foreground">ResQ Hub</span>
              <p className="text-xs text-muted-foreground">
                Community Resilience & Disaster Resource Coordination Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-muted-foreground">
            <Link to="/login" search={{ role: "coordinator" }} className="hover:text-foreground transition-colors">
              Coordinator Login
            </Link>
            <Link to="/login" search={{ role: "admin" }} className="hover:text-foreground transition-colors">
              Admin Login
            </Link>
            <Link to="/register" className="hover:text-foreground transition-colors">
              Create Organization
            </Link>
          </div>

          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ResQ Hub. Designed for Humanitarian Impact.
          </div>
        </div>
      </footer>
    </div>
  );
}
