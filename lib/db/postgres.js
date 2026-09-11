import { neon } from "@neondatabase/serverless";
import { toValidUuid } from "../uuid.js";

/* Neon Serverless Postgres Client Lazily initialized from DATABASE_URL */
function getSql() {
  const connectionString =
    process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!connectionString) return null;
  return neon(connectionString);
}

/*Resilient in-memory fallback store for relational entities Keeps the application operational even before DATABASE_URL is configured
*/
const inMemoryRelationalStore = {
  profiles: new Map(),
  kyc_applications: new Map(),
  consent_requests: new Map(),
  sos_alerts: new Map(),
  geofences: new Map(),
};

// Seed initial geofences into in-memory store
[
  {
    id: "g1-redfort",
    name: "Red Fort Restricted Border Zone",
    category: "restricted",
    latitude: 28.6562,
    longitude: 77.241,
    radius_meters: 600,
    description: "Border zone restricted during national events",
  },
  {
    id: "g2-tajganj",
    name: "Taj Ganj Scam Advisory Zone",
    category: "scam_hotspot",
    latitude: 27.1751,
    longitude: 78.0421,
    radius_meters: 800,
    description:
      "Frequent unauthorized guides and fake ticket vendors reported",
  },
  {
    id: "g3-bagabeach",
    name: "Baga Beach Night Hazard Area",
    category: "hazard",
    latitude: 15.5524,
    longitude: 73.7517,
    radius_meters: 1000,
    description:
      "Strong tidal currents and unlit coastal stretches after sunset",
  },
].forEach((g) => inMemoryRelationalStore.geofences.set(g.id, g));

function sanitizeDate(val) {
  if (!val || typeof val !== "string" || val.trim() === "") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : val;
}

// 1. PROFILES (Relational Table: `profiles`)
let profileColumnsEnsured = false;
async function ensureProfileColumns(sql) {
  if (profileColumnsEnsured || !sql) return;
  try {
    await sql`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS password_hash TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'tourist';
    `;
    profileColumnsEnsured = true;
  } catch (err) {
    // Non-fatal if permissions don't allow ALTER TABLE; in-memory fallback handles it
    profileColumnsEnsured = true;
  }
}

export async function upsertProfile(profileData) {
  const sanitizedId = toValidUuid(profileData.id);
  const now = new Date().toISOString();
  const fullName = profileData.full_name || "";
  const email = profileData.email || "";
  const nationality = profileData.nationality || "";
  const phone = profileData.phone || "";
  const avatarUrl = profileData.avatar_url || null;
  const role = profileData.role || "tourist";
  const passwordHash = profileData.password_hash || null;

  const existingMem = inMemoryRelationalStore.profiles.get(sanitizedId);
  const payload = {
    id: sanitizedId,
    full_name: fullName || existingMem?.full_name || "",
    email: email || existingMem?.email || "",
    nationality: nationality || existingMem?.nationality || "",
    phone: phone || existingMem?.phone || "",
    avatar_url: avatarUrl || existingMem?.avatar_url || null,
    role: role || existingMem?.role || "tourist",
    password_hash: passwordHash || existingMem?.password_hash || null,
    updated_at: now,
  };

  const sql = getSql();
  if (sql) {
    try {
      await ensureProfileColumns(sql);
      const rows = await sql`
        INSERT INTO public.profiles (id, full_name, email, nationality, phone, avatar_url, role, password_hash, updated_at)
        VALUES (${sanitizedId}, ${payload.full_name}, ${payload.email}, ${payload.nationality}, ${payload.phone}, ${payload.avatar_url}, ${payload.role}, ${payload.password_hash}, ${now})
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          nationality = EXCLUDED.nationality,
          phone = EXCLUDED.phone,
          avatar_url = EXCLUDED.avatar_url,
          role = COALESCE(EXCLUDED.role, profiles.role),
          password_hash = COALESCE(EXCLUDED.password_hash, profiles.password_hash),
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.profiles.set(sanitizedId, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres profile upsert note:", err.message);
      // Fallback try without new columns if table schema is strictly locked
      try {
        const rows = await sql`
          INSERT INTO public.profiles (id, full_name, email, nationality, phone, avatar_url, updated_at)
          VALUES (${sanitizedId}, ${payload.full_name}, ${payload.email}, ${payload.nationality}, ${payload.phone}, ${payload.avatar_url}, ${now})
          ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            nationality = EXCLUDED.nationality,
            phone = EXCLUDED.phone,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = EXCLUDED.updated_at
          RETURNING *;
        `;
        if (rows && rows.length > 0) {
          const merged = {
            ...rows[0],
            password_hash: payload.password_hash,
            role: payload.role,
          };
          inMemoryRelationalStore.profiles.set(sanitizedId, merged);
          return merged;
        }
      } catch (innerErr) {
        console.warn(
          "Neon Postgres basic profile upsert note:",
          innerErr.message,
        );
      }
    }
  }

  inMemoryRelationalStore.profiles.set(sanitizedId, payload);
  return payload;
}

export async function getProfileById(userId) {
  const sanitizedId = toValidUuid(userId);
  const sql = getSql();

  if (sql) {
    try {
      await ensureProfileColumns(sql);
      const rows = await sql`
        SELECT * FROM public.profiles WHERE id = ${sanitizedId} LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const mem = inMemoryRelationalStore.profiles.get(sanitizedId);
        const merged = {
          ...rows[0],
          password_hash: rows[0].password_hash || mem?.password_hash || null,
          role: rows[0].role || mem?.role || "tourist",
        };
        inMemoryRelationalStore.profiles.set(sanitizedId, merged);
        return merged;
      }
    } catch (err) {
      console.warn("Neon Postgres profile get note:", err.message);
    }
  }

  return inMemoryRelationalStore.profiles.get(sanitizedId) || null;
}

