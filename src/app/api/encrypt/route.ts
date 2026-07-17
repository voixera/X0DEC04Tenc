import { NextRequest, NextResponse } from "next/server";
import { encryptLuaCode } from "@/lib/encrypt-engine";
import { db, isDatabaseConfigured } from "@/db";
import { encryptionHistory } from "@/db/schema";
import { DEFAULT_SETTINGS, type EncryptionSettings } from "@/lib/types";
import { normalizeUserId } from "@/lib/user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function saveHistoryEntry({
  userId,
  fileName,
  originalSize,
  encryptedSize,
  encryptionTimeMs,
  success,
  errorMessage = null,
  settings,
}: {
  userId: string;
  fileName: string;
  originalSize: number;
  encryptedSize: number;
  encryptionTimeMs: number;
  success: boolean;
  errorMessage?: string | null;
  settings: EncryptionSettings;
}) {
  if (!isDatabaseConfigured || !db) {
    return false;
  }

  try {
    await db.insert(encryptionHistory).values({
      userId,
      fileName,
      originalSize,
      encryptedSize,
      encryptionTimeMs,
      success,
      errorMessage,
      settings: JSON.stringify(settings),
    });

    return true;
  } catch (error) {
    console.error("[encrypt] Failed to save history entry", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  let userId = "anonymous";
  let file: File | null = null;
  let safeName = "unknown.lua";
  let originalSize = 0;
  let settings: EncryptionSettings = { ...DEFAULT_SETTINGS };
  const startTime = performance.now();

  try {
    const formData = await request.formData();
    userId = normalizeUserId(formData.get("userId"));
    file = formData.get("file") as File | null;
    const settingsRaw = formData.get("settings") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
    originalSize = file.size;

    if (!file.name.toLowerCase().endsWith(".lua")) {
      const historySaved = await saveHistoryEntry({
        userId,
        fileName: safeName,
        originalSize,
        encryptedSize: 0,
        encryptionTimeMs: performance.now() - startTime,
        success: false,
        errorMessage: "Only .lua files are supported",
        settings,
      });
      return NextResponse.json(
        { error: "Only .lua files are supported", historySaved },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const historySaved = await saveHistoryEntry({
        userId,
        fileName: safeName,
        originalSize,
        encryptedSize: 0,
        encryptionTimeMs: performance.now() - startTime,
        success: false,
        errorMessage: "File size exceeds 10MB limit",
        settings,
      });
      return NextResponse.json(
        { error: "File size exceeds 10MB limit", historySaved },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      const historySaved = await saveHistoryEntry({
        userId,
        fileName: safeName,
        originalSize,
        encryptedSize: 0,
        encryptionTimeMs: performance.now() - startTime,
        success: false,
        errorMessage: "File is empty",
        settings,
      });
      return NextResponse.json(
        { error: "File is empty", historySaved },
        { status: 400 }
      );
    }

    try {
      const parsedSettings = settingsRaw
        ? (JSON.parse(settingsRaw) as Partial<EncryptionSettings>)
        : {};
      settings = { ...DEFAULT_SETTINGS, ...parsedSettings };
    } catch {
      const historySaved = await saveHistoryEntry({
        userId,
        fileName: safeName,
        originalSize,
        encryptedSize: 0,
        encryptionTimeMs: performance.now() - startTime,
        success: false,
        errorMessage: "Invalid settings format",
        settings,
      });
      return NextResponse.json(
        { error: "Invalid settings format", historySaved },
        { status: 400 }
      );
    }

    const code = await file.text();
    const encryptionStartTime = performance.now();

    const result = encryptLuaCode(code, settings);
    const encryptionTime = performance.now() - encryptionStartTime;

    const historySaved = await saveHistoryEntry({
      userId,
      fileName: safeName,
      originalSize: result.stats.originalSize,
      encryptedSize: result.stats.encryptedSize,
      encryptionTimeMs: encryptionTime,
      success: true,
      settings,
    });

    return NextResponse.json({
      success: true,
      historySaved,
      fileName: safeName,
      encrypted: result.encrypted,
      originalSize: result.stats.originalSize,
      encryptedSize: result.stats.encryptedSize,
      encryptionTimeMs: encryptionTime,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown encryption error";
    let historySaved = false;

    if (file) {
      historySaved = await saveHistoryEntry({
        userId,
        fileName: safeName,
        originalSize,
        encryptedSize: 0,
        encryptionTimeMs: performance.now() - startTime,
        success: false,
        errorMessage: message,
        settings,
      });
    }

    return NextResponse.json(
      { error: message, success: false, historySaved },
      { status: 500 }
    );
  }
}
