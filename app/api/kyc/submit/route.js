import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { toValidUuid } from "@/lib/uuid";
import { submitTouristKyc } from "@/lib/db/kyc-store";

export async function POST(request) {
  try {
    const cookieHeader = request.cookies.get("safirpass_session");
    const token = cookieHeader?.value;
    const session = token ? await verifyJwt(token) : null;

    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit e-KYC." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile, documents, biometrics } = body;

    if (!profile?.full_name || !profile?.passport_number) {
      return NextResponse.json(
        { error: "Full name and Passport number are required." },
        { status: 400 }
      );
    }

    const userId = session.id;


    const result = await submitTouristKyc({
      userId,
      profile: {
        ...profile,
        email: profile.email || session?.email || "",
      },
      documents: documents || {},
      biometrics: biometrics || {},
    });


    return NextResponse.json(result);
  } catch (err) {
    console.error("KYC Submission error:", err);
    return NextResponse.json(
      { error: err.message || "KYC submission failed." },
      { status: 500 }
    );
  }
}