export async function getProfileByEmail(email) {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const sanitizedId = toValidUuid(trimmed);
  const sql = getSql();

  if (sql) {
    try {
      await ensureProfileColumns(sql);
      const rows = await sql`
        SELECT * FROM public.profiles WHERE LOWER(TRIM(email)) = ${trimmed} OR id = ${sanitizedId} LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const mem =
          inMemoryRelationalStore.profiles.get(rows[0].id) ||
          inMemoryRelationalStore.profiles.get(sanitizedId);
        const merged = {
          ...rows[0],
          password_hash: rows[0].password_hash || mem?.password_hash || null,
          role: rows[0].role || mem?.role || "tourist",
        };
        inMemoryRelationalStore.profiles.set(rows[0].id, merged);
        return merged;
      }
    } catch (err) {
      console.warn("Neon Postgres profile getByEmail note:", err.message);
    }
  }

  for (const [, profile] of inMemoryRelationalStore.profiles.entries()) {
    if (profile?.email && profile.email.trim().toLowerCase() === trimmed) {
      return profile;
    }
  }
  return inMemoryRelationalStore.profiles.get(sanitizedId) || null;
}

// 2. KYC APPLICATIONS (Relational Table: `kyc_applications`)
export async function upsertKycApplication(kycData) {
  const sanitizedUserId = toValidUuid(kycData.user_id);
  const now = new Date().toISOString();
  const fullName = kycData.full_name || "";
  const nationality = kycData.nationality || "";
  const passportNumber = kycData.passport_number || "";
  const passportExpiry = sanitizeDate(kycData.passport_expiry);
  const visaType = kycData.visa_type || "";
  const visaNumber = kycData.visa_number || "";
  const entryDate = sanitizeDate(kycData.entry_date);
  const exitDate = sanitizeDate(kycData.exit_date);
  const emergencyContact = kycData.emergency_contact || "";
  const stayAddress = kycData.stay_address || "";
  const bloodGroup = kycData.blood_group || "";
  const livenessPassed = Boolean(kycData.liveness_passed);
  const livenessScore = Number(kycData.liveness_score || 0.98);
  const passportDocUrl = kycData.passport_doc_url || null;
  const deviceSealHash = kycData.device_seal_hash || "";
  const status = kycData.status || "under_review";
  const touristId = kycData.tourist_id;
  const adminNotes = kycData.admin_notes || "";

  const payload = {
    user_id: sanitizedUserId,
    full_name: fullName,
    nationality,
    passport_number: passportNumber,
    passport_expiry: passportExpiry,
    visa_type: visaType,
    visa_number: visaNumber,
    entry_date: entryDate,
    exit_date: exitDate,
    emergency_contact: emergencyContact,
    stay_address: stayAddress,
    blood_group: bloodGroup,
    liveness_passed: livenessPassed,
    liveness_score: livenessScore,
    passport_doc_url: passportDocUrl,
    device_seal_hash: deviceSealHash,
    status,
    tourist_id: touristId,
    admin_notes: adminNotes,
    updated_at: now,
  };

  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO public.kyc_applications (
          user_id, full_name, nationality, passport_number, passport_expiry,
          visa_type, visa_number, entry_date, exit_date, emergency_contact,
          stay_address, blood_group, liveness_passed, liveness_score,
          passport_doc_url, device_seal_hash, status, tourist_id, admin_notes, updated_at
        ) VALUES (
          ${sanitizedUserId}, ${fullName}, ${nationality}, ${passportNumber}, ${passportExpiry},
          ${visaType}, ${visaNumber}, ${entryDate}, ${exitDate}, ${emergencyContact},
          ${stayAddress}, ${bloodGroup}, ${livenessPassed}, ${livenessScore},
          ${passportDocUrl}, ${deviceSealHash}, ${status}, ${touristId}, ${adminNotes}, ${now}
        )
        ON CONFLICT (tourist_id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          nationality = EXCLUDED.nationality,
          passport_number = EXCLUDED.passport_number,
          passport_expiry = EXCLUDED.passport_expiry,
          visa_type = EXCLUDED.visa_type,
          visa_number = EXCLUDED.visa_number,
          entry_date = EXCLUDED.entry_date,
          exit_date = EXCLUDED.exit_date,
          emergency_contact = EXCLUDED.emergency_contact,
          stay_address = EXCLUDED.stay_address,
          blood_group = EXCLUDED.blood_group,
          liveness_passed = EXCLUDED.liveness_passed,
          liveness_score = EXCLUDED.liveness_score,
          passport_doc_url = EXCLUDED.passport_doc_url,
          device_seal_hash = EXCLUDED.device_seal_hash,
          status = EXCLUDED.status,
          admin_notes = EXCLUDED.admin_notes,
          updated_at = EXCLUDED.updated_at
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.kyc_applications.set(sanitizedUserId, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres KYC upsert note:", err.message);
    }
  }

  inMemoryRelationalStore.kyc_applications.set(sanitizedUserId, payload);
  return payload;
}

export async function getKycApplicationByUserId(userId) {
  const sanitizedUserId = toValidUuid(userId);
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM public.kyc_applications
        WHERE user_id = ${sanitizedUserId}
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.kyc_applications.set(sanitizedUserId, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres KYC get note:", err.message);
    }
  }

  return inMemoryRelationalStore.kyc_applications.get(sanitizedUserId) || null;
}

export async function getAllKycApplications() {
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM public.kyc_applications
        ORDER BY created_at DESC;
      `;
      if (rows && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn("Neon Postgres KYC list note:", err.message);
    }
  }

  return Array.from(inMemoryRelationalStore.kyc_applications.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );
}

export async function updateKycStatus(
  userId,
  status,
  notes = "",
  adminEmail = "",
) {
  const sanitizedUserId = toValidUuid(userId);
  const now = new Date().toISOString();
  const isApproved = status === "verified";
  const approvedAt = isApproved ? now : null;
  const issuedAt = isApproved ? now : null;

  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        UPDATE public.kyc_applications
        SET
          status = ${status},
          admin_notes = ${notes},
          reviewed_by = ${adminEmail},
          reviewed_at = ${now},
          approved_at = COALESCE(${approvedAt}, approved_at),
          issued_at = COALESCE(${issuedAt}, issued_at),
          updated_at = ${now}
        WHERE user_id = ${sanitizedUserId}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.kyc_applications.set(sanitizedUserId, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres KYC status update note:", err.message);
    }
  }

  const existing =
    inMemoryRelationalStore.kyc_applications.get(sanitizedUserId);
  if (existing) {
    const updated = {
      ...existing,
      status,
      admin_notes: notes,
      reviewed_by: adminEmail,
      reviewed_at: now,
      ...(isApproved ? { approved_at: now, issued_at: now } : {}),
      updated_at: now,
    };
    inMemoryRelationalStore.kyc_applications.set(sanitizedUserId, updated);
    return updated;
  }

  return null;
}

