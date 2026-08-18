import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/context/auth";

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

  const [email, setEmail] = useState("");
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
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="white" opacity=".3" />
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
                <path d="M2 17l10 5V12L2 7v10z" fill="white" opacity=".6" />
              </svg>
            </div>
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

        <div
          className="rounded-xl border p-8"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
          >
            Sign in
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            Sign in to your ResQ Hub account
          </p>

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
