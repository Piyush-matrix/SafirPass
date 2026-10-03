import { toValidUuid } from "./uuid";

/**
 * Resolves the base URL for the FastAPI service.
 * Defaults to http://127.0.0.1:8000.
 */
export function getFastApiBaseUrl() {
  const url = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
  return url.replace(/\/+$/, "");
}

/**
 * Standard fetch wrapper for calling the FastAPI backend.
 *
 * @param {string} endpoint - Path such as "/health" or "/v1/incidents/sos"
 * @param {RequestInit & { touristId?: string, partnerId?: string }} options - Fetch options
 * @param {object|null} session - Optional user session object ({ id, email, role })
 */
export async function fastapiFetch(endpoint, options = {}, session = null) {
  const baseUrl = getFastApiBaseUrl();
  const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const targetUrl = `${baseUrl}${normalizedPath}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  // Inject X-Tourist-Id from session or option if not provided
  if (!headers.has("X-Tourist-Id")) {
    const touristId = options.touristId || session?.id;
    if (touristId) {
      headers.set("X-Tourist-Id", toValidUuid(touristId));
    }
  }

  // Inject X-Partner-Id if caller is an admin/partner or explicitly provided
  if (!headers.has("X-Partner-Id")) {
    const partnerId = options.partnerId || (session?.role === "admin" ? session?.id : null);
    if (partnerId) {
      headers.set("X-Partner-Id", toValidUuid(partnerId));
    }
  }

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : (data?.detail || data?.error || `FastAPI error with status ${response.status}`),
    };
  } catch (err) {
    const isConnRefused = err.cause?.code === "ECONNREFUSED" || err.message?.includes("fetch failed");
    return {
      ok: false,
      status: 503,
      data: null,
      error: isConnRefused
        ? `FastAPI service is unreachable at ${baseUrl}. Ensure backend is running (uvicorn app.main:app --port 8000).`
        : (err.message || "Failed to communicate with FastAPI backend"),
    };
  }
}

/**
 * Health check for FastAPI service.
 */
export async function checkFastApiHealth() {
  return fastapiFetch("/health");
}

/**
 * Record an emergency SOS incident in FastAPI.
 */
export async function createFastApiIncident(touristId, { latitude, longitude, message }) {
  return fastapiFetch(
    "/v1/incidents/sos",
    {
      method: "POST",
      touristId,
      body: JSON.stringify({
        location: {
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        message: message || "Emergency SOS incident triggered",
      }),
    }
  );
}

/**
 * Run biometric face match between passport/ID document and selfie.
 */
export async function matchFastApiFace({ documentImageBase64, selfieImageBase64 }) {
  const cleanDoc = (documentImageBase64 || "").replace(/^data:image\/[a-z]+;base64,/, "");
  const cleanSelfie = (selfieImageBase64 || "").replace(/^data:image\/[a-z]+;base64,/, "");

  return fastapiFetch("/v1/integrations/kyc/face-match", {
    method: "POST",
    body: JSON.stringify({
      document_image_base64: cleanDoc,
      selfie_image_base64: cleanSelfie,
    }),
  });
}

/**
 * Ask safety assistant for guidance (multilingual: en, hi, es, fr).
 */
export async function queryFastApiAssistant({ message, language = "en" }) {
  return fastapiFetch("/v1/integrations/assistant/messages", {
    method: "POST",
    body: JSON.stringify({
      message: message.trim(),
      language: language || null,
    }),
  });
}

/**
 * Verify partner QR token.
 */
export async function verifyFastApiQr({ qrToken, purpose = "Identity Verification", partnerId }) {
  return fastapiFetch(
    "/v1/verifications",
    {
      method: "POST",
      partnerId,
      body: JSON.stringify({
        qr_token: qrToken,
        purpose,
      }),
    }
  );
}

/**
 * Send SNS safety notification.
 */
export async function sendFastApiNotification({ touristId, message, phoneNumber }) {
  return fastapiFetch("/v1/integrations/notifications", {
    method: "POST",
    body: JSON.stringify({
      tourist_id: toValidUuid(touristId),
      message,
      phone_number: phoneNumber || null,
    }),
  });
}

/**
 * Synchronize emergency SOS event to FastAPI (logging location telemetry and dispatching SNS notification).
 */
export async function syncSosToFastApi({ userId, latitude, longitude, notes, phone }) {
  const validId = toValidUuid(userId);
  const results = { notification: null, location: null };

  try {
    const notifRes = await sendFastApiNotification({
      touristId: validId,
      message: `EMERGENCY SOS: ${notes || "Panic button activated"} at coordinates (${latitude || "N/A"}, ${longitude || "N/A"})`,
      phoneNumber: phone || null,
    });
    results.notification = notifRes.data;
  } catch (err) {
    console.warn("[FastAPI Sync] Notification dispatch error:", err.message);
  }

  if (latitude != null && longitude != null && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
    try {
      const locRes = await fastapiFetch("/v1/integrations/locations", {
        method: "POST",
        body: JSON.stringify({
          tourist_id: validId,
          latitude: Number(latitude),
          longitude: Number(longitude),
          speed_kph: 0,
          phone_number: phone || null,
        }),
      });
      results.location = locRes.data;
    } catch (err) {
      console.warn("[FastAPI Sync] Location telemetry error:", err.message);
    }
  }

  return results;
}

/**
 * Verify document with ML & OpenCV features in FastAPI.
 */
export async function verifyDocumentWithMl({ docType, imageBase64 }) {
  const cleanImage = (imageBase64 || "").replace(/^data:image\/[a-z]+;base64,/, "");
  return fastapiFetch("/v1/integrations/documents/verify", {
    method: "POST",
    body: JSON.stringify({
      doc_type: docType,
      image_base64: cleanImage,
    }),
  });
}

/**
 * Ingest document sample into the ML training dataset.
 */
export async function ingestDocumentSample({ userId, docType, fileName, fileUrl, imageBase64 }) {
  const cleanImage = imageBase64 ? imageBase64.replace(/^data:image\/[a-z]+;base64,/, "") : null;
  return fastapiFetch("/v1/integrations/documents/samples", {
    method: "POST",
    body: JSON.stringify({
      user_id: toValidUuid(userId),
      doc_type: docType,
      file_name: fileName || `${docType}_doc`,
      file_url: fileUrl || "",
      image_base64: cleanImage,
    }),
  });
}

/**
 * Label document samples with ground-truth decision (verified vs rejected) from Admin KYC review.
 */
export async function labelDocumentSamples({ userId, isAuthentic, docType, adminNotes }) {
  return fastapiFetch("/v1/integrations/documents/samples/label", {
    method: "PATCH",
    body: JSON.stringify({
      user_id: toValidUuid(userId),
      is_authentic: Boolean(isAuthentic),
      doc_type: docType || null,
      admin_notes: adminNotes || null,
    }),
  });
}

/**
 * Trigger scikit-learn model training on all human-labeled document samples.
 */
export async function triggerModelTraining() {
  return fastapiFetch("/v1/integrations/documents/train", {
    method: "POST",
  });
}

/**
 * Get document dataset collection and model training statistics.
 */
export async function getDocumentDatasetStats() {
  return fastapiFetch("/v1/integrations/documents/stats", {
    method: "GET",
  });
}