// 3. CONSENT REQUESTS (Relational Table: `consent_requests`)
export async function createConsentRequest(consentData) {
  const sanitizedUserId = toValidUuid(consentData.user_id);
  const requester = consentData.requester;
  const requesterType = consentData.requester_type || "hotel";
  const attributes = consentData.attributes || [];
  const sharedAttributes = consentData.shared_attributes || [];
  const status = consentData.status || "pending";
  const now = new Date().toISOString();

  const payload = {
    user_id: sanitizedUserId,
    requester,
    requester_type: requesterType,
    attributes,
    shared_attributes: sharedAttributes,
    status,
    created_at: now,
  };

  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO public.consent_requests (user_id, requester, requester_type, attributes, shared_attributes, status, created_at)
        VALUES (${sanitizedUserId}, ${requester}, ${requesterType}, ${attributes}, ${sharedAttributes}, ${status}, ${now})
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.consent_requests.set(rows[0].id, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres consent insert note:", err.message);
    }
  }

  const fallbackId = `req-${Date.now()}`;
  const fallback = { id: fallbackId, ...payload };
  inMemoryRelationalStore.consent_requests.set(fallbackId, fallback);
  return fallback;
}

export async function getConsentRequestsByUserId(userId) {
  const sanitizedUserId = toValidUuid(userId);
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM public.consent_requests
        WHERE user_id = ${sanitizedUserId}
        ORDER BY created_at DESC;
      `;
      if (rows) return rows;
    } catch (err) {
      console.warn("Neon Postgres consent list note:", err.message);
    }
  }

  return Array.from(inMemoryRelationalStore.consent_requests.values())
    .filter((c) => c.user_id === sanitizedUserId || c.user_id === userId)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function updateConsentRequestStatus(
  id,
  status,
  sharedAttributes = [],
) {
  const now = new Date().toISOString();
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        UPDATE public.consent_requests
        SET
          status = ${status},
          shared_attributes = ${sharedAttributes},
          decided_at = ${now}
        WHERE id = ${id}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.consent_requests.set(id, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres consent update note:", err.message);
    }
  }

  const existing = inMemoryRelationalStore.consent_requests.get(id);
  if (existing) {
    const updated = {
      ...existing,
      status,
      shared_attributes: sharedAttributes,
      decided_at: now,
    };
    inMemoryRelationalStore.consent_requests.set(id, updated);
    return updated;
  }

  return null;
}

// 4. EMERGENCY SOS ALERTS (Relational Table: `sos_alerts`)
export async function createSosAlert(alertData) {
  const sanitizedUserId = toValidUuid(alertData.user_id);
  const category = alertData.category || "general";
  const latitude = alertData.latitude ?? null;
  const longitude = alertData.longitude ?? null;
  const addressText = alertData.address_text || "India";
  const notes = alertData.notes || "";
  const responder = alertData.responder || "112 Central Command";
  const reference =
    alertData.reference || `INC-${Math.floor(10000 + Math.random() * 90000)}`;
  const status = alertData.status || "active";
  const now = new Date().toISOString();

  const payload = {
    user_id: sanitizedUserId,
    category,
    latitude,
    longitude,
    address_text: addressText,
    notes,
    responder,
    reference,
    status,
    created_at: now,
    updated_at: now,
  };

  const sql = getSql();
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO public.sos_alerts (user_id, category, latitude, longitude, address_text, notes, responder, reference, status, created_at, updated_at)
        VALUES (${sanitizedUserId}, ${category}, ${latitude}, ${longitude}, ${addressText}, ${notes}, ${responder}, ${reference}, ${status}, ${now}, ${now})
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.sos_alerts.set(rows[0].id, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres SOS insert note:", err.message);
    }
  }

  const fallbackId = `sos-${Date.now()}`;
  const fallback = { id: fallbackId, ...payload };
  inMemoryRelationalStore.sos_alerts.set(fallbackId, fallback);
  return fallback;
}

export async function getSosAlertsByUserId(userId) {
  const sanitizedUserId = toValidUuid(userId);
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM public.sos_alerts
        WHERE user_id = ${sanitizedUserId}
        ORDER BY created_at DESC;
      `;
      if (rows) return rows;
    } catch (err) {
      console.warn("Neon Postgres SOS list note:", err.message);
    }
  }

  return Array.from(inMemoryRelationalStore.sos_alerts.values())
    .filter((s) => s.user_id === sanitizedUserId || s.user_id === userId)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

