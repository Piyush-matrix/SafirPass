import { NextResponse } from "next/server";
import { getFastApiBaseUrl } from "@/lib/fastapi";
import { getSession } from "@/lib/jwt";
import { toValidUuid } from "@/lib/uuid";

async function proxyRequest(request, params, method) {
  try {
    const resolvedParams = await params;
    const rawPath = resolvedParams?.path;
    const pathSegments = Array.isArray(rawPath) ? rawPath : [rawPath].filter(Boolean);
    const subpath = "/" + pathSegments.join("/");

    const search = request.nextUrl.search || "";
    const baseUrl = getFastApiBaseUrl();
    const targetUrl = `${baseUrl}${subpath}${search}`;

    const session = await getSession(request);
    const forwardHeaders = new Headers();

    // Copy allowlisted incoming headers
    const incomingHeaders = request.headers;
    const allowedHeaders = [
      "content-type",
      "authorization",
      "accept",
      "x-tourist-id",
      "x-partner-id",
    ];
    for (const [key, value] of incomingHeaders.entries()) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    }

    // Auto-inject headers from session if not provided
    if (!forwardHeaders.has("X-Tourist-Id") && session?.id) {
      forwardHeaders.set("X-Tourist-Id", toValidUuid(session.id));
    }
    if (!forwardHeaders.has("X-Partner-Id") && session?.role === "admin") {
      forwardHeaders.set("X-Partner-Id", toValidUuid(session.id));
    }

    const fetchOptions = {
      method,
      headers: forwardHeaders,
    };

    if (["POST", "PUT", "PATCH"].includes(method)) {
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const bodyText = await request.text();
        if (bodyText) {
          fetchOptions.body = bodyText;
          if (!forwardHeaders.has("content-type")) {
            forwardHeaders.set("content-type", "application/json");
          }
        }
      } else {
        const buffer = await request.arrayBuffer();
        if (buffer.byteLength > 0) {
          fetchOptions.body = buffer;
        }
      }
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    const responseContentType = upstreamResponse.headers.get("content-type") || "";

    if (responseContentType.includes("application/json")) {
      const data = await upstreamResponse.json();
      return NextResponse.json(data, { status: upstreamResponse.status });
    }

    const textData = await upstreamResponse.text();
    return new NextResponse(textData, {
      status: upstreamResponse.status,
      headers: {
        "content-type": responseContentType || "text/plain",
      },
    });
  } catch (err) {
    const isConnRefused =
      err.cause?.code === "ECONNREFUSED" ||
      err.message?.includes("fetch failed") ||
      err.message?.includes("connect");

    return NextResponse.json(
      {
        error: isConnRefused
          ? `FastAPI service unavailable at ${getFastApiBaseUrl()}. Please make sure the FastAPI backend is running.`
          : (err.message || "Proxy communication error"),
        service: "fastapi",
      },
      { status: 503 }
    );
  }
}

export async function GET(request, { params }) {
  return proxyRequest(request, params, "GET");
}

export async function POST(request, { params }) {
  return proxyRequest(request, params, "POST");
}

export async function PUT(request, { params }) {
  return proxyRequest(request, params, "PUT");
}

export async function PATCH(request, { params }) {
  return proxyRequest(request, params, "PATCH");
}

export async function DELETE(request, { params }) {
  return proxyRequest(request, params, "DELETE");
}
