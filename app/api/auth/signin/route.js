import { NextResponse } from "next/server";
import { getProfileByEmail, upsertProfile } from "@/lib/db/postgres";
import { signJwt } from "@/lib/jwt";
import { verifyPassword, hashPassword } from "@/lib/password";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingProfile = await getProfileByEmail(cleanEmail);

    if (!existingProfile) {
      return NextResponse.json(
        { error: "No account found with this email. Please register an account first." },
        { status: 401 }
      );
    }

    // Verify password against stored PBKDF2 hash
    if (existingProfile.password_hash) {
      const isValid = await verifyPassword(password, existingProfile.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
    } else {
      // Graceful upgrade for legacy records: save password hash on first verified login
      const upgradedHash = await hashPassword(password);
      await upsertProfile({
        id: existingProfile.id,
        email: cleanEmail,
        full_name: existingProfile.full_name,
        password_hash: upgradedHash,
        role: existingProfile.role || "tourist",
      });
    }

    const role = existingProfile.role || "tourist";
    const fullName = existingProfile.full_name || cleanEmail.split("@")[0];

    const sessionPayload = {
      id: existingProfile.id,
      email: cleanEmail,
      role,
      user_metadata: {
        full_name: fullName,
        avatar_url: existingProfile.avatar_url || null,
        role,
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
    return NextResponse.json({ error: err.message || "Sign in failed" }, { status: 500 });
  }
}

