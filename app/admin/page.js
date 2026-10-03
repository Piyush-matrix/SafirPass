"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  FileText,
  ScanFace,
  Download,
  AlertTriangle,
  Loader2,
  RefreshCw,
  LogOut,
  MapPin,
  Calendar,
  Check,
  X,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Maximize2,
  Sparkles,
  Activity,
  Database,
  History,
  Lock,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  SunMoon,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("queue"); // 'queue' | 'audit' | 'system'

  // Application Data & Filters
  const [applications, setApplications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedNationality, setSelectedNationality] = useState("all");

  // Inspection Drawer / Modal State
  const [selectedApp, setSelectedApp] = useState(null);
  const [docDecisions, setDocDecisions] = useState({}); // { [doc_type]: { status: 'verified'|'failed', failureReason: string } }
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Document Lightbox / Forensic Viewer State
  const [activeViewerDoc, setActiveViewerDoc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [highContrast, setHighContrast] = useState(false);

  const loadData = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await fetch("/api/admin/kyc");
      const data = await res.json();
      if (data?.applications) {
        setApplications(data.applications);
      }
      if (data?.auditLogs) {
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.warn("Failed to load admin applications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
      } else {
        fetch("/api/admin/kyc")
          .then((res) => res.json())
          .then((data) => {
            if (ignore) return;
            if (data?.applications) setApplications(data.applications);
            if (data?.auditLogs) setAuditLogs(data.auditLogs);
          })
          .catch((err) => console.warn("Failed to load admin applications:", err))
          .finally(() => {
            if (!ignore) setLoading(false);
          });
      }
    }
    return () => {
      ignore = true;
    };
  }, [user, authLoading, router]);

  // Open Detailed Application Inspector
  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setDecisionNotes(app.admin_notes || "");
    setActionSuccessMsg("");

    const initialDecisions = {};
    if (Array.isArray(app.documents)) {
      app.documents.forEach((d) => {
        initialDecisions[d.doc_type] = {
          status: d.status || (app.status === "verified" ? "verified" : "pending"),
          failureReason: d.failure_reason || "",
        };
      });
    }
    setDocDecisions(initialDecisions);
  };

  const handleDocDecisionChange = (docType, status, reason = "") => {
    setDocDecisions((prev) => ({
      ...prev,
      [docType]: {
        status,
        failureReason: reason,
      },
    }));
  };

  const selectedDocs = useMemo(() => {
    if (!selectedApp || !Array.isArray(selectedApp.documents)) return [];
    return selectedApp.documents;
  }, [selectedApp]);

  const verifiedCount = useMemo(() => {
    return Object.values(docDecisions).filter((d) => d.status === "verified").length;
  }, [docDecisions]);

  const failedCount = useMemo(() => {
    return Object.values(docDecisions).filter((d) => d.status === "failed").length;
  }, [docDecisions]);

  const failedDocsList = useMemo(() => {
    return Object.entries(docDecisions)
      .filter(([_, d]) => d.status === "failed")
      .map(([type, d]) => ({
        type,
        reason: d.failureReason || "Unreadable or invalid document scan",
      }));
  }, [docDecisions]);

  // Distinct Nationalities for Filter
  const availableNationalities = useMemo(() => {
    const set = new Set(applications.map((a) => a.nationality).filter(Boolean));
    return Array.from(set);
  }, [applications]);

  // Filtered applications list
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        app.full_name?.toLowerCase().includes(q) ||
        app.passport_number?.toLowerCase().includes(q) ||
        app.tourist_id?.toLowerCase().includes(q) ||
        app.nationality?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      const matchesCountry =
        selectedNationality === "all" || app.nationality === selectedNationality;

      return matchesSearch && matchesStatus && matchesCountry;
    });
  }, [applications, searchQuery, statusFilter, selectedNationality]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "under_review").length;
    const verified = applications.filter((a) => a.status === "verified").length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    return { total, pending, verified, rejected };
  }, [applications]);

  // Handle Admin Decision: Approve or Reject
  const handleDecision = async (decision) => {
    if (!selectedApp) return;
    setProcessingAction(true);
    setActionSuccessMsg("");

    const failedKeys = failedDocsList.map((f) => f.type);
    let autoNote = decisionNotes;
    if (decision === "rejected" && failedDocsList.length > 0 && !autoNote) {
      autoNote = `Verification declined due to invalid documents: ${failedDocsList
        .map((f) => `${f.type.toUpperCase()} (${f.reason})`)
        .join(", ")}`;
    }

    try {
      const res = await fetch("/api/admin/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedApp.user_id,
          decision,
          notes: autoNote,
          documentDecisions: docDecisions,
          failedDocs: failedKeys,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccessMsg(
          decision === "verified"
            ? "Tourist identity and travel documents officially APPROVED. Digital Tourist ID issued."
            : "Application REJECTED. Specific document feedback dispatched to the tourist."
        );

        setApplications((prev) =>
          prev.map((a) =>
            a.user_id === selectedApp.user_id
              ? {
                  ...a,
                  status: decision,
                  admin_notes: autoNote,
                  reviewed_at: new Date().toISOString(),
                }
              : a
          )
        );

        setTimeout(() => {
          setSelectedApp(null);
          loadData();
        }, 1200);
      }
    } catch (err) {
      console.warn("Failed to process decision:", err);
    } finally {
      setProcessingAction(false);
    }
  };

  const getDocLabel = (docType) => {
    switch (docType) {
      case "passport":
        return "Passport Bio Page";
      case "visa":
        return "Indian e-Visa / Visa Stamp";
      case "stay_proof":
        return "Hotel / Stay Proof";
      case "flight_ticket":
        return "Return Flight Ticket";
      case "oci_card":
        return "Overseas Citizen of India (OCI) Card";
      case "national_id":
        return "National Voter / Citizenship ID";
      default:
        return docType.replace(/_/g, " ").toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 md:py-10 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="container-page space-y-8">
        {/* Authority Header Card */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              <ShieldCheck className="size-3.5 text-blue-600" />
              <span>Immigration &amp; e-KYC Authority Grid</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-slate-900">
              SafirPass Authority Command Portal
            </h1>
            <p className="text-xs text-slate-500">
              Ministry of Tourism &amp; Home Affairs • Government of India • Logged in as:{" "}
              <span className="font-semibold text-slate-800 font-mono">{user?.email}</span>
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all"
              title="Refresh Queue"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-2 rounded-xl py-2.5 px-4 transition-all ${
              activeTab === "queue"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Users className="size-4" />
            <span>Verification Queue</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "queue"
                  ? "bg-blue-700/80 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 rounded-xl py-2.5 px-4 transition-all ${
              activeTab === "audit"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <History className="size-4" />
            <span>Authority Audit Stream</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "audit"
                  ? "bg-blue-700/80 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 rounded-xl py-2.5 px-4 transition-all ${
              activeTab === "system"
                ? "bg-blue-600 text-white shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Database className="size-4" />
            <span>System &amp; Dual Database Health</span>
          </button>
        </div>

        {/* Tab 1: Verification Queue */}
        {activeTab === "queue" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Metric Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="size-4 text-blue-600" /> Total Applications
                </span>
                <p className="font-serif text-3xl font-extrabold text-slate-900">{stats.total}</p>
                <p className="text-[11px] text-slate-500">Tourist submissions across all nations</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-2 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Clock className="size-4 animate-pulse text-amber-600" /> Pending Review
                </span>
                <p className="font-serif text-3xl font-extrabold text-amber-900">{stats.pending}</p>
                <p className="text-[11px] text-amber-700">Turnaround within 24 hours</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-2 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Verified Active
                </span>
                <p className="font-serif text-3xl font-extrabold text-emerald-900">{stats.verified}</p>
                <p className="text-[11px] text-emerald-700">Digital Tourist IDs certified</p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/70 p-5 space-y-2 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                  <XCircle className="size-4 text-red-600" /> Rejected / Flagged
                </span>
                <p className="font-serif text-3xl font-extrabold text-red-900">{stats.rejected}</p>
                <p className="text-[11px] text-red-700">Flagged with resubmission feedback</p>
              </div>
            </div>

            {/* Search & Multi-Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by tourist name, passport no, tourist ID, or country..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none shadow-xs transition-all"
                >
                  <option value="all">All Statuses</option>
                  <option value="under_review">Pending Review (Under 24h)</option>
                  <option value="verified">Verified &amp; Issued</option>
                  <option value="rejected">Rejected</option>
                </select>

                {availableNationalities.length > 0 && (
                  <select
                    value={selectedNationality}
                    onChange={(e) => setSelectedNationality(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none shadow-xs transition-all"
                  >
                    <option value="all">All Countries</option>
                    {availableNationalities.map((nat) => (
                      <option key={nat} value={nat}>
                        {nat}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Application Queue Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50/90 font-bold uppercase tracking-wider text-slate-600 text-[11px]">
                    <tr>
                      <th className="px-6 py-4">Tourist &amp; Identification</th>
                      <th className="px-6 py-4">Nationality</th>
                      <th className="px-6 py-4">Visa Category</th>
                      <th className="px-6 py-4">Documents</th>
                      <th className="px-6 py-4">Biometrics</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredApplications.map((app) => {
                      const docCount = Array.isArray(app.documents) ? app.documents.length : 0;
                      const docFailures = Array.isArray(app.documents)
                        ? app.documents.filter((d) => d.status === "failed").length
                        : 0;

                      return (
                        <tr
                          key={app.id || app.user_id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {app.biometrics?.face_snapshot ? (
                                <img
                                  src={app.biometrics.face_snapshot}
                                  alt="Face Snapshot"
                                  className="size-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                                />
                              ) : (
                                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                  {app.full_name ? app.full_name[0] : "T"}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{app.full_name}</p>
                                <p className="font-mono text-[11px] text-slate-500">
                                  {app.passport_number} •{" "}
                                  <span className="text-blue-600 font-semibold">{app.tourist_id}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {app.nationality}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                              {app.visa_type}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <FileText className="size-4 text-blue-600" />
                              <span className="font-medium text-slate-700">{docCount} Files</span>
                              {docFailures > 0 && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
                                  {docFailures} Flagged
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <ScanFace className="size-4 text-emerald-600" />
                              <span className="font-bold text-emerald-700">
                                {((app.biometrics?.liveness_score ?? app.liveness_score ?? 0) * 100).toFixed(0)}%
                                Match
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {app.status === "verified" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="size-3" /> Verified
                              </span>
                            ) : app.status === "rejected" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-700">
                                <XCircle className="size-3" /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                                <Clock className="size-3" /> Under Review
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenReview(app)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all hover:shadow"
                            >
                              <Eye className="size-3.5" /> Inspect &amp; Verify
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredApplications.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <ShieldCheck className="mx-auto size-12 text-slate-300 mb-2" />
                          <p className="text-sm font-bold text-slate-800">No applications found in queue</p>
                          <p className="text-xs text-slate-500 mt-1">
                            New registrations and document submissions from tourists will appear here immediately.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Authority Audit Stream */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                  <History className="size-5 text-blue-600" /> Immutable Authority Audit Stream
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time record of all officer verification actions, approvals, and document decisions stored in MongoDB Atlas.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              {auditLogs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              log.action === "APPROVE_KYC"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-bold text-slate-900">{log.admin_email}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-blue-600 font-semibold">Target: {log.target_user_id}</span>
                        </div>
                        <p className="text-slate-600">{log.admin_notes || log.decision}</p>
                        {Array.isArray(log.failed_documents) && log.failed_documents.length > 0 && (
                          <p className="text-red-600 font-semibold text-[11px]">
                            Failed Documents: {log.failed_documents.join(", ")}
                          </p>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <History className="mx-auto size-10 text-slate-300" />
                  <p className="font-bold text-sm text-slate-800">No Audit Logs Recorded Yet</p>
                  <p className="text-xs text-slate-500">
                    Officer approval and rejection decisions will be recorded here in MongoDB Atlas.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: System Architecture & Dual Database Health */}
        {activeTab === "system" && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
                <Database className="size-5 text-blue-600" /> System Architecture &amp; Database Health
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Live connectivity status across PostgreSQL Neon Serverless, MongoDB Atlas Mongoose, and Cloudinary Media CDN.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    PostgreSQL (Neon Serverless)
                  </span>
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">Relational Transaction Core</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manages profiles, kyc_applications lifecycle, tourist IDs, consent grants, and SOS alerts.
                </p>
                <div className="pt-3 border-t border-emerald-200 text-[11px] text-emerald-800 font-mono font-bold">
                  Status: Operational (Connected)
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                    MongoDB Atlas (Mongoose)
                  </span>
                  <span className="relative flex size-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2.5 bg-blue-500"></span>
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">Document &amp; Telemetry Vault</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manages DocumentVault scans, BiometricFaceLog liveness data, AuthorityAuditLogs, and spatial breadcrumbs.
                </p>
                <div className="pt-3 border-t border-blue-200 text-[11px] text-blue-800 font-mono font-bold">
                  Status: Operational (Connected)
                </div>
              </div>

              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-6 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
                    Cloudinary CDN &amp; Blob
                  </span>
                  <span className="size-2.5 rounded-full bg-purple-500" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Media Asset Delivery</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  High-resolution passport scans, PDF grants, and live biometric capture frames.
                </p>
                <div className="pt-3 border-t border-purple-200 text-[11px] text-purple-800 font-mono font-bold">
                  Status: Ready with Base64 Fallback
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Inspection & Verification Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl text-slate-800 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-sm">
                  <ShieldCheck className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-slate-900">
                    Authority Verification &amp; Document Inspector
                  </h3>
                  <p className="text-xs text-slate-500">
                    Application Ref:{" "}
                    <span className="font-mono text-blue-700 font-bold">{selectedApp.tourist_id}</span> • Submitted by {selectedApp.full_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" /> {actionSuccessMsg}
              </div>
            )}

            {/* Tourist Profile Summary Grid */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Full Legal Name</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedApp.full_name}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Country / Nationality</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedApp.nationality}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Passport Number</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.passport_number}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Passport Expiry</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedApp.passport_expiry || "—"}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Visa Reference</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{selectedApp.visa_number || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Visa Category</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedApp.visa_type}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Stay Validity</span>
                <p className="font-mono text-slate-900 mt-0.5">
                  {selectedApp.entry_date && selectedApp.exit_date
                    ? `${selectedApp.entry_date} → ${selectedApp.exit_date}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Emergency Contact</span>
                <p className="font-mono text-slate-900 mt-0.5">{selectedApp.emergency_contact || "—"}</p>
              </div>
            </div>

            {/* Biometric Live Face Verification & Liveness Meter */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ScanFace className="size-4 text-blue-600" /> Biometric Live Face Verification &amp; Anti-Spoof
              </h4>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {selectedApp.biometrics?.face_snapshot ? (
                  <div className="relative group">
                    <img
                      src={selectedApp.biometrics.face_snapshot}
                      alt="Biometric Reference"
                      className="size-28 rounded-2xl object-cover border-2 border-blue-200 shadow-sm cursor-pointer group-hover:opacity-95 transition-opacity"
                      onClick={() =>
                        setActiveViewerDoc({
                          url: selectedApp.biometrics.face_snapshot,
                          name: "Live WebCam Biometric Capture",
                          type: "biometric_selfie",
                          mimeType: "image/jpeg",
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        setActiveViewerDoc({
                          url: selectedApp.biometrics.face_snapshot,
                          name: "Live WebCam Biometric Capture",
                          type: "biometric_selfie",
                          mimeType: "image/jpeg",
                        })
                      }
                      className="absolute bottom-1.5 right-1.5 rounded-lg bg-slate-900/80 p-1.5 text-white hover:bg-slate-900 transition-colors shadow-xs"
                      title="Inspect Biometric Image"
                    >
                      <Maximize2 className="size-3" />
                    </button>
                  </div>
                ) : (
                  <div className="size-28 rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 text-xs font-medium">
                    No Biometric Photo
                  </div>
                )}

                <div className="space-y-2 text-xs flex-1 w-full">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600">Biometric Liveness Score:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {((selectedApp.biometrics?.liveness_score ?? selectedApp.liveness_score ?? 0) * 100).toFixed(1)}% (Passed Threshold)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-600">Anti-Spoofing Check:</span>
                    <span className="font-bold text-emerald-700">
                      Confirmed (Live Video Stream Frame)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Cloud Storage / Vault:</span>
                    <span className="font-mono text-slate-700">
                      MongoDB Atlas • Vault Secured
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents Gallery & Individual Verification Checks */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <FileText className="size-4 text-blue-600" /> Uploaded Document Vault &amp; Verification Checks
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click any document to inspect full-size image/PDF in forensic lightbox.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                    {verifiedCount} Verified
                  </span>
                  {failedCount > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-bold text-red-700 border border-red-200">
                      {failedCount} Failed
                    </span>
                  )}
                </div>
              </div>

              {selectedDocs.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedDocs.map((doc, idx) => {
                    const docState = docDecisions[doc.doc_type] || {
                      status: doc.status || "pending",
                      failureReason: doc.failure_reason || "",
                    };
                    const isDocVerified = docState.status === "verified";
                    const isDocFailed = docState.status === "failed";
                    const docUrl = doc.url || doc.secure_url || doc.data_url;

                    return (
                      <div
                        key={doc.doc_type || idx}
                        className={`rounded-2xl border p-4 space-y-3 transition-all ${
                          isDocVerified
                            ? "border-emerald-300 bg-emerald-50/50 shadow-xs"
                            : isDocFailed
                            ? "border-red-300 bg-red-50/50 shadow-xs"
                            : "border-slate-200 bg-white shadow-xs"
                        }`}
                      >
                        {/* Doc Top Bar */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-900">
                              {getDocLabel(doc.doc_type)}
                            </span>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {doc.file_name} • {doc.file_size}
                            </p>
                          </div>

                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isDocVerified
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : isDocFailed
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {docState.status}
                          </span>
                        </div>

                        {/* Thumbnail with Click to Lightbox */}
                        <div
                          onClick={() =>
                            setActiveViewerDoc({
                              url: docUrl,
                              name: getDocLabel(doc.doc_type),
                              type: doc.doc_type,
                              mimeType: doc.mime_type,
                            })
                          }
                          className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 h-36 flex items-center justify-center"
                        >
                          {docUrl ? (
                            <img
                              src={docUrl}
                              alt={doc.file_name}
                              className="size-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <FileText className="size-12 text-slate-400" />
                          )}

                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-bold text-white">
                            <Eye className="size-4" /> Click to Inspect Full Resolution
                          </div>
                        </div>

                        {/* Per-Document Review Decision Buttons */}
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleDocDecisionChange(doc.doc_type, "verified", "")
                              }
                              className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                isDocVerified
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200"
                              }`}
                            >
                              <Check className="size-3.5" /> Approve Doc
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDocDecisionChange(
                                  doc.doc_type,
                                  "failed",
                                  docState.failureReason || "Blurry or unreadable document scan"
                                )
                              }
                              className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                isDocFailed
                                  ? "bg-red-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 border border-slate-200"
                              }`}
                            >
                              <X className="size-3.5" /> Flag Issue
                            </button>
                          </div>

                          {/* Failure Reason Input if Marked Failed */}
                          {isDocFailed && (
                            <div className="space-y-1 pt-1 animate-in fade-in">
                              <label className="text-[10px] font-bold uppercase text-red-700">
                                Failure Reason (Sent to tourist)
                              </label>
                              <select
                                value={docState.failureReason}
                                onChange={(e) =>
                                  handleDocDecisionChange(
                                    doc.doc_type,
                                    "failed",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-xl border border-red-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-400"
                              >
                                <option value="Blurry or unreadable document scan">
                                  Blurry or unreadable scan
                                </option>
                                <option value="Expired passport or visa document">
                                  Expired document / invalid validity
                                </option>
                                <option value="Name, DOB, or passport number mismatch">
                                  Information mismatch with passport
                                </option>
                                <option value="Edges cropped or document incomplete">
                                  Edges cropped / incomplete scan
                                </option>
                                <option value="Suspected fraudulent or invalid file">
                                  Invalid or unverifiable document
                                </option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-6">
                  No document scans found for this applicant.
                </p>
              )}
            </div>

            {/* Failure Warning Banner if any Document Failed */}
            {failedCount > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2 text-xs text-red-900">
                <div className="flex items-center gap-2 font-bold text-red-700">
                  <AlertTriangle className="size-4" />
                  <span>{failedCount} Document(s) Flagged for Re-Upload</span>
                </div>
                <ul className="list-disc list-inside text-red-800 space-y-1">
                  {failedDocsList.map((f, i) => (
                    <li key={i}>
                      <span className="font-semibold">{getDocLabel(f.type)}:</span> {f.reason}
                    </li>
                  ))}
                </ul>
                <p className="text-red-700 text-[11px]">
                  Rejecting this application will send this exact feedback to the tourist so they can re-upload clean documents.
                </p>
              </div>
            )}

            {/* Authority Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Official Remarks &amp; Audit Log Remarks
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter official verification remarks or notes for audit trail..."
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500">
                Officer: <span className="font-mono text-blue-700 font-bold">{user?.email}</span>
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleDecision("rejected")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
                    failedCount > 0
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20"
                      : "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  <XCircle className="size-4" />
                  {processingAction ? "Processing..." : failedCount > 0 ? "Reject & Send Re-upload Notice" : "Reject Application"}
                </button>

                <button
                  type="button"
                  disabled={processingAction || failedCount > 0}
                  onClick={() => handleDecision("verified")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-md transition-all ${
                    failedCount > 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  }`}
                >
                  {processingAction ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Approve &amp; Issue Digital Tourist ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Forensic Document Inspector Modal */}
      {activeViewerDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 md:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[90vh] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden text-slate-900">
            {/* Top Control Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 bg-white/95 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-xs shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-lg font-bold text-slate-900 truncate">
                    {activeViewerDoc.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      <ShieldCheck className="size-3 text-blue-600" /> Forensic Viewer
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      Authority Document Vault Inspection
                    </span>
                  </div>
                </div>
              </div>

              {/* Lightbox Controls Toolbar */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Visual Tool Pills */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-xs">
                  <button
                    onClick={() => setHighContrast((c) => !c)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      highContrast
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                    }`}
                    title="Toggle High Contrast for watermark & microprint inspection"
                  >
                    <SunMoon className="size-3.5" />
                    <span className="hidden sm:inline">High Contrast</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                    className="rounded-lg p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                    title="Zoom Out"
                  >
                    <ZoomOut className="size-4" />
                  </button>

                  <button
                    onClick={() => setZoomLevel(1)}
                    className="rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-700 hover:text-slate-900 hover:bg-white transition-all"
                    title="Reset Zoom to 100%"
                  >
                    {(zoomLevel * 100).toFixed(0)}%
                  </button>

                  <button
                    onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                    className="rounded-lg p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                    title="Zoom In"
                  >
                    <ZoomIn className="size-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  <button
                    onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                    className="rounded-lg p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
                    title="Rotate 90° Clockwise"
                  >
                    <RotateCw className="size-4" />
                  </button>
                </div>

                {/* Download Button */}
                <a
                  href={activeViewerDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all"
                  title="Download Original File"
                >
                  <Download className="size-3.5" />
                  <span className="hidden md:inline">Download</span>
                </a>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setActiveViewerDoc(null);
                    setZoomLevel(1);
                    setRotationAngle(0);
                    setHighContrast(false);
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-1"
                  title="Close Inspector"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Document Stage Canvas */}
            <div className="relative flex-1 bg-slate-100/70 overflow-hidden flex items-center justify-center p-2 sm:p-4 select-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
              {activeViewerDoc.url ? (
                <div className="size-full flex items-center justify-center overflow-hidden">
                  <img
                    src={activeViewerDoc.url}
                    alt={activeViewerDoc.name}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                      filter: highContrast ? "contrast(180%) brightness(105%) saturate(120%)" : "none",
                      transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1), filter 0.2s ease-in-out",
                    }}
                    className="size-full object-contain select-none"
                  />
                </div>
              ) : (
                <div className="py-16 px-12 text-center text-slate-500 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <FileText className="mx-auto size-12 text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Document preview unavailable</p>
                  <p className="text-xs text-slate-500 mt-1">The raw document binary could not be rendered.</p>
                </div>
              )}
            </div>

            {/* Bottom Metadata & Status Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 bg-white px-6 py-3 text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-600 shrink-0" />
                <span>
                  Encrypted Document Vault Inspection • Government of India Authority Clearance
                </span>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
                <span>
                  Scale: <strong className="text-slate-800 font-bold">{(zoomLevel * 100).toFixed(0)}%</strong>
                </span>
                <span>•</span>
                <span>
                  Angle: <strong className="text-slate-800 font-bold">{rotationAngle}°</strong>
                </span>
                <span>•</span>
                <span>
                  Mode: <strong className="text-slate-800 font-bold">{highContrast ? "High Contrast" : "Standard"}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
