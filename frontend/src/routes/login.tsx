import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/context/auth";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — ResQ Hub" },
      { name: "description", content: "Sign in to the ResQ Hub resource coordination platform." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, isSuperAdmin } = useAuth();
  const router = useRouter();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const invitation = searchParams?.get("invitation");
  const inviteOrg = searchParams?.get("org") || "the Organization";
  const inviteEmail = searchParams?.get("email") || "";
  const role = searchParams?.get("role");

  const [email, setEmail] = useState(inviteEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    const dest = isSuperAdmin ? "/admin" : "/coordinator";
    router.navigate({ to: dest });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      router.navigate({ to: res.isSuperAdmin ? "/admin" : "/coordinator" });
    } else {
      setError(res.message ?? "Login failed");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/logo.png"
              alt="ResQ Hub Logo"
              className="w-11 h-11 object-contain rounded-xl shadow-xs"
            />
            <div>
              <div
                className="font-bold text-lg leading-none"
                style={{ fontFamily: "DM Sans, system-ui, sans-serif", color: "var(--primary)" }}
              >
                ResQ Hub
              </div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Resource Coordination Platform
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div
          className="rounded-xl border p-8"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {role === "admin" && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
              Super Admin Console
            </div>
          )}
          {role === "coordinator" && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20 mb-3">
              Coordinator Workspace
            </div>
          )}
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
          >
            {role === "admin" ? "Admin Sign in" : role === "coordinator" ? "Coordinator Sign in" : "Sign in"}
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            {role === "admin" 
              ? "Sign in to access platform administration & governance" 
              : role === "coordinator" 
                ? "Sign in to access organization relief & inventory workspace" 
                : "Sign in to your ResQ Hub account"}
          </p>

          {invitation === "accepted" && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <div className="font-semibold text-sm">Invitation Accepted! 🎉</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 leading-relaxed">
                  You are now an active <strong>Coordinator</strong> for <strong>{inviteOrg}</strong>. Please sign in below with your credentials to access your operations workspace.
                </div>
              </div>
            </div>
          )}

          {invitation === "already_accepted" && (
            <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-800 dark:text-blue-300 flex items-start gap-3">
              <Info className="size-5 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <div className="font-semibold text-sm">Already a Member</div>
                <div className="text-xs text-blue-700 dark:text-blue-400 mt-0.5 leading-relaxed">
                  You have already accepted the invitation to <strong>{inviteOrg}</strong>. Sign in below to continue.
                </div>
              </div>
            </div>
          )}

          {invitation === "error" && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-800 dark:text-rose-300 flex items-start gap-3">
              <AlertTriangle className="size-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <div className="font-semibold text-sm">Invitation Error</div>
                <div className="text-xs text-rose-700 dark:text-rose-400 mt-0.5 leading-relaxed">
                  {searchParams?.get("message") || "The invitation link is invalid or has expired."}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--muted-foreground)" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organization.org"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-xs font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {error && (
              <div
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{ background: "#FEE2E2", color: "#991B1B" }}
              >
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-2"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                fontFamily: "DM Sans, system-ui, sans-serif",
              }}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div
            className="mt-6 pt-6 border-t text-center text-sm"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            Want to bring your organization on board?{" "}
            <Link
              to="/register"
              className="font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              Apply here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
