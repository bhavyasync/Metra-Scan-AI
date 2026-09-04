"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, UserRole, DEMO_USERS } from "../../lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("inspector");

  // Form states
  const [userId, setUserId] = useState(DEMO_USERS.inspector.user_id);
  const [password, setPassword] = useState(DEMO_USERS.inspector.pass);
  const [name, setName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [email, setEmail] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    const demo = DEMO_USERS[role];
    if (demo && mode === "login") {
      setUserId(demo.user_id);
      setPassword(demo.pass);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password.trim()) {
      setError("Please provide both User ID and Password.");
      return;
    }

    const ok = login(userId, password, selectedRole);
    if (ok) {
      router.push("/");
    } else {
      setError("Invalid User ID or Password. Try the demo credentials below.");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId.trim() || !password.trim() || !name.trim()) {
      setError("User ID, Full Name, and Password are required.");
      return;
    }

    const newProfile = {
      user_id: userId.trim(),
      name: name.trim(),
      role: selectedRole,
      email: email.trim() || `${userId}@metrascan.gov.in`,
      entityName: entityName.trim(),
      jurisdiction: jurisdiction.trim(),
    };

    register(newProfile, password);
    setSuccess("Account registered successfully! Redirecting to workspace...");
    setTimeout(() => {
      router.push("/");
    }, 900);
  };

  const demoAccounts: { role: UserRole; title: string; badge: string; color: string; desc: string }[] = [
    {
      role: "inspector",
      title: "Inspector Rajesh Sharma",
      badge: "Enforcement Officer",
      color: "emerald",
      desc: "Live camera scanner, OCR evidence verification, and automated violation notice dispatch to FMCG companies.",
    },
    {
      role: "company",
      title: "Amul Packaging Compliance",
      badge: "Manufacturer / Packer",
      color: "orange",
      desc: "Company Inbox: receive automated severity notices, review inspection findings, and upload corrective artwork proof.",
    },
    {
      role: "admin",
      title: "Dr. Vikram Seth (Directorate)",
      badge: "Central Admin",
      color: "purple",
      desc: "National compliance KPI analytics, officer monitoring, rule threshold configurator, and audit feed.",
    },
    {
      role: "user",
      title: "Anita Roy (Citizen)",
      badge: "Consumer Watchdog",
      color: "cyan",
      desc: "Citizen retail scanner: check MRP tampering, overcharging, and 1-click grievance lodging to Metrology Dept.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#06090e] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-orange-500/10 blur-[140px]" />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-6 py-4 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-orange-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">MetraScan AI</span>
              <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
                GOVT OF INDIA
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Legal Metrology (Packaged Commodities) Rules, 2011
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            ← Back to Scanner
          </Link>
        </div>
      </header>

      {/* Main Login / Register Card */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT: Auth Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              {/* Header Title */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Authorized Access Portal
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {mode === "login" ? "Sign in to MetraScan" : "Register Metrology Entity"}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  Select your authorized role to access tailored Legal Metrology inspection, enforcement notices, or consumer reporting.
                </p>
              </div>

              {/* Mode Toggle (Login vs Register) */}
              <div className="mb-6 flex rounded-2xl border border-white/[0.08] bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    mode === "login"
                      ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    mode === "register"
                      ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Register New Entity
                </button>
              </div>

              {/* Role Selection Tabs (Admin / Inspector / Company / User) */}
              <div className="mb-6">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select Entity Role:
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: "inspector", label: "Inspector", icon: "🛡️", color: "emerald" },
                    { id: "company", label: "Company", icon: "🏢", color: "orange" },
                    { id: "admin", label: "Admin", icon: "🏛️", color: "purple" },
                    { id: "user", label: "Citizen", icon: "👤", color: "cyan" },
                  ].map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelect(r.id as UserRole)}
                        className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all ${
                          isSelected
                            ? r.id === "inspector"
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-200 shadow-md shadow-emerald-500/10"
                              : r.id === "company"
                              ? "border-orange-500 bg-orange-500/15 text-orange-200 shadow-md shadow-orange-500/10"
                              : r.id === "admin"
                              ? "border-purple-500 bg-purple-500/15 text-purple-200 shadow-md shadow-purple-500/10"
                              : "border-cyan-500 bg-cyan-500/15 text-cyan-200 shadow-md shadow-cyan-500/10"
                            : "border-white/[0.08] bg-black/20 text-slate-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="text-xl">{r.icon}</span>
                        <span className="text-xs font-bold">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error or Success Alert */}
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  <span>✓</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Form Fields */}
              <form onSubmit={mode === "login" ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-300">
                      Full Name / Authorized Signatory
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    User ID / Username
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter your user_id (e.g. insp_rajesh, amul_india)"
                    className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {mode === "register" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">
                        {selectedRole === "company"
                          ? "Company / FMCG Brand Name"
                          : selectedRole === "inspector"
                          ? "Department & Zone"
                          : "Organization / Entity"}
                      </label>
                      <input
                        type="text"
                        value={entityName}
                        onChange={(e) => setEntityName(e.target.value)}
                        placeholder={
                          selectedRole === "company"
                            ? "e.g. Gujarat Milk Mktg Fed (Amul)"
                            : "e.g. Legal Metrology Enforcement North Zone"
                        }
                        className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="official.email@gov.in or company.com"
                        className="w-full rounded-xl border border-white/[0.1] bg-black/40 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className={`mt-6 w-full rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                    selectedRole === "inspector"
                      ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                      : selectedRole === "company"
                      ? "bg-orange-500 text-black hover:bg-orange-400 shadow-orange-500/20"
                      : selectedRole === "admin"
                      ? "bg-purple-500 text-white hover:bg-purple-400 shadow-purple-500/20"
                      : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20"
                  }`}
                >
                  {mode === "login"
                    ? `Sign In as ${selectedRole.toUpperCase()}`
                    : `Register as ${selectedRole.toUpperCase()}`}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Quick Demo 1-Click Login (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-white/[0.08] bg-[#0c121e]/85 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  ⚡ 1-Click Demo Logins
                </h3>
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[9px] font-bold text-orange-400">
                  Hackathon Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click any role card below to instantly sign in with pre-configured credentials and explore its dedicated UI & authorization:
              </p>

              <div className="mt-4 space-y-2.5">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(acc.role);
                      const demo = DEMO_USERS[acc.role];
                      login(demo.user_id, demo.pass, acc.role);
                      router.push("/");
                    }}
                    className={`group w-full rounded-2xl border p-3.5 text-left transition-all hover:scale-[1.01] ${
                      acc.role === "inspector"
                        ? "border-emerald-500/30 bg-emerald-500/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/60"
                        : acc.role === "company"
                        ? "border-orange-500/30 bg-orange-500/[0.04] hover:bg-orange-500/10 hover:border-orange-500/60"
                        : acc.role === "admin"
                        ? "border-purple-500/30 bg-purple-500/[0.04] hover:bg-purple-500/10 hover:border-purple-500/60"
                        : "border-cyan-500/30 bg-cyan-500/[0.04] hover:bg-cyan-500/10 hover:border-cyan-500/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white group-hover:underline">
                        {acc.title}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${
                          acc.role === "inspector"
                            ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                            : acc.role === "company"
                            ? "border-orange-500/40 bg-orange-500/20 text-orange-300"
                            : acc.role === "admin"
                            ? "border-purple-500/40 bg-purple-500/20 text-purple-300"
                            : "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {acc.badge}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
                      {acc.desc}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>ID: {DEMO_USERS[acc.role].user_id}</span>
                      <span className="font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                        Launch Workspace →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Statutory Disclaimer Card */}
            <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 text-[11px] text-slate-500 leading-relaxed">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Statutory Reference
              </p>
              <p className="mt-1">
                The Legal Metrology (Packaged Commodities) Rules, 2011 govern mandatory declarations on pre-packaged goods across India. Non-compliance invites penalties under Section 36 of the Legal Metrology Act, 2009.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] px-6 py-4 text-center text-xs text-slate-500">
        MetraScan AI • Smart India Hackathon (SIH Problem ID 26034) • Directorate of Legal Metrology, Government of India
      </footer>
    </main>
  );
}

