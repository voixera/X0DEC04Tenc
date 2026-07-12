import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { encryptionStats } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({
      totalFiles: 0,
      totalEncrypted: 0,
      totalFailed: 0,
      avgProcessTimeMs: 0,
      successRate: 100,
    });
  }

  try {
    const rows = await db.select().from(encryptionStats).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({
        totalFiles: 0,
        totalEncrypted: 0,
        totalFailed: 0,
        avgProcessTimeMs: 0,
        successRate: 100,
      });
    }
    const s = rows[0];
    const total = s.totalEncrypted + s.totalFailed;
    const successRate = total > 0 ? (s.totalEncrypted / total) * 100 : 100;
    return NextResponse.json({
      totalFiles: s.totalFiles,
      totalEncrypted: s.totalEncrypted,
      totalFailed: s.totalFailed,
      avgProcessTimeMs: s.avgProcessTimeMs,
      successRate: Math.round(successRate * 10) / 10,
    });
  } catch {
    return NextResponse.json(
      {
        totalFiles: 0,
        totalEncrypted: 0,
        totalFailed: 0,
        avgProcessTimeMs: 0,
        successRate: 100,
      }
    );
  }
}
