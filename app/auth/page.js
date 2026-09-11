"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  BadgeCheck,
  Users,
  Loader2,
  ShieldAlert,
  UserCheck,
  Building2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="size-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "";
  const modeParam = searchParams.get("mode") || "";

  const {
    user,
    isAdmin,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsAdmin,
  } = useAuth();

  // Login Role Mode: "tourist" | "admin"
  const [roleMode, setRoleMode] = useState(
    modeParam === "admin" ? "admin" : "tourist",
  );
  const [activeTab, setActiveTab] = useState("signin");

  // Tourist Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (modeParam === "admin") {
      setRoleMode("admin");
    }
  }, [modeParam]);

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        router.push("/admin");
      } else if (
        redirectTarget &&
        redirectTarget.startsWith("/") &&
        !redirectTarget.startsWith("//")
      ) {
        router.push(redirectTarget);
      } else {
        // Check if user has verified KYC, else open verification window first
        fetch("/api/kyc/status")
          .then((res) => res.json())
          .then((data) => {
            if (data?.kyc?.status === "verified") {
              router.push("/dashboard");
            } else {
              router.push("/dashboard/verify");
            }
          })
          .catch(() => router.push("/dashboard/verify"));
      }
    }
  }, [user, isAdmin, loading, router, redirectTarget]);

  const handleGoogleSignIn = () => {
    setErrorMsg("");
    signInWithGoogle();
  };

  const handleTouristSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg("");

    try {
      if (activeTab === "signup") {
        await signUpWithEmail(email, password, fullName);
      } else {
        await signInWithEmail(email, password);
      }
      const dest =
        redirectTarget &&
          redirectTarget.startsWith("/") &&
          !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/dashboard";
      router.push(dest);
    } catch (err) {
      setErrorMsg(err.message || "Tourist authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg("");

    try {
      await signInAsAdmin(adminEmail, adminPassword);
      const dest =
        redirectTarget && redirectTarget.startsWith("/admin")
          ? redirectTarget
          : "/admin";
      router.push(dest);
    } catch (err) {
      setErrorMsg(
        err.message || "Admin access denied. Invalid authority credentials.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-white grid lg:grid-cols-2">
      {/* Left Column: Image & Feature Showcase */}
      <div className="relative isolate hidden overflow-hidden lg:flex flex-col justify-center bg-slate-950 px-12 py-20 text-white">
        <img
          src="/assets/hero-immigration.jpg"
          alt="International travellers verifying digital passport identity at an airport e-gate"
          className="absolute inset-0 -z-10 size-full object-cover opacity-30"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-900/90 to-slate-950/80" />

        <div className="max-w-lg space-y-8 relative z-10">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold text-blue-300 border border-blue-400/30">
              <ShieldCheck className="size-3.5" /> Republic of India Smart
              Tourism Grid
            </span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              SafirPass Digital ID &amp; Verification Hub
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Foreign tourists register once, upload country-specific documents,
              complete biometric face verification, and receive an
              Authority-Verified Digital Tourist ID upon Admin review.
            </p>
          </div>

          <ul className="space-y-4 pt-2">
            {[
              {
                icon: <BadgeCheck className="size-5 text-blue-400" />,
                t: "Authority-verified digital tourist ID with biometric seal",
              },
              {
                icon: <Lock className="size-5 text-blue-400" />,
                t: "Dual-layer storage: PostgreSQL relational + MongoDB document vault",
              },
              {
                icon: <ShieldAlert className="size-5 text-blue-400" />,
                t: "Dedicated Government Admin review & approval authority",
              },
              {
                icon: <Users className="size-5 text-blue-400" />,
                t: "One-touch SOS panic trigger routed to 112 emergency units",
              },
            ].map((f, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 text-sm text-slate-200"
              >
                <span className="grid size-9 place-items-center rounded-xl bg-white/10 border border-white/10 shrink-0">
                  {f.icon}
                </span>
                <span className="font-medium">{f.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column: Sign In / Admin Portal */}
      <div className="flex items-center justify-center bg-slate-50/50 px-5 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Top Role Selector */}
          <div className="grid grid-cols-2 rounded-2xl bg-slate-200/80 p-1 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => {
                setRoleMode("tourist");
                setErrorMsg("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-all ${roleMode === "tourist"
                  ? "bg-white text-blue-600 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <UserCheck className="size-4" />
              <span>Tourist Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleMode("admin");
                setErrorMsg("");
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-all ${roleMode === "admin"
                  ? "bg-slate-900 text-white shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
                }`}
            >
              <Building2 className="size-4" />
              <span>Admin / Authority</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl space-y-6">
            {roleMode === "tourist" ? (
              <>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-slate-900">
                    Tourist Digital Access
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Sign in with Google for instant verification access, or use
                    email.
                  </p>
                </div>

                {errorMsg && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-800 border border-red-200">
                    {errorMsg}
                  </div>
                )}

                {/* Google OAuth Button */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={busy}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-all hover:shadow-md border-b-2"
                >
                  {busy ? (
                    <Loader2 className="size-5 animate-spin text-blue-600" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-5"
                      aria-hidden="true"
                    >
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.2 14.7 2.2 12 2.2 6.9 2.2 2.8 6.3 2.8 11.4S6.9 20.6 12 20.6c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.1-.2-1.6H12z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold uppercase">
                  <span className="h-px flex-1 bg-slate-200" /> or use email{" "}
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("signin")}
                    className={`rounded-lg py-2 transition-colors ${activeTab === "signin"
                        ? "bg-white text-slate-900 shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-900"
                      }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className={`rounded-lg py-2 transition-colors ${activeTab === "signup"
                        ? "bg-white text-slate-900 shadow-sm font-bold"
                        : "text-slate-500 hover:text-slate-900"
                      }`}
                  >
                    Create account
                  </button>
                </div>

                {/* Tourist Form */}
                <form onSubmit={handleTouristSubmit} className="space-y-4">
                  {activeTab === "signup" && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="su-name"
                        className="block text-xs font-bold uppercase text-slate-600"
                      >
                        Full Name
                      </label>
                      <input
                        id="su-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full legal name"
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label
                      htmlFor="email-input"
                      className="block text-xs font-bold uppercase text-slate-600"
                    >
                      Email Address
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tourist@example.com"
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="password-input"
                      className="block text-xs font-bold uppercase text-slate-600"
                    >
                      Password
                    </label>
                    <input
                      id="password-input"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
                  >
                    {busy ? (
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    ) : activeTab === "signin" ? (
                      "Sign in as Tourist"
                    ) : (
                      "Create Tourist Account"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Government Admin Form */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] font-bold">
                    <ShieldCheck className="size-3.5 text-blue-400" />
                    <span>Government Authority Gateway</span>
                  </div>
                  <h1 className="font-serif text-2xl font-bold text-slate-900">
                    Admin Control Portal
                  </h1>
                  <p className="text-xs text-slate-500">
                    Enter the authorized administrative credentials configured
                    in your environment file.
                  </p>
                </div>

                {errorMsg && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-800 border border-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <KeyRound className="size-3.5 text-blue-700" /> Controlled
                    Authority Access
                  </span>
                  <p className="text-[11px] text-blue-700">
                    Configured via <code>ADMIN_EMAIL</code> and{" "}
                    <code>ADMIN_PASSWORD</code> in <code>.env</code>.
                  </p>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-email"
                      className="block text-xs font-bold uppercase text-slate-600"
                    >
                      Admin Identifier / Email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@safirpass.gov.in"
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-password"
                      className="block text-xs font-bold uppercase text-slate-600"
                    >
                      Admin Security Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter Admin Password"
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors"
                  >
                    {busy ? (
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    ) : (
                      "Access Authority Console"
                    )}
                  </button>
                </form>
              </>
            )}

            <p className="text-[11px] leading-relaxed text-slate-500">
              By continuing you agree to the programme's{" "}
              <Link
                href="/privacy"
                className="text-blue-600 underline font-semibold"
              >
                privacy &amp; data policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
