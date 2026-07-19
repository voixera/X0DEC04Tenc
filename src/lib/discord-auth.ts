import crypto from "crypto";

export const DISCORD_SESSION_COOKIE = "x0d_discord_session";
export const DISCORD_STATE_COOKIE = "x0d_discord_state";

export type DiscordUser = { id: string; username: string; avatar: string | null };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
}

export function signSession(user: DiscordUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 7 * 86400_000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(value?: string): DiscordUser | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as DiscordUser & { exp: number };
    return data.exp > Date.now() ? { id: data.id, username: data.username, avatar: data.avatar } : null;
  } catch { return null; }
}

export function discordConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && process.env.AUTH_SECRET);
}
