import { NextResponse } from "next/server";
import { getDocumentDatasetStats, triggerModelTraining } from "@/lib/fastapi";
import { getSession } from "@/lib/jwt";

export async function GET(request) {
  try {
    const stats = await getDocumentDatasetStats();
    if (!stats.ok) {
      return NextResponse.json(
        { error: stats.error || "Failed to fetch dataset stats." },
        { status: stats.status || 500 }
      );
    }
    return NextResponse.json(stats.data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to query dataset stats." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    // Allow admin or authenticated caller
    const trainResult = await triggerModelTraining();
    if (!trainResult.ok) {
      return NextResponse.json(
        { error: trainResult.error || "Failed to trigger model training." },
        { status: trainResult.status || 500 }
      );
    }
    return NextResponse.json(trainResult.data);
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Model training execution failed." },
      { status: 500 }
    );
  }
}
