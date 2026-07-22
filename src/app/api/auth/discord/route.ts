import crypto from "crypto";
import { NextResponse } from "next/server";
import { DISCORD_STATE_COOKIE, discordConfigured } from "@/lib/discord-auth";

export async function GET(request: Request) {
  if (!discordConfigured()) return NextResponse.json({ error: "Discord login is not configured" }, { status: 503 });
  const state = crypto.randomBytes(24).toString("base64url");
  const callback = new URL("/api/auth/discord/callback", process.env.APP_URL || request.url).toString();
  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.search = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID!, redirect_uri: callback, response_type: "code", scope: "identify", state }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set(DISCORD_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 600, path: "/" });
  return response;
}
