import crypto from "crypto";
import { db } from "@/db";
import { authOtps, authUsers } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const EMAIL_SESSION_COOKIE = "x0d_email_session";
const digest = (value: string) => crypto.createHash("sha256").update(`${value}:${process.env.AUTH_SECRET || ""}`).digest("hex");
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const passwordHash = (value: string) => crypto.scryptSync(value, process.env.AUTH_SECRET || "x0d", 64).toString("hex");
export const validPassword = (value: string) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
export const otp = () => String(crypto.randomInt(100000, 1000000));

export async function sendOtp(email: string, code: string, purpose: string) {
  if (!db) throw new Error("Database is not configured");
  await db.insert(authOtps).values({ email, codeHash: digest(code), purpose, expiresAt: new Date(Date.now() + 10 * 60_000) });
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) throw new Error("Brevo email is not configured");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ sender: { email: process.env.BREVO_SENDER_EMAIL, name: "X0DEC04T Encrypt" }, to: [{ email }], subject: purpose === "reset" ? "Reset your X0DEC04T password" : "Verify your X0DEC04T account", htmlContent: `<div style="font-family:Arial;color:#111"><h2>Your verification code</h2><p style="font-size:28px;letter-spacing:8px"><b>${code}</b></p><p>This code expires in 10 minutes.</p></div>` }) });
  if (!response.ok) throw new Error("Brevo failed to send the verification email");
}

export async function latestOtp(email: string, purpose: string) { return db ? (await db.select().from(authOtps).where(and(eq(authOtps.email, email), eq(authOtps.purpose, purpose))).orderBy(desc(authOtps.createdAt)).limit(1))[0] : null; }
export { authUsers, authOtps, db, digest };
