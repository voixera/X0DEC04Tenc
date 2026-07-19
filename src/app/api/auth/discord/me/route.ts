import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DISCORD_SESSION_COOKIE, verifySession } from "@/lib/discord-auth";

export async function GET() {
  const user = verifySession((await cookies()).get(DISCORD_SESSION_COOKIE)?.value);
  return NextResponse.json({ user });
}
