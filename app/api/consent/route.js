import { NextResponse } from "next/server";
import {
  createConsentRequest,
  getConsentRequestsByUserId,
  updateConsentRequestStatus,
} from "@/lib/db/postgres";
import { getSession } from "@/lib/jwt";
import { toValidUuid } from "@/lib/uuid";

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const requests = await getConsentRequestsByUserId(session.id);
    return NextResponse.json({ success: true, requests });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch consent requests" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const userId = toValidUuid(session.id);
    const consent = await createConsentRequest({
      user_id: userId,
      requester: body.requester || "Authority / Hotel Desk",
      requester_type: body.requester_type || "hotel",
      attributes: body.attributes || [],
      shared_attributes: body.shared_attributes || [],
      status: "pending",
    });

    return NextResponse.json({ success: true, request: consent });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to create consent request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession(request);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, shared_attributes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status required" }, { status: 400 });
    }

    const updated = await updateConsentRequestStatus(id, status, shared_attributes || []);
    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to update consent status" },
      { status: 500 }
    );
  }
}
