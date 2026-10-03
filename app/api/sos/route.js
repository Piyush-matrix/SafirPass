import { NextResponse } from "next/server";
import {
  createSosAlert,
  getSosAlertsByUserId,
  getAllActiveSosAlerts,
  updateSosAlertStatus,
} from "@/lib/db/postgres";
import { getSession } from "@/lib/jwt";
import { toValidUuid } from "@/lib/uuid";
import { syncSosToFastApi } from "@/lib/fastapi";


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const session = await getSession(request);

    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    if (mode === "all" || session.role === "admin") {
      if (session.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden. Administrative access required for incident overview." },
          { status: 403 }
        );
      }
      const alerts = await getAllActiveSosAlerts();
      return NextResponse.json({ success: true, alerts });
    }

    const alerts = await getSosAlertsByUserId(session.id);
    return NextResponse.json({ success: true, alerts });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch SOS alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    const body = await request.json();

    const userId = session?.id ? toValidUuid(session.id) : toValidUuid(body.user_id || "anonymous");
    const alert = await createSosAlert({
      user_id: userId,
      category: body.category || "general",
      latitude: body.latitude,
      longitude: body.longitude,
      address_text: body.address_text || "India",
      notes: body.notes || "",
      responder: body.responder || "112 Central Command",
      reference: body.reference,
      status: "active",
    });

    // Asynchronously synchronize emergency alert with FastAPI for AWS SNS and anomaly detection
    syncSosToFastApi({
      userId,
      latitude: body.latitude,
      longitude: body.longitude,
      notes: body.notes,
      phone: body.phone || null,
    }).catch((err) => console.warn("[FastAPI SOS Dispatch]", err));

    return NextResponse.json({ success: true, alert, syncedToFastApi: true });

  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to submit SOS alert" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession(request);
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Emergency responder dispatch permissions required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, responder } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const updated = await updateSosAlertStatus(id, status, responder);
    return NextResponse.json({ success: true, alert: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to update alert status" },
      { status: 500 }
    );
  }
}
