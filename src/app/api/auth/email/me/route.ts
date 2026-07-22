import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { EMAIL_SESSION_COOKIE } from "@/lib/email-auth";
import { verifySession } from "@/lib/discord-auth";
export async function GET() { const user = verifySession((await cookies()).get(EMAIL_SESSION_COOKIE)?.value); return NextResponse.json({ user }); }
