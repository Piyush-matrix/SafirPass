"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  QrCode,
  Siren,
  PhoneCall,
  UserCheck,
  Building2,
  ScanFace,
  Landmark,
  Info,
  HelpCircle,
  Cpu,
  Shield,
  WifiOff,
  Radio,
  FileCheck2,
  Lock,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function Header() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();

  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null); 
  // 'features' | 'solutions' | 'resources' | 'identity' | 'user' | null

  const navRef = useRef(null);

  // Close menus on route navigation or click outside
  useEffect(() => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setMobileExpandedSection(null);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const toggleMobileSection = (name) => {
    setMobileExpandedSection((prev) => (prev === name ? null : name));
  };

  const isActive = (path) => pathname === path;

  // 1. PRE-LOGIN SHOWCASE MENUS

  const featureLinks = [
    {
      href: "/how-it-works",
      title: "How It Works",
      desc: "Step-by-step digital tourist pass issuance & journey",
      icon: <Compass className="size-4 text-blue-600" />,
      badge: "Guide",
    },
    {
      href: "/services",
      title: "Services & Benefits",
      desc: "Instant check-ins at hotels, airports, and monuments",
      icon: <FileCheck2 className="size-4 text-indigo-600" />,
    },
    {
      href: "/safety",
      title: "Safety Grid & Geofence",
      desc: "Live geo-fencing, SOS emergency dispatch & safety alerts",
      icon: <Shield className="size-4 text-emerald-600" />,
      badge: "Real-time",
    },
    {
      href: "/technology",
      title: "Core Technology",
      desc: "Zero-knowledge proofs, tamper-evident edge cryptography",
      icon: <Cpu className="size-4 text-purple-600" />,
    },
  ];

  const solutionLinks = [
    {
      href: "/authorities",
      title: "Command Center Hub",
      desc: "Unified portal for Police, State Tourism & Emergency teams",
      icon: <Building2 className="size-4 text-blue-600" />,
      badge: "Gov & Police",
    },
    {
      href: "/embassy",
      title: "Consular & Embassy Rescue",
      desc: "Emergency clearance & consular support for lost passports",
      icon: <Landmark className="size-4 text-amber-600" />,
    },
    {
      href: "/verify",
      title: "Cryptographic QR Verifier",
      desc: "Instant public verification scanner for authorities & hotels",
      icon: <QrCode className="size-4 text-teal-600" />,
      badge: "Verifier",
    },
  ];

  const resourceLinks = [
    {
      href: "/about",
      title: "About SafirPass",
      desc: "Digital India initiative & vision for secure modern travel",
      icon: <Info className="size-4 text-blue-600" />,
    },
    {
      href: "/help",
      title: "Help Center & FAQs",
      desc: "24×7 multi-lingual tourist assistance & emergency guides",
      icon: <HelpCircle className="size-4 text-emerald-600" />,
      badge: "24×7",
    },
    {
      href: "/privacy",
      title: "Data Privacy & Consent",
      desc: "Privacy-by-design architecture, ZK proofs & zero tracking",
      icon: <Lock className="size-4 text-rose-600" />,
    },
  ];

  // 2. POST-LOGIN OPERATIONAL MENUS

  const postLoginIdentityLinks = [
    {
      href: "/dashboard/id",
      title: "Digital ID & QR Pass",
      desc: "Cryptographic identity credential & shareable tourist QR",
      icon: <QrCode className="size-4 text-indigo-600" />,
      badge: "Active Pass",
    },
    {
      href: "/dashboard/verify",
      title: "e-KYC Verification",
      desc: "Biometric & passport verification state and credentials",
      icon: <ScanFace className="size-4 text-purple-600" />,
      badge: "Verified",
    },
    {
      href: "/dashboard/offline",
      title: "Offline Enclave Pass",
      desc: "Zero-connectivity cryptographic token for remote areas",
      icon: <WifiOff className="size-4 text-amber-600" />,
      badge: "Offline Ready",
    },
    {
      href: "/dashboard/consent",
      title: "Consent & Privacy Hub",
      desc: "Selective data disclosure controls & audit trails",
      icon: <Lock className="size-4 text-emerald-600" />,
    },
  ];

  const adminLinks = [
    {
      href: "/admin",
      label: "Admin Queue",
      icon: <Building2 className="size-4 text-blue-600" />,
    },
    {
      href: "/authorities",
      label: "Command Hub",
      icon: <Shield className="size-4 text-indigo-600" />,
    },
    {
      href: "/dashboard/command",
      label: "Live Telemetry",
      icon: <Radio className="size-4 text-emerald-600" />,
    },
    {
      href: "/verify",
      label: "QR Verifier",
      icon: <QrCode className="size-4 text-teal-600" />,
    },
  ];

  const isFeaturesActive = featureLinks.some((l) => pathname === l.href);
  const isSolutionsActive = solutionLinks.some((l) => pathname === l.href);
  const isResourcesActive = resourceLinks.some((l) => pathname === l.href);
  const isIdentityActive = postLoginIdentityLinks.some(
    (l) => pathname === l.href,
  );

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs"
    >
      <div className="container-page flex h-18 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/20">
            <ShieldCheck className="size-6 text-blue-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                SafirPass
              </span>
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-blue-700 uppercase border border-blue-200/60">
                Official
              </span>
            </div>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 flex items-center gap-1">
              <span>National Tourist Identity Grid</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {!user ? (
            <>
              {/* Dropdown 1: Features & Platform */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("features")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${isFeaturesActive || activeDropdown === "features"
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <span>Platform</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${activeDropdown === "features" ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                  />
                </button>

                {activeDropdown === "features" && (
                  <div className="absolute left-0 mt-2 w-[480px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="grid grid-cols-2 gap-2">
                      {featureLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className={`group flex flex-col rounded-xl p-3 transition-all ${isActive(item.href)
                              ? "bg-blue-50/80 border border-blue-200/80"
                              : "hover:bg-slate-50 border border-transparent"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                              {item.icon}
                            </div>
                            {item.badge && (
                              <span className="rounded-full bg-blue-100/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-tight text-slate-500">
                            {item.desc}
                          </p>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 border border-slate-100">
                      <span className="flex items-center gap-1.5 font-medium text-[11px]">
                        <Sparkles className="size-3.5 text-blue-600" />
                        Zero-Knowledge cryptographic privacy verified
                      </span>
                      <Link
                        href="/how-it-works"
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                      >
                        Explore <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown 2: Solutions & Authorities */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("solutions")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${isSolutionsActive || activeDropdown === "solutions"
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <span>Solutions</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${activeDropdown === "solutions" ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                  />
                </button>

                {activeDropdown === "solutions" && (
                  <div className="absolute left-0 mt-2 w-[400px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="space-y-1">
                      {solutionLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className={`group flex items-start gap-3 rounded-xl p-2.5 transition-all ${isActive(item.href)
                              ? "bg-blue-50/80 border border-blue-200/80"
                              : "hover:bg-slate-50 border border-transparent"
                            }`}
                        >
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </p>
                              {item.badge && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-2 border-t border-slate-100 pt-2 px-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        Need instant credential check?
                      </span>
                      <Link
                        href="/verify"
                        onClick={() => setActiveDropdown(null)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                      >
                        Public QR Scanner <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Link: Safety Grid */}
              <Link
                href="/safety"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive("/safety")
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                Safety Grid
              </Link>

              {/* Dropdown 3: Resources & Trust */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown("resources")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${isResourcesActive || activeDropdown === "resources"
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <span>Resources</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${activeDropdown === "resources" ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                  />
                </button>

                {activeDropdown === "resources" && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="space-y-1">
                      {resourceLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className={`flex items-start gap-3 rounded-xl p-2.5 transition-colors ${isActive(item.href)
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50 text-slate-800"
                            }`}
                        >
                          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-slate-900 leading-tight">
                                {item.title}
                              </p>
                              {item.badge && (
                                <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) :
            isAdmin ? (
              /* Admin Navigation */
              adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive(link.href)
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))
            ) : (
              /* Tourist Navigation: Clean, Dropdown Mega-Menu like before login */
              <>
                {/* Direct Link 1: Dashboard Overview */}
                <Link
                  href="/dashboard"
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive("/dashboard")
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  Dashboard
                </Link>

                {/* Dropdown: Identity Suite ▾ (Styled like Platform / Solutions dropdown before login) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => toggleDropdown("identity")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${isIdentityActive || activeDropdown === "identity"
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    <span>Identity Pass</span>
                    <ChevronDown
                      className={`size-3.5 transition-transform duration-200 ${activeDropdown === "identity" ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                    />
                  </button>

                  {activeDropdown === "identity" && (
                    <div className="absolute left-0 mt-2 w-[440px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                      <div className="space-y-1">
                        {postLoginIdentityLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setActiveDropdown(null)}
                            className={`group flex items-start gap-3 rounded-xl p-2.5 transition-all ${isActive(item.href)
                                ? "bg-blue-50/80 border border-blue-200/80"
                                : "hover:bg-slate-50 border border-transparent"
                              }`}
                          >
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {item.title}
                                </p>
                                {item.badge && (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-2 border-t border-slate-100 pt-2 px-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          Offline Zero-Knowledge proofs active
                        </span>
                        <Link
                          href="/dashboard/id"
                          onClick={() => setActiveDropdown(null)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          View ID Pass <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Link 2: Emergency SOS */}
                <Link
                  href="/dashboard/sos"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive("/dashboard/sos")
                      ? "bg-red-50 text-red-700 font-bold"
                      : "text-red-600 hover:bg-red-50 hover:text-red-700"
                    }`}
                >
                  <Siren className="size-4 animate-pulse text-red-500" />
                  <span>Emergency SOS</span>
                </Link>
              </>
            )}
        </nav>

        {/* Action Controls & Auth Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Emergency Helpline Pill */}
          <a
            href="tel:1363"
            className="hidden sm:flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
            title="National Tourist Infoline - Toll Free"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-amber-500"></span>
            </span>
            <PhoneCall className="size-3.5 text-amber-600" />
            <span>1363 Helpline</span>
          </a>

          {user ? (
            /* User Profile Dropdown Pill */
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown("user")}
                className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 p-1.5 pr-2.5 text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors shadow-2xs group"
              >
                <div className="relative">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User Profile"
                      className="size-7 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white text-xs shadow-xs">
                      {user.user_metadata?.full_name
                        ? user.user_metadata.full_name[0].toUpperCase()
                        : user.email
                          ? user.email[0].toUpperCase()
                          : "T"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="max-w-[120px] truncate text-xs font-bold text-slate-900 leading-tight">
                    {user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "Tourist"}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wide text-blue-600">
                    {isAdmin ? "Gov Official" : "Tourist Active"}
                  </span>
                </div>
                <ChevronDown
                  className={`size-3.5 text-slate-400 transition-transform ${activeDropdown === "user" ? "rotate-180" : ""}`}
                />
              </button>

              {activeDropdown === "user" && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="border-b border-slate-100 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900 truncate">
                        {user.user_metadata?.full_name || "Tourist Account"}
                      </p>
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 uppercase">
                        {isAdmin ? "Admin" : "Verified"}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-500 mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {isAdmin ? (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80"
                        >
                          <Building2 className="size-4 text-blue-600" /> Admin
                          Verification Hub
                        </Link>
                        <Link
                          href="/authorities"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Shield className="size-4 text-slate-600" /> Command
                          Center
                        </Link>
                        <Link
                          href="/dashboard/command"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Radio className="size-4 text-emerald-600" />{" "}
                          Real-Time Telemetry
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="size-4 text-blue-600" />{" "}
                          Dashboard Overview
                        </Link>
                        <Link
                          href="/dashboard/id"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <QrCode className="size-4 text-indigo-600" /> My
                          Digital ID Pass
                        </Link>
                        <Link
                          href="/dashboard/verify"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <ScanFace className="size-4 text-purple-600" /> e-KYC
                          Verification
                        </Link>
                        <Link
                          href="/dashboard/offline"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <WifiOff className="size-4 text-amber-600" /> Offline
                          Enclave Token
                        </Link>
                        <Link
                          href="/dashboard/consent"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Lock className="size-4 text-emerald-600" /> Privacy
                          &amp; Consent Hub
                        </Link>
                        <Link
                          href="/dashboard/sos"
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Siren className="size-4 text-red-600" /> Emergency
                          SOS Center
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDropdown(null);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="size-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all hover:shadow-lg active:scale-98"
            >
              <UserCheck className="size-4" />
              <span>Sign in / Register</span>
            </Link>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 pt-3 pb-6 lg:hidden animate-in slide-in-from-top-2 duration-200 max-h-[85vh] overflow-y-auto">
          {!user ? (
            /* Pre-Login Mobile Navigation */
            <div className="space-y-3">
              {/* Accordion 1: Platform & Features */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-1">
                <button
                  type="button"
                  onClick={() => toggleMobileSection("features")}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="size-4 text-blue-600" /> Platform &amp;
                    Features
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform ${mobileExpandedSection === "features" ? "rotate-180" : ""}`}
                  />
                </button>
                {(mobileExpandedSection === "features" ||
                  mobileExpandedSection === null) && (
                    <div className="mt-1 space-y-0.5 px-1 pb-1">
                      {featureLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${isActive(link.href)
                              ? "bg-blue-50 text-blue-700 font-bold"
                              : "text-slate-700 hover:bg-white"
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {link.icon}
                            <span>{link.title}</span>
                          </div>
                          {link.badge && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800">
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
              </div>

              {/* Accordion 2: Solutions & Authorities */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-1">
                <button
                  type="button"
                  onClick={() => toggleMobileSection("solutions")}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="size-4 text-indigo-600" /> Solutions
                    &amp; Authorities
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform ${mobileExpandedSection === "solutions" ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileExpandedSection === "solutions" && (
                  <div className="mt-1 space-y-0.5 px-1 pb-1">
                    {solutionLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${isActive(link.href)
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {link.icon}
                          <span>{link.title}</span>
                        </div>
                        {link.badge && (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-800">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: Resources & Trust */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-1">
                <button
                  type="button"
                  onClick={() => toggleMobileSection("resources")}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-emerald-600" /> Resources
                    &amp; Trust
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform ${mobileExpandedSection === "resources" ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileExpandedSection === "resources" && (
                  <div className="mt-1 space-y-0.5 px-1 pb-1">
                    {resourceLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${isActive(link.href)
                            ? "bg-blue-50 text-blue-700 font-bold"
                            : "text-slate-700 hover:bg-white"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {link.icon}
                          <span>{link.title}</span>
                        </div>
                        {link.badge && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Post-Login Mobile Drawer (Same Accordion Style as Before Login) */
            <div className="space-y-3">
              {/* User Profile Banner in Drawer */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200/80 mb-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-sm">
                  {user.user_metadata?.full_name
                    ? user.user_metadata.full_name[0].toUpperCase()
                    : user.email
                      ? user.email[0].toUpperCase()
                      : "T"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {user.user_metadata?.full_name || "Tourist Account"}
                    </p>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                      {isAdmin ? "Admin" : "Verified"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Direct Dashboard Link */}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive("/dashboard")
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <LayoutDashboard className="size-4 text-blue-600" />
                <span>Dashboard Overview</span>
              </Link>

              {/* Post-Login Accordion: Identity Pass */}
              {!isAdmin && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-1">
                  <button
                    type="button"
                    onClick={() => toggleMobileSection("m-identity")}
                    className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    <span className="flex items-center gap-2">
                      <QrCode className="size-4 text-indigo-600" /> Identity
                      Pass Suite
                    </span>
                    <ChevronDown
                      className={`size-4 transition-transform ${mobileExpandedSection === "m-identity" ? "rotate-180" : ""}`}
                    />
                  </button>
                  {(mobileExpandedSection === "m-identity" ||
                    mobileExpandedSection === null) && (
                      <div className="mt-1 space-y-0.5 px-1 pb-1">
                        {postLoginIdentityLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${isActive(link.href)
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "text-slate-700 hover:bg-white"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {link.icon}
                              <span>{link.title}</span>
                            </div>
                            {link.badge && (
                              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-800">
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                </div>
              )}

              {/* Admin Links in Drawer */}
              {isAdmin && (
                <nav className="flex flex-col gap-1">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${isActive(link.href)
                          ? "bg-blue-50 text-blue-700 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </nav>
              )}

              {/* Direct Mobile SOS Dispatcher button */}
              <Link
                href="/dashboard/sos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-md shadow-red-500/20 active:scale-98 mt-2"
              >
                <Siren className="size-4 animate-pulse text-white" />
                <span>Trigger Emergency SOS</span>
              </Link>
            </div>
          )}

          {/* Quick Actions & Auth */}
          <div className="mt-5 border-t border-slate-100 pt-4 space-y-2.5">
            <a
              href="tel:1363"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-xs font-bold text-amber-800"
            >
              <PhoneCall className="size-3.5 text-amber-600" />
              <span>Emergency 1363 Tourist Helpline (24×7)</span>
            </a>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="size-4" /> Sign Out
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
              >
                <UserCheck className="size-4" /> Sign in / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
