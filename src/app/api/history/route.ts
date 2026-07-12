import { NextRequest, NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { encryptionHistory } from "@/db/schema";
import { desc, like, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({ items: [], page: 1, limit: 20 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    let query = db.select().from(encryptionHistory);

    const conditions = [];
    if (search) {
      conditions.push(like(encryptionHistory.fileName, `%${search}%`));
    }
    if (filter === "success") {
      conditions.push(eq(encryptionHistory.success, true));
    } else if (filter === "failed") {
      conditions.push(eq(encryptionHistory.success, false));
    }

    let rows;
    if (conditions.length > 0) {
      rows = await db
        .select()
        .from(encryptionHistory)
        .where(conditions.length === 1 ? conditions[0] : undefined)
        .orderBy(desc(encryptionHistory.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      rows = await db
        .select()
        .from(encryptionHistory)
        .orderBy(desc(encryptionHistory.createdAt))
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json({ items: rows, page, limit });
  } catch {
    return NextResponse.json({ items: [], page: 1, limit: 20 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await db.delete(encryptionHistory).where(eq(encryptionHistory.id, id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
