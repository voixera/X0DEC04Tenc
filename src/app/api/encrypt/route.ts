import { NextRequest, NextResponse } from "next/server";
import { encryptLuaCode } from "@/lib/encrypt-engine";
import { db, isDatabaseConfigured } from "@/db";
import { encryptionHistory, encryptionStats } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { EncryptionSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json(
        { error: "Database not configured", success: false },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const settingsRaw = formData.get("settings") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".lua")) {
      return NextResponse.json(
        { error: "Only .lua files are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    let settings: EncryptionSettings;
    try {
      settings = settingsRaw ? JSON.parse(settingsRaw) : {};
    } catch {
      return NextResponse.json(
        { error: "Invalid settings format" },
        { status: 400 }
      );
    }

    const code = await file.text();
    const startTime = performance.now();

    const result = encryptLuaCode(code, settings);
    const encryptionTime = performance.now() - startTime;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);

    await db.insert(encryptionHistory).values({
      fileName: safeName,
      originalSize: result.stats.originalSize,
      encryptedSize: result.stats.encryptedSize,
      encryptionTimeMs: encryptionTime,
      success: true,
      settings: JSON.stringify(settings),
    });

    const existing = await db.select().from(encryptionStats).limit(1);
    if (existing.length === 0) {
      await db.insert(encryptionStats).values({
        totalFiles: 1,
        totalEncrypted: 1,
        totalFailed: 0,
        avgProcessTimeMs: encryptionTime,
      });
    } else {
      await db
        .update(encryptionStats)
        .set({
          totalFiles: sql`${encryptionStats.totalFiles} + 1`,
          totalEncrypted: sql`${encryptionStats.totalEncrypted} + 1`,
          avgProcessTimeMs: sql`(${encryptionStats.avgProcessTimeMs} * ${encryptionStats.totalFiles} + ${encryptionTime}) / (${encryptionStats.totalFiles} + 1)`,
          updatedAt: new Date(),
        })
        .where(eq(encryptionStats.id, existing[0].id));
    }

    return NextResponse.json({
      success: true,
      fileName: safeName,
      encrypted: result.encrypted,
      originalSize: result.stats.originalSize,
      encryptedSize: result.stats.encryptedSize,
      encryptionTimeMs: encryptionTime,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown encryption error";
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
