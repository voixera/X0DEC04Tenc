import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DISCORD_SESSION_COOKIE, DISCORD_STATE_COOKIE, signSession } from "@/lib/discord-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get(DISCORD_STATE_COOKIE)?.value;
  const home = new URL("/", request.url);
  if (!code || !state || !expectedState || state !== expectedState) return NextResponse.redirect(new URL("/?authError=invalid_state", request.url));
  const callback = new URL("/api/auth/discord/callback", request.url).toString();
  const token = await fetch("https://discord.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID!, client_secret: process.env.DISCORD_CLIENT_SECRET!, grant_type: "authorization_code", code, redirect_uri: callback }) });
  if (!token.ok) return NextResponse.redirect(new URL("/?authError=token", request.url));
  const { access_token } = await token.json() as { access_token: string };
  const profile = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
  if (!profile.ok) return NextResponse.redirect(new URL("/?authError=profile", request.url));
  const user = await profile.json() as { id: string; username: string; global_name?: string; avatar: string | null };
  const response = NextResponse.redirect(home);
  response.cookies.set(DISCORD_SESSION_COOKIE, signSession({ id: user.id, username: user.global_name || user.username, avatar: user.avatar }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 604800, path: "/" });
  response.cookies.delete(DISCORD_STATE_COOKIE);
  return response;
}
