import { NextResponse } from "next/server";
import { queryFastApiAssistant } from "@/lib/fastapi";
import { getSession } from "@/lib/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, language } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "A message string is required." },
        { status: 400 }
      );
    }

    const result = await queryFastApiAssistant({
      message: message.trim(),
      language: language || "en",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to reach Safety Assistant." },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result.data,
    });
  } catch (err) {
    console.error("[Assistant Route Error]:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error querying assistant." },
      { status: 500 }
    );
  }
}
