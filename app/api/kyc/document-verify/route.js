import { NextResponse } from "next/server";
import { verifyDocumentWithMl } from "@/lib/fastapi";

export async function POST(request) {
  try {
    const body = await request.json();
    const { docType, imageBase64 } = body;

    if (!docType || !imageBase64) {
      return NextResponse.json(
        { error: "docType and imageBase64 are required." },
        { status: 400 }
      );
    }

    const result = await verifyDocumentWithMl({ docType, imageBase64 });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Document ML evaluation service error." },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result.data,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to verify document with ML." },
      { status: 500 }
    );
  }
}