export async function getAllActiveSosAlerts() {
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM public.sos_alerts
        ORDER BY created_at DESC;
      `;
      if (rows) return rows;
    } catch (err) {
      console.warn("Neon Postgres active SOS list note:", err.message);
    }
  }

  return Array.from(inMemoryRelationalStore.sos_alerts.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );
}

export async function updateSosAlertStatus(
  id,
  status,
  responder = "National 112 Control Unit",
) {
  const now = new Date().toISOString();
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        UPDATE public.sos_alerts
        SET
          status = ${status},
          responder = ${responder},
          updated_at = ${now}
        WHERE id = ${id}
        RETURNING *;
      `;
      if (rows && rows.length > 0) {
        inMemoryRelationalStore.sos_alerts.set(id, rows[0]);
        return rows[0];
      }
    } catch (err) {
      console.warn("Neon Postgres SOS update note:", err.message);
    }
  }

  const existing = inMemoryRelationalStore.sos_alerts.get(id);
  if (existing) {
    const updated = { ...existing, status, responder, updated_at: now };
    inMemoryRelationalStore.sos_alerts.set(id, updated);
    return updated;
  }

  return null;
}

// 5. GEOFENCES (Relational Table: `geofences`)
export async function getAllGeofences() {
  const sql = getSql();

  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM public.geofences
        ORDER BY created_at ASC;
      `;
      if (rows && rows.length > 0) return rows;
    } catch (err) {
      console.warn("Neon Postgres geofences note:", err.message);
    }
  }

  return Array.from(inMemoryRelationalStore.geofences.values());
}
