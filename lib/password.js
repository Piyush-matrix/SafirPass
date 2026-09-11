/*
 * Cryptographically secure password hashing and verification using Web Crypto API.
 * Uses PBKDF2 with SHA-256 and 100,000 iterations + 16-byte random salt.
 * 100% compatible with Next.js Edge runtime, Serverless, and Node.js.
*/

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hexStr) {
  const bytes = new Uint8Array(hexStr.length / 2);
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes[i / 2] = parseInt(hexStr.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Validates password strength:
 * Minimum 8 characters, at least one letter and one number.
 */
export function validatePasswordStrength(password) {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required." };
  }
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one letter.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one digit.",
    };
  }
  return { valid: true };
}

/**
 * Hashes a plain-text password using PBKDF2 with SHA-256.
 * Returns formatted string: `${saltHex}:${derivedHashHex}`
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword) throw new Error("Password cannot be empty.");

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(plainPassword),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return `${toHex(salt)}:${toHex(derivedBits)}`;
}

/**
 * Verifies a plain-text password against a stored PBKDF2 hash string.
 */
export async function verifyPassword(plainPassword, storedHash) {
  if (!plainPassword || !storedHash) return false;

  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const [saltHex, originalHashHex] = parts;
  const salt = fromHex(saltHex);
  const enc = new TextEncoder();

  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(plainPassword),
      { name: "PBKDF2" },
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      256,
    );

    const derivedHex = toHex(derivedBits);
    return timingSafeEqual(derivedHex, originalHashHex);
  } catch (err) {
    console.error("Password verification error:", err.message);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
