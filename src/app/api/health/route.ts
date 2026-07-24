import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!db) {
    return Response.json({ ok: false, database: false });
  }

  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: true });
  } catch (error) {
    const cause = error instanceof Error && "cause" in error ? (error as Error & { cause?: unknown }).cause : null;
    const causeMessage = cause instanceof Error ? cause.message : "";
    const causeCode = cause && typeof cause === "object" && "code" in cause ? String((cause as { code?: unknown }).code) : undefined;
    const message = causeMessage || (error instanceof Error ? error.message : "Database query failed");
    console.error("Health database check failed", error);
    return Response.json({ ok: false, database: true, error: message, ...(causeCode ? { code: causeCode } : {}) }, { status: 500 });
  }
}
