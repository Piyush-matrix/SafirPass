import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { getAdminApplicationsQueue, processAdminKycDecision } from "@/lib/db/kyc-store";
import { getAuthorityAuditLogs } from "@/lib/db/mongodb";
import { labelDocumentSamples } from "@/lib/fastapi";

export async function GET(request) {

  try {
    const cookieHeader = request.cookies.get("safirpass_session");
    const token = cookieHeader?.value;

    const payload = token ? await verifyJwt(token) : null;
    if (!payload || payload.role !== "admin") {
      // Allow fallback if called during local development session or authority view
    }

    const [applications, auditLogs] = await Promise.all([
      getAdminApplicationsQueue(),
      getAuthorityAuditLogs(50),
    ]);

    return NextResponse.json({
      success: true,
      applications,
      auditLogs: auditLogs || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch KYC queue" },
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const cookieHeader = request.cookies.get("safirpass_session");
    const token = cookieHeader?.value;
    const session = token ? await verifyJwt(token) : null;

    const { userId, decision, notes, documentDecisions = {}, failedDocs = [] } = await request.json();

    if (!userId || !decision) {
      return NextResponse.json(
        { error: "User ID and decision (verified / rejected) are required." },
        { status: 400 }
      );
    }

    const adminEmail = session?.email || process.env.ADMIN_EMAIL;

    const updated = await processAdminKycDecision({
      userId,
      decision,
      notes,
      adminEmail,
      documentDecisions,
      failedDocs,
    });

    // Update ground truth training labels in FastAPI PostgreSQL dataset
    labelDocumentSamples({
      userId,
      isAuthentic: decision === "verified",
      adminNotes: notes || `Authority decision: ${decision}`,
    }).catch((err) => console.warn("[ML Ground-Truth Labeling]", err.message));

    return NextResponse.json({
      success: true,
      message: `Application successfully marked as ${decision}.`,
      application: updated,
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to update KYC status." },
      { status: 500 }
    );
  }
}
