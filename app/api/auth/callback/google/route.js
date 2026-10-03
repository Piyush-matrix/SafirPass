import { NextResponse } from "next/server";
import { upsertProfile } from "@/lib/db/postgres";
import { signJwt } from "@/lib/jwt";
import { toValidUuid } from "@/lib/uuid";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!code) {
    return NextResponse.redirect(`${appUrl}/auth?error=missing_code`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  try {
    let googleUser = null;

    if (clientId && clientSecret) {
      // Exchange authorization code for Google Tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.access_token) {
        // Fetch user profile from Google UserInfo endpoint
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          },
        );
        googleUser = await userInfoRes.json();
      }
    }

    if (!googleUser || !googleUser.email) {
      return NextResponse.redirect(`${appUrl}/auth?error=google_auth_failed`);
    }

    const rawId = googleUser.id || googleUser.email;
    const userId = toValidUuid(rawId);


    // Upsert user profile into Neon PostgreSQL
    await upsertProfile({
      id: userId,
      full_name: googleUser.name || googleUser.email,
      email: googleUser.email,
      avatar_url: googleUser.picture,
      role: "tourist",
    });

    // Issue JWT Session
    const sessionPayload = {
      id: userId,
      email: googleUser.email,
      role: "tourist",
      user_metadata: {
        full_name: googleUser.name || googleUser.email,
        avatar_url: googleUser.picture,
        role: "tourist",
      },
    };

    const jwt = await signJwt(sessionPayload);

    const response = NextResponse.redirect(`${appUrl}/dashboard`);

    // Set HTTP-only Cookie
    response.cookies.set("safirpass_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${appUrl}/auth?error=oauth_failed`);
  }
}
