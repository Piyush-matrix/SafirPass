import { NextResponse } from "next/server";
import { matchFastApiFace } from "@/lib/fastapi";
import { getSession } from "@/lib/jwt";

export async function POST(request) {
  try {
    const session = await getSession(request);
    const body = await request.json();

    const documentImage = body.document_image_base64 || body.documentImage || body.document;
    const selfieImage = body.selfie_image_base64 || body.selfieImage || body.selfie;

    if (!documentImage || !selfieImage) {
      return NextResponse.json(
        { error: "Both document image and selfie image are required for biometric verification." },
        { status: 400 }
      );
    }

    const result = await matchFastApiFace({
      documentImageBase64: documentImage,
      selfieImageBase64: selfieImage,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "Biometric face match failed in backend.",
          details: result.data,
        },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result.data,
    });
  } catch (err) {
    console.error("[KYC Face Match Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute biometric face match." },
      { status: 500 }
    );
  }
}
