import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI;

/**
 * Global Mongoose connection cache for Next.js serverless and long-lived handlers
 */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongoose() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI is not set in environment variables.");
    return null;
  }

  // If already connected (readyState === 1)
  if (mongoose.connection?.readyState === 1) {
    return mongoose.connection;
  }

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const isLocalhost = uri.includes("127.0.0.1") || uri.includes("localhost");
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: isLocalhost ? 2000 : 10000,
      connectTimeoutMS: isLocalhost ? 2000 : 10000,
      dbName: process.env.MONGODB_DB_NAME || "safirpass",
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        console.log("✅ MongoDB Atlas connected successfully to database:", m.connection.name);
        cached.conn = m.connection;
        return m.connection;
      })
      .catch((err) => {
        if (isLocalhost) {
          console.warn("⚠️ Local MongoDB (127.0.0.1:27017) not running. Using in-memory store. (Set your MongoDB Atlas cloud URI in .env)");
        } else {
          console.error("❌ MongoDB Atlas Connection Error:", err.message);
        }
        cached.promise = null;
        cached.conn = null;
        return null;
      });
  }


  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    console.error("❌ connectMongoose unexpected error:", e.message);
    cached.promise = null;
    cached.conn = null;
    return null;
  }
}

// ----------------------------------------------------
// Mongoose Schemas & Models
// ----------------------------------------------------

// 1. Single Document Item Schema
const DocumentItemSchema = new mongoose.Schema(
  {
    doc_type: { type: String, required: true }, // e.g. "passport", "visa", "stay_proof", "flight_ticket", "oci_card"
    file_name: { type: String },
    file_size: { type: String },
    mime_type: { type: String },
    url: { type: String }, // Cloudinary or DataUrl
    secure_url: { type: String },
    public_id: { type: String },
    data_url: { type: String }, // Raw base64 dataUrl for local/offline inspection
    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
    failure_reason: { type: String, default: "" },
    verified_at: { type: Date },
    uploaded_at: { type: Date, default: Date.now },
  },
  { _id: true }
);

// 2. Document Vault Model (MongoDB Atlas)
const DocumentVaultSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    tourist_id: { type: String, index: true },
    nationality: { type: String },
    documents: [DocumentItemSchema],
    uploaded_count: { type: Number, default: 0 },
    verified_count: { type: Number, default: 0 },
    failed_count: { type: Number, default: 0 },
    all_verified: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 3. Biometric Face Log Model (MongoDB Atlas)
const BiometricFaceLogSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    tourist_id: { type: String, index: true },
    face_snapshot_url: { type: String },
    face_snapshot_base64: { type: String },
    liveness_passed: { type: Boolean, default: true },
    liveness_score: { type: Number, default: 0 },
    anti_spoof_confirmed: { type: Boolean, default: true },
    captured_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 4. Authority Audit Trail Model (MongoDB Atlas)
const AuthorityAuditLogSchema = new mongoose.Schema(
  {
    admin_email: { type: String, required: true, index: true },
    action: { type: String, required: true }, // e.g. "APPROVE_KYC", "REJECT_KYC", "FLAG_DOCUMENT"
    target_user_id: { type: String, required: true, index: true },
    decision: { type: String }, // "verified" | "rejected"
    admin_notes: { type: String },
    failed_documents: [{ type: String }],
    document_feedback: { type: Map, of: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 5. Incident Telemetry Log Model (MongoDB Atlas Spatial Telemetry)
const IncidentTelemetryLogSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, index: true },
    tourist_id: { type: String, index: true },
    incident_ref: { type: String, index: true },
    category: { type: String, default: "general" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [77.2090, 28.6139] }, // [lng, lat]
    },
    breadcrumbs: [
      {
        latitude: Number,
        longitude: Number,
        recorded_at: { type: Date, default: Date.now },
      },
    ],
    device_telemetry: {
      battery_level: Number,
      network_type: String,
      ip_address: String,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DocumentVault =
  mongoose.models.DocumentVault ||
  mongoose.model("DocumentVault", DocumentVaultSchema);

export const BiometricFaceLog =
  mongoose.models.BiometricFaceLog ||
  mongoose.model("BiometricFaceLog", BiometricFaceLogSchema);

export const AuthorityAuditLog =
  mongoose.models.AuthorityAuditLog ||
  mongoose.model("AuthorityAuditLog", AuthorityAuditLogSchema);

export const IncidentTelemetryLog =
  mongoose.models.IncidentTelemetryLog ||
  mongoose.model("IncidentTelemetryLog", IncidentTelemetryLogSchema);
