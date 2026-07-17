import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { encryptionHistory } from "@/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { normalizeUserId } from "@/lib/user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({ items: [], page: 1, limit: 20 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = normalizeUserId(searchParams.get("userId"));
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    const conditions = [eq(encryptionHistory.userId, userId)];
    if (search) {
      conditions.push(ilike(encryptionHistory.fileName, `%${search}%`));
    }
    if (filter === "success") {
      conditions.push(eq(encryptionHistory.success, true));
    } else if (filter === "failed") {
      conditions.push(eq(encryptionHistory.success, false));
    }

    const rows = await db
      .select()
      .from(encryptionHistory)
      .where(and(...conditions))
      .orderBy(desc(encryptionHistory.createdAt))
      .limit(limit + 1)
      .offset(offset);

    return NextResponse.json({
      items: rows.slice(0, limit),
      page,
      limit,
      hasMore: rows.length > limit,
    });
  } catch {
    return NextResponse.json({ items: [], page: 1, limit: 20, hasMore: false });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id, userId: rawUserId } = await request.json();
    const userId = normalizeUserId(rawUserId);
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await db
      .delete(encryptionHistory)
      .where(and(eq(encryptionHistory.id, id), eq(encryptionHistory.userId, userId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
