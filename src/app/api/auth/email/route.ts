import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authUsers, db, digest, latestOtp, normalizeEmail, otp, passwordHash, sendOtp, validPassword } from "@/lib/email-auth";
import { eq } from "drizzle-orm";
import { EMAIL_SESSION_COOKIE } from "@/lib/email-auth";
import { signSession } from "@/lib/discord-auth";

const body = async (request: Request) => await request.json() as { action: string; email?: string; password?: string; name?: string; code?: string };
export async function POST(request: Request) {
  try {
    if (!db) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
    const input = await body(request); const email = normalizeEmail(input.email || "");
    if (!email.includes("@")) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    if (input.action === "signup") {
      if (!input.name?.trim() || !validPassword(input.password || "")) return NextResponse.json({ error: "Use a name and an 8+ character password with letters and numbers" }, { status: 400 });
      if ((await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1))[0]) return NextResponse.json({ error: "An account already exists" }, { status: 409 });
      await db.insert(authUsers).values({ email, displayName: input.name.trim(), passwordHash: passwordHash(input.password!) }); await sendOtp(email, otp(), "verify");
      return NextResponse.json({ ok: true, next: "verify", message: "Check your email for the verification code" });
    }
    if (input.action === "login") {
      const user = (await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1))[0];
      if (!user || user.passwordHash !== passwordHash(input.password || "")) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      if (!user.verifiedAt) return NextResponse.json({ error: "Verify your email before signing in", next: "verify" }, { status: 403 });
      const response = NextResponse.json({ ok: true }); response.cookies.set(EMAIL_SESSION_COOKIE, signSession({ id: user.id, username: user.displayName, email }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 604800, path: "/" }); return response;
    }
    if (input.action === "send-reset") { const user = (await db.select().from(authUsers).where(eq(authUsers.email, email)).limit(1))[0]; if (user) await sendOtp(email, otp(), "reset"); return NextResponse.json({ ok: true, next: "reset", message: "If that email exists, a reset code was sent" }); }
    if (input.action === "verify" || input.action === "reset") {
      const record = await latestOtp(email, input.action === "verify" ? "verify" : "reset");
      if (!record || record.expiresAt < new Date() || !input.code || digest(input.code) !== record.codeHash) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
      if (input.action === "verify") { await db.update(authUsers).set({ verifiedAt: new Date() }).where(eq(authUsers.email, email)); return NextResponse.json({ ok: true, next: "login" }); }
      if (!validPassword(input.password || "")) return NextResponse.json({ error: "Use an 8+ character password with letters and numbers" }, { status: 400 }); await db.update(authUsers).set({ passwordHash: passwordHash(input.password!) }).where(eq(authUsers.email, email)); return NextResponse.json({ ok: true, next: "login" });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Authentication failed" }, { status: 500 }); }
}

export async function GET() { const jar = await cookies(); return NextResponse.json({ authenticated: Boolean(jar.get(EMAIL_SESSION_COOKIE)?.value) }); }
