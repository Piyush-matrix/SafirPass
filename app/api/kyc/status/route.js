import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { getUnifiedTouristKyc } from "@/lib/db/kyc-store";

export async function GET(request) {
  try {
    const cookieHeader = request.cookies.get("safirpass_session");
    const token = cookieHeader?.value;
    const session = token ? await verifyJwt(token) : null;

    if (!session || !session.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId =
      session.role === "admin" && searchParams.get("userId")
        ? searchParams.get("userId")
        : session.id;


    const unifiedKyc = await getUnifiedTouristKyc(requestedUserId);

    return NextResponse.json({ success: true, kyc: unifiedKyc });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch KYC status." },
      { status: 500 }
    );
  }
}
