"use client";

import { useEffect, useMemo, useState } from "react";
import { History, KeyRound, Monitor, UserRound, Mail, ShieldCheck } from "@/components/icons";
import { getClientUserId } from "@/lib/user";

type AccountUser = { id: string; username: string; email?: string; avatar?: string | null };
type HistoryItem = { id: string; fileName: string; success: boolean; createdAt: string; encryptionTimeMs: number };

function getHwid() {
  const key = "x0dec04t-hwid";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const value = `X0-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  localStorage.setItem(key, value);
  return value;
}

export default function AccountPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hwid, setHwid] = useState("");
  useEffect(() => {
    setHwid(getHwid());
    Promise.all([fetch("/api/auth/email/me"), fetch("/api/auth/discord/me"), fetch(`/api/history?userId=${encodeURIComponent(getClientUserId())}&limit=5`)]).then(async ([email, discord, records]) => {
      const [emailData, discordData, historyData] = await Promise.all([email.json(), discord.json(), records.json()]);
      setUser(emailData.user || discordData.user || null);
      setHistory(historyData.items || []);
    }).catch(() => {});
  }, []);
  const joined = useMemo(() => history.length ? new Date(history[history.length - 1].createdAt).toLocaleDateString() : "Active workspace", [history]);
  return <div className="account-page animate-fade-in">
    <div className="account-header"><div><p className="eyebrow">Identity & access</p><h2>Account</h2><p>Manage the identity connected to your obfuscation workspace.</p></div><button className="secondary-action px-4 py-2 text-xs" onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}>Sign out</button></div>
    <div className="account-layout"><aside className="account-nav"><div className="account-profile"><div className="account-avatar">{(user?.username || "X0").slice(0, 2).toUpperCase()}</div><div><strong>{user?.username || "Workspace user"}</strong><span>{user?.email || "Discord connected"}</span></div></div><div className="account-nav-item active"><UserRound /> Personal information</div><div className="account-nav-item"><KeyRound /> Sign-in & security</div><div className="account-nav-item"><Monitor /> Devices</div><div className="account-nav-item"><History /> Obfuscation history</div></aside><section className="account-content"><p className="eyebrow">Personal information</p><h3>Connected profile</h3><p className="account-muted">Your email, Discord identity, and device identity stay attached to this account.</p><div className="account-grid"><div className="account-card"><UserRound /><span>Username</span><strong>{user?.username || "—"}</strong></div><div className="account-card"><Mail /><span>Email</span><strong>{user?.email || "Discord email unavailable"}</strong></div><div className="account-card"><Monitor /><span>Account HWID</span><strong className="font-mono">{hwid || "Generating…"}</strong></div><div className="account-card"><ShieldCheck /><span>Account status</span><strong>Verified</strong></div></div><div className="account-section-head"><div><h4>Obfuscation history</h4><p>Recent obfuscation activity for this account.</p></div><span>{history.length} records</span></div><div className="account-history">{history.length ? history.map(item => <div className="account-history-row" key={item.id}><History /><div><strong>{item.fileName}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div><b className={item.success ? "text-[var(--color-brand)]" : "text-[var(--color-error)]"}>{item.success ? "Success" : "Failed"}</b></div>) : <div className="account-empty">No obfuscation history yet.</div>}</div></section></div>
  </div>;
}
