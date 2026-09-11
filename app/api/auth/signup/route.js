import { NextResponse } from "next/server";
import { upsertProfile, getProfileByEmail } from "@/lib/db/postgres";
import { signJwt } from "@/lib/jwt";
import { toValidUuid } from "@/lib/uuid";
import { hashPassword, validatePasswordStrength } from "@/lib/password";

export async function POST(request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.message }, { status: 400 });
    }

    // Check if account already exists
    const existingUser = await getProfileByEmail(cleanEmail);
    if (existingUser && existingUser.password_hash) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    const userId = toValidUuid(cleanEmail);
    const profileName = fullName?.trim() || cleanEmail.split("@")[0];
    const passwordHash = await hashPassword(password);

    await upsertProfile({
      id: userId,
      email: cleanEmail,
      full_name: profileName,
      password_hash: passwordHash,
      role: "tourist",
    });

    const sessionPayload = {
      id: userId,
      email: cleanEmail,
      role: "tourist",
      user_metadata: {
        full_name: profileName,
        role: "tourist",
      },
    };

    const jwt = await signJwt(sessionPayload);

    const response = NextResponse.json({ success: true, user: sessionPayload });
    response.cookies.set("safirpass_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}

