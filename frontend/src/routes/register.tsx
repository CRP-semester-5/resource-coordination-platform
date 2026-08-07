import { useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { authAPI } from "@/api/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register Organization — ResQ Hub" },
      {
        name: "description",
        content:
          "Apply to bring your organization onto the ResQ Hub platform. A Super Admin will review and approve your application.",
      },
    ],
  }),
  component: RegisterPage,
});

const CATEGORIES = [
  "Disaster Relief",
  "Community Welfare",
  "Emergency Response",
  "Medical Aid",
  "Food & Nutrition",
  "Shelter & Housing",
  "Education",
  "Other",
];

const SRI_LANKA_DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala",
  "Mannar","Matale","Matara","Moneragala","Mullaitivu","Nuwara Eliya","Polonnaruwa",
  "Puttalam","Ratnapura","Trincomalee","Vavuniya",
];

type Step = 1 | 2;

function Field({
  label,
  id,
  children,
  hint,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors";
const inputStyle = {
  borderColor: "var(--border)",
  background: "var(--background)",
  color: "var(--foreground)",
};

function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Step 1 — representative details
  const [repName, setRepName] = useState("");
  const [repEmail, setRepEmail] = useState("");
  const [repPassword, setRepPassword] = useState("");
  const [repConfirm, setRepConfirm] = useState("");
  const [repPhone, setRepPhone] = useState("");

  // Step 2 — organization details
  const [orgName, setOrgName] = useState("");
  const [orgCategory, setOrgCategory] = useState(CATEGORIES[0] as string);
  const [orgDistrict, setOrgDistrict] = useState(SRI_LANKA_DISTRICTS[4] as string); // Colombo
  const [orgDescription, setOrgDescription] = useState("");
  const [orgRegNum, setOrgRegNum] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");

  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    if (repPassword !== repConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (repPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await authAPI.applyOrganization({
        rep_name: repName,
        rep_email: repEmail,
        rep_password: repPassword,
        rep_phone: repPhone || undefined,
        org_name: orgName,
        org_category: orgCategory,
        org_district: orgDistrict,
        org_description: orgDescription,
        org_registration_number: orgRegNum || undefined,
        org_contact_email: orgEmail || undefined,
        org_contact_phone: orgPhone || undefined,
      });
      setDone(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Submission failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-md text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#DCFCE7" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}>
            Application submitted!
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            Your organization application is under review. A platform administrator will verify your
            details and notify you at <strong>{repEmail}</strong> once a decision is made.
          </p>
          <button
            onClick={() => router.navigate({ to: "/login" })}
            className="py-2.5 px-6 rounded-lg font-semibold text-sm hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="w-full max-w-lg">
        {/* Logo + back link */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
                <path d="M2 17l10 5V12L2 7v10z" fill="white" opacity=".6" />
              </svg>
            </div>
            <div>
              <div
                className="font-bold text-base leading-none"
                style={{ fontFamily: "DM Sans, system-ui, sans-serif", color: "var(--primary)" }}
              >
                ResQ Hub
              </div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Organization Registration
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="text-xs hover:underline"
            style={{ color: "var(--muted-foreground)" }}
          >
            ← Back to sign in
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          {([1, 2] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: step >= s ? "var(--primary)" : "var(--muted)",
                  color: step >= s ? "white" : "var(--muted-foreground)",
                }}
              >
                {s}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: step === s ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                {s === 1 ? "Your details" : "Organization"}
              </span>
              {s < 2 && (
                <div className="w-8 h-px" style={{ background: "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border p-8"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {step === 1 ? (
            <>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
              >
                Representative details
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
                You will become the first administrator of your organization upon approval.
              </p>

              <form onSubmit={handleStep1} className="space-y-4">
                <Field label="Full name" id="rep_name">
                  <input
                    id="rep_name"
                    required
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="e.g. Priya Ratnasiri"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Email address" id="rep_email">
                  <input
                    id="rep_email"
                    type="email"
                    required
                    value={repEmail}
                    onChange={(e) => setRepEmail(e.target.value)}
                    placeholder="you@yourorg.lk"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password" id="rep_password">
                    <input
                      id="rep_password"
                      type="password"
                      required
                      value={repPassword}
                      onChange={(e) => setRepPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Confirm password" id="rep_confirm">
                    <input
                      id="rep_confirm"
                      type="password"
                      required
                      value={repConfirm}
                      onChange={(e) => setRepConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </Field>
                </div>
                <Field label="Phone (optional)" id="rep_phone">
                  <input
                    id="rep_phone"
                    type="tel"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    placeholder="+94 77 000 0000"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>

                {error && (
                  <div
                    className="rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: "#FEE2E2", color: "#991B1B" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 mt-2"
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    fontFamily: "DM Sans, system-ui, sans-serif",
                  }}
                >
                  Continue →
                </button>
              </form>
            </>
          ) : (
            <>
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "DM Sans, system-ui, sans-serif" }}
              >
                Organization details
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
                A Super Admin will review and verify your organization before access is granted.
              </p>

              <form onSubmit={handleStep2} className="space-y-4">
                <Field label="Organization name" id="org_name">
                  <input
                    id="org_name"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Green Community Organization"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Category" id="org_category">
                    <select
                      id="org_category"
                      required
                      value={orgCategory}
                      onChange={(e) => setOrgCategory(e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="District" id="org_district">
                    <select
                      id="org_district"
                      required
                      value={orgDistrict}
                      onChange={(e) => setOrgDistrict(e.target.value)}
                      className={inputCls}
                      style={inputStyle}
                    >
                      {SRI_LANKA_DISTRICTS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field
                  label="Description"
                  id="org_description"
                  hint="Briefly describe your organization's mission and the communities you serve."
                >
                  <textarea
                    id="org_description"
                    required
                    rows={3}
                    value={orgDescription}
                    onChange={(e) => setOrgDescription(e.target.value)}
                    placeholder="We provide emergency relief and welfare support to..."
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Registration number (optional)" id="org_reg">
                  <input
                    id="org_reg"
                    value={orgRegNum}
                    onChange={(e) => setOrgRegNum(e.target.value)}
                    placeholder="e.g. RG/2023/001"
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact email (optional)" id="org_email">
                    <input
                      id="org_email"
                      type="email"
                      value={orgEmail}
                      onChange={(e) => setOrgEmail(e.target.value)}
                      placeholder="info@yourorg.lk"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Contact phone (optional)" id="org_phone">
                    <input
                      id="org_phone"
                      type="tel"
                      value={orgPhone}
                      onChange={(e) => setOrgPhone(e.target.value)}
                      placeholder="+94 11 000 0000"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {error && (
                  <div
                    className="rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: "#FEE2E2", color: "#991B1B" }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setError(""); setStep(1); }}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm border hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    ← Back
                  </button>
                  <button
                    id="register-submit"
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-60"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                      fontFamily: "DM Sans, system-ui, sans-serif",
                    }}
                  >
                    {submitting ? "Submitting…" : "Submit application"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
