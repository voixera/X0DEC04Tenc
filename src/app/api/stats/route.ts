import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { encryptionHistory } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { normalizeUserId } from "@/lib/user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const emptyStats = {
  totalFiles: 0,
  totalEncrypted: 0,
  totalFailed: 0,
  avgProcessTimeMs: 0,
  successRate: 100,
};

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json(emptyStats);
  }

  try {
    const userId = normalizeUserId(new URL(request.url).searchParams.get("userId"));
    const rows = await db
      .select({
        totalFiles: sql<number>`count(*)::int`,
        totalEncrypted: sql<number>`count(*) filter (where ${encryptionHistory.success} = true)::int`,
        totalFailed: sql<number>`count(*) filter (where ${encryptionHistory.success} = false)::int`,
        avgProcessTimeMs: sql<number>`coalesce(avg(${encryptionHistory.encryptionTimeMs}), 0)::float`,
      })
      .from(encryptionHistory)
      .where(eq(encryptionHistory.userId, userId));

    const s = rows[0] ?? emptyStats;
    const totalFiles = Number(s.totalFiles) || 0;
    const totalEncrypted = Number(s.totalEncrypted) || 0;
    const totalFailed = Number(s.totalFailed) || 0;
    const avgProcessTimeMs = Number(s.avgProcessTimeMs) || 0;
    const successRate = totalFiles > 0 ? (totalEncrypted / totalFiles) * 100 : 100;

    return NextResponse.json({
      totalFiles,
      totalEncrypted,
      totalFailed,
      avgProcessTimeMs,
      successRate: Math.round(successRate * 10) / 10,
    });
  } catch {
    return NextResponse.json(emptyStats);
  }
}
