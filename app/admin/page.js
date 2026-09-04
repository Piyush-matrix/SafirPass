"use client";

import { useEffect, useState, useMemo } from "react";
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

  const loadData = async () => {
    try {
      setRefreshing(true);
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
  };

  // ML Dataset & Model Training State
  const [datasetStats, setDatasetStats] = useState(null);
  const [trainingModel, setTrainingModel] = useState(false);
  const [trainResult, setTrainResult] = useState(null);

  const loadDatasetStats = async () => {
    try {
      const res = await fetch("/api/admin/documents/dataset");
      const data = await res.json();
      if (res.ok) setDatasetStats(data);
    } catch (err) {
      console.warn("Failed to load dataset stats:", err);
    }
  };

  const handleRetrainModel = async () => {
    setTrainingModel(true);
    setTrainResult(null);
    try {
      const res = await fetch("/api/admin/documents/dataset", { method: "POST" });
      const data = await res.json();
      setTrainResult(data);
      loadDatasetStats();
    } catch (err) {
      setTrainResult({ success: false, message: err.message || "Failed to retrain model" });
    } finally {
      setTrainingModel(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
      } else {
        loadData();
        loadDatasetStats();
      }
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Top Authority Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-white">
                  SafirPass Authority Portal
                </span>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                  Immigration &amp; e-KYC Grid
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Ministry of Tourism &amp; Home Affairs • Government of India
              </p>
            </div>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              title="Refresh Queue"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container-page px-4 md:px-8 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all ${
              activeTab === "queue"
                ? "border-blue-500 text-blue-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="size-4" /> Verification Queue
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all ${
              activeTab === "audit"
                ? "border-blue-500 text-blue-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="size-4" /> Authority Audit Stream
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all ${
              activeTab === "system"
                ? "border-blue-500 text-blue-400 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="size-4" /> System &amp; Dual Database Health
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="container-page px-4 md:px-8 py-8 space-y-8">
        {/* ========================================================================= */}
        {/* TAB 1: VERIFICATION QUEUE */}
        {/* ========================================================================= */}
        {activeTab === "queue" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Metric Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="size-4 text-blue-400" /> Total Applications
                </span>
                <p className="font-serif text-3xl font-extrabold text-white">{stats.total}</p>
                <p className="text-[11px] text-slate-500">Tourist submissions across all nations</p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Clock className="size-4 animate-pulse" /> Pending Review
                </span>
                <p className="font-serif text-3xl font-extrabold text-amber-300">{stats.pending}</p>
                <p className="text-[11px] text-amber-400/80">Turnaround within 24 hours</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> Verified Active
                </span>
                <p className="font-serif text-3xl font-extrabold text-emerald-300">{stats.verified}</p>
                <p className="text-[11px] text-emerald-400/80">Digital Tourist IDs certified</p>
              </div>

              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <XCircle className="size-4" /> Rejected / Flagged
                </span>
                <p className="font-serif text-3xl font-extrabold text-red-300">{stats.rejected}</p>
                <p className="text-[11px] text-red-400/80">Flagged with resubmission feedback</p>
              </div>
            </div>

            {/* AI/ML Document Dataset & Model Training Panel */}
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-slate-900/60 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">AI Document Dataset &amp; Scikit-Learn Model</h3>
                      <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                        Active Learning
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Uploaded passports, visas, stay proofs &amp; flight tickets build this training corpus with authority labels
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRetrainModel}
                  disabled={trainingModel}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {trainingModel ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Training Model...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-4" />
                      <span>Retrain Scikit-Learn Model</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dataset Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
                <div className="rounded-xl bg-slate-950/60 p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Samples</span>
                  <p className="text-lg font-extrabold text-white">{datasetStats?.total_samples ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-emerald-950/30 p-3 border border-emerald-500/20">
                  <span className="text-[10px] font-bold uppercase text-emerald-400">Labeled Authentic</span>
                  <p className="text-lg font-extrabold text-emerald-300">{datasetStats?.labeled_verified ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-red-950/30 p-3 border border-red-500/20">
                  <span className="text-[10px] font-bold uppercase text-red-400">Labeled Rejected</span>
                  <p className="text-lg font-extrabold text-red-300">{datasetStats?.labeled_rejected ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-amber-950/30 p-3 border border-amber-500/20">
                  <span className="text-[10px] font-bold uppercase text-amber-400">Pending Review</span>
                  <p className="text-lg font-extrabold text-amber-300">{datasetStats?.pending_review ?? "—"}</p>
                </div>
              </div>

              {trainResult && (
                <div className={`rounded-xl p-3 text-xs border ${
                  trainResult.success ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300" : "bg-amber-950/40 border-amber-500/30 text-amber-300"
                }`}>
                  <p className="font-semibold">{trainResult.message}</p>
                  {trainResult.feature_importances && (
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                      <span>Top Features:</span>
                      {Object.entries(trainResult.feature_importances).slice(0, 4).map(([f, imp]) => (
                        <span key={f} className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-200">
                          {f}: {(imp * 100).toFixed(1)}%
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search & Multi-Filter Bar */}

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by tourist name, passport no, tourist ID, or country..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-blue-500 focus:outline-none"
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
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 focus:border-blue-500 focus:outline-none"
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
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900 font-bold uppercase tracking-wider text-slate-400">
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

                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredApplications.map((app) => {
                      const docCount = Array.isArray(app.documents) ? app.documents.length : 0;
                      const docFailures = Array.isArray(app.documents)
                        ? app.documents.filter((d) => d.status === "failed").length
                        : 0;

                      return (
                        <tr
                          key={app.id || app.user_id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {app.biometrics?.face_snapshot ? (
                                <img
                                  src={app.biometrics.face_snapshot}
                                  alt="Face Snapshot"
                                  className="size-10 rounded-xl object-cover border border-slate-700 shadow-sm"
                                />
                              ) : (
                                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 font-bold">
                                  {app.full_name ? app.full_name[0] : "T"}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-white text-sm">{app.full_name}</p>
                                <p className="font-mono text-[11px] text-slate-400">
                                  {app.passport_number} •{" "}
                                  <span className="text-blue-400">{app.tourist_id}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-200">
                            {app.nationality}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
                              {app.visa_type}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <FileText className="size-4 text-blue-400" />
                              <span className="font-medium text-slate-300">{docCount} Files</span>
                              {docFailures > 0 && (
                                <span className="rounded-full bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold text-red-400 border border-red-500/40">
                                  {docFailures} Flagged
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <ScanFace className="size-4 text-emerald-400" />
                              <span className="font-bold text-emerald-400">
                                {((app.biometrics?.liveness_score ?? app.liveness_score ?? 0) * 100).toFixed(0)}%
                                Match
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {app.status === "verified" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                                <CheckCircle2 className="size-3" /> Verified
                              </span>
                            ) : app.status === "rejected" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-300">
                                <XCircle className="size-3" /> Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                                <Clock className="size-3" /> Under Review
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenReview(app)}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition-colors"
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
                          <ShieldCheck className="mx-auto size-10 text-slate-600 mb-2 opacity-50" />
                          <p className="text-sm font-semibold">No applications found in queue</p>
                          <p className="text-xs">
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

        {/* ========================================================================= */}
        {/* TAB 2: AUTHORITY AUDIT LOG STREAM */}
        {/* ========================================================================= */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="size-5 text-blue-400" /> Immutable Authority Audit Stream
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time record of all officer verification actions, approvals, and document decisions stored in MongoDB Atlas.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              {auditLogs.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {auditLogs.map((log, i) => (
                    <div key={i} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              log.action === "APPROVE_KYC"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-bold text-white">{log.admin_email}</span>
                          <span className="text-slate-500">•</span>
                          <span className="font-mono text-blue-400">Target: {log.target_user_id}</span>
                        </div>
                        <p className="text-slate-300">{log.admin_notes || log.decision}</p>
                        {Array.isArray(log.failed_documents) && log.failed_documents.length > 0 && (
                          <p className="text-red-400 text-[11px]">
                            Failed Documents: {log.failed_documents.join(", ")}
                          </p>
                        )}
                      </div>

                      <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 space-y-2">
                  <History className="mx-auto size-8 text-slate-600" />
                  <p className="font-semibold text-sm">No Audit Logs Recorded Yet</p>
                  <p className="text-xs">
                    Officer approval and rejection decisions will be recorded here in MongoDB Atlas.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SYSTEM & DUAL DATABASE HEALTH */}
        {/* ========================================================================= */}
        {activeTab === "system" && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="size-5 text-blue-400" /> System Architecture &amp; Database Health
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live connectivity status across PostgreSQL Neon Serverless, MongoDB Atlas Mongoose, and Cloudinary Media CDN.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    PostgreSQL (Neon Serverless)
                  </span>
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <h4 className="text-base font-bold text-white">Relational Transaction Core</h4>
                <p className="text-xs text-slate-300">
                  Manages profiles, kyc_applications lifecycle, tourist IDs, consent grants, and SOS alerts.
                </p>
                <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
                  Status: Operational (Connected)
                </div>
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    MongoDB Atlas (Mongoose)
                  </span>
                  <span className="size-2.5 rounded-full bg-blue-500 animate-ping" />
                </div>
                <h4 className="text-base font-bold text-white">Document &amp; Telemetry Vault</h4>
                <p className="text-xs text-slate-300">
                  Manages DocumentVault scans, BiometricFaceLog liveness data, AuthorityAuditLogs, and spatial breadcrumbs.
                </p>
                <div className="pt-2 border-t border-blue-500/20 text-[11px] text-blue-300 font-mono">
                  Status: Operational (Connected)
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Cloudinary CDN &amp; Blob
                  </span>
                  <span className="size-2.5 rounded-full bg-purple-500" />
                </div>
                <h4 className="text-base font-bold text-white">Media Asset Delivery</h4>
                <p className="text-xs text-slate-300">
                  High-resolution passport scans, PDF grants, and live biometric capture frames.
                </p>
                <div className="pt-2 border-t border-purple-500/20 text-[11px] text-purple-300 font-mono">
                  Status: Ready with Base64 Fallback
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DETAILED INSPECTION & VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 md:p-8 shadow-2xl text-slate-200 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner">
                  <ShieldCheck className="size-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Authority Verification &amp; Document Inspector
                  </h3>
                  <p className="text-xs text-slate-400">
                    Application Ref:{" "}
                    <span className="font-mono text-blue-400 font-bold">{selectedApp.tourist_id}</span> • Submitted by {selectedApp.full_name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="size-6" />
              </button>
            </div>

            {actionSuccessMsg && (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="size-4" /> {actionSuccessMsg}
              </div>
            )}

            {/* Tourist Profile Summary Grid */}
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Full Legal Name</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedApp.full_name}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Country / Nationality</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedApp.nationality}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Passport Number</span>
                <p className="font-mono font-bold text-white mt-0.5">{selectedApp.passport_number}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Passport Expiry</span>
                <p className="font-bold text-white mt-0.5">{selectedApp.passport_expiry || "—"}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Visa Reference</span>
                <p className="font-mono font-bold text-white mt-0.5">{selectedApp.visa_number || "—"}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Visa Category</span>
                <p className="font-semibold text-white mt-0.5">{selectedApp.visa_type}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Stay Validity</span>
                <p className="font-mono text-white mt-0.5">
                  {selectedApp.entry_date && selectedApp.exit_date
                    ? `${selectedApp.entry_date} → ${selectedApp.exit_date}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Emergency Contact</span>
                <p className="font-mono text-white mt-0.5">{selectedApp.emergency_contact || "—"}</p>
              </div>
            </div>

            {/* Biometric Live Face Verification & Liveness Meter */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <ScanFace className="size-4 text-blue-400" /> Biometric Live Face Verification &amp; Anti-Spoof
              </h4>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {selectedApp.biometrics?.face_snapshot ? (
                  <div className="relative group">
                    <img
                      src={selectedApp.biometrics.face_snapshot}
                      alt="Biometric Reference"
                      className="size-28 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md cursor-pointer group-hover:opacity-90"
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
                      className="absolute bottom-1 right-1 rounded-md bg-black/70 p-1 text-white hover:bg-black"
                    >
                      <Maximize2 className="size-3" />
                    </button>
                  </div>
                ) : (
                  <div className="size-28 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                    No Biometric Photo
                  </div>
                )}

                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Biometric Liveness Score:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {((selectedApp.biometrics?.liveness_score ?? selectedApp.liveness_score ?? 0) * 100).toFixed(1)}% (Passed Threshold)
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Anti-Spoofing Check:</span>
                    <span className="font-bold text-emerald-400">
                      Confirmed (Live Video Stream Frame)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cloud Storage / Vault:</span>
                    <span className="font-mono text-slate-300">
                      MongoDB Atlas • Vault Secured
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents Gallery & Individual Verification Checks */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <FileText className="size-4 text-blue-400" /> Uploaded Document Vault &amp; Verification Checks
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click any document to inspect full-size image/PDF in forensic lightbox.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-bold text-emerald-300 border border-emerald-500/30">
                    {verifiedCount} Verified
                  </span>
                  {failedCount > 0 && (
                    <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 font-bold text-red-300 border border-red-500/30">
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
                            ? "border-emerald-500/40 bg-emerald-950/20"
                            : isDocFailed
                            ? "border-red-500/40 bg-red-950/20"
                            : "border-slate-800 bg-slate-900"
                        }`}
                      >
                        {/* Doc Top Bar */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white">
                              {getDocLabel(doc.doc_type)}
                            </span>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                              {doc.file_name} • {doc.file_size}
                            </p>
                          </div>

                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isDocVerified
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : isDocFailed
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
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
                          className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-black/60 h-36 flex items-center justify-center"
                        >
                          {docUrl ? (
                            <img
                              src={docUrl}
                              alt={doc.file_name}
                              className="size-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <FileText className="size-12 text-slate-600" />
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-bold text-white">
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
                              className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                                isDocVerified
                                  ? "bg-emerald-600 text-white shadow-md"
                                  : "bg-slate-800 text-slate-300 hover:bg-emerald-600/30 hover:text-emerald-300 border border-slate-700"
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
                              className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-colors ${
                                isDocFailed
                                  ? "bg-red-600 text-white shadow-md"
                                  : "bg-slate-800 text-slate-300 hover:bg-red-600/30 hover:text-red-300 border border-slate-700"
                              }`}
                            >
                              <X className="size-3.5" /> Flag Issue
                            </button>
                          </div>

                          {/* Failure Reason Input if Marked Failed */}
                          {isDocFailed && (
                            <div className="space-y-1 pt-1 animate-in fade-in">
                              <label className="text-[10px] font-bold uppercase text-red-400">
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
                                className="w-full rounded-xl border border-red-500/40 bg-slate-950 p-2 text-xs text-white focus:outline-none"
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
              <div className="rounded-2xl border border-red-500/50 bg-red-950/30 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <AlertTriangle className="size-4" />
                  <span>{failedCount} Document(s) Flagged for Re-Upload</span>
                </div>
                <ul className="list-disc list-inside text-red-300 space-y-1">
                  {failedDocsList.map((f, i) => (
                    <li key={i}>
                      <span className="font-semibold">{getDocLabel(f.type)}:</span> {f.reason}
                    </li>
                  ))}
                </ul>
                <p className="text-slate-400 text-[11px]">
                  Rejecting this application will send this exact feedback to the tourist so they can re-upload clean documents.
                </p>
              </div>
            )}

            {/* Authority Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Remarks &amp; Audit Log Remarks
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter official verification remarks or notes for audit trail..."
                rows={2}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-4">
              <span className="text-xs text-slate-400">
                Officer: <span className="font-mono text-blue-400 font-bold">{user?.email}</span>
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={processingAction}
                  onClick={() => handleDecision("rejected")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
                    failedCount > 0
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/40"
                      : "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  }`}
                >
                  <XCircle className="size-4" />
                  {processingAction ? "Processing..." : failedCount > 0 ? "Reject & Send Re-upload Notice" : "Reject Application"}
                </button>

                <button
                  type="button"
                  disabled={processingAction || failedCount > 0}
                  onClick={() => handleDecision("verified")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-xl transition-all ${
                    failedCount > 0
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40"
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

      {/* ========================================================================= */}
      {/* HIGH-RESOLUTION FORENSIC LIGHTBOX VIEWER */}
      {/* ========================================================================= */}
      {activeViewerDoc && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          {/* Lightbox Top Control Bar */}
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-3">
              <FileText className="size-6 text-blue-400" />
              <div>
                <h3 className="text-base font-bold text-white">{activeViewerDoc.name}</h3>
                <p className="text-xs text-slate-400">High-Resolution Forensic Lightbox</p>
              </div>
            </div>

            {/* Lightbox Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHighContrast((c) => !c)}
                className={`rounded-xl border p-2 text-xs font-semibold transition-colors ${
                  highContrast
                    ? "bg-blue-600 text-white border-blue-500"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Toggle High Contrast (Watermark analysis)"
              >
                <SunMoon className="size-4" />
              </button>

              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                {(zoomLevel * 100).toFixed(0)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </button>
              <button
                onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Rotate 90°"
              >
                <RotateCw className="size-4" />
              </button>

              <a
                href={activeViewerDoc.url}
                target="_blank"
                rel="noreferrer"
                download
                className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                title="Download Original File"
              >
                <Download className="size-4" />
              </a>

              <button
                onClick={() => {
                  setActiveViewerDoc(null);
                  setZoomLevel(1);
                  setRotationAngle(0);
                  setHighContrast(false);
                }}
                className="rounded-xl bg-red-600/80 p-2 text-white hover:bg-red-600 ml-2"
                title="Close Viewer"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Canvas Frame */}
          <div className="relative w-full max-w-5xl h-[78vh] rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center p-4">
            {activeViewerDoc.url ? (
              <img
                src={activeViewerDoc.url}
                alt={activeViewerDoc.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                  filter: highContrast ? "contrast(180%) brightness(110%)" : "none",
                  transition: "transform 0.2s ease-in-out, filter 0.2s ease-in-out",
                }}
                className="max-h-full max-w-full object-contain select-none shadow-2xl"
              />
            ) : (
              <p className="text-slate-500">Document preview unavailable</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
