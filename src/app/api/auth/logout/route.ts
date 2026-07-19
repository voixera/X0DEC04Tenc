import { NextResponse } from "next/server";
import { DISCORD_SESSION_COOKIE } from "@/lib/discord-auth";
export async function POST() { const response = NextResponse.json({ success: true }); response.cookies.delete(DISCORD_SESSION_COOKIE); return response; }
