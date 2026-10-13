"use client";

import { useEffect, useCallback } from "react";
import { useNotificationStore } from "@/lib/store";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "@/components/icons";
import { cn } from "@/lib/utils";

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: "text-[var(--color-success)] border-[var(--color-success)]/25 bg-[var(--color-success)]/10",
  error: "text-[var(--color-error)] border-[var(--color-error)]/25 bg-[var(--color-error)]/10",
  warning: "text-[var(--color-warning)] border-[var(--color-warning)]/25 bg-[var(--color-warning)]/10",
  info: "text-[var(--color-brand)] border-[var(--color-border-strong)] bg-[var(--color-brand)]/10",
};

export default function NotificationProvider() {
  const { notifications, removeNotification } = useNotificationStore();

  const autoRemove = useCallback(
    (id: string, duration: number) => {
      setTimeout(() => removeNotification(id), duration);
    },
    [removeNotification]
  );

  useEffect(() => {
    notifications.forEach((n) => {
      const dur = n.duration || 4000;
      autoRemove(n.id, dur);
    });
  }, [notifications, autoRemove]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const Icon = iconMap[n.type];
        return (
          <div
            key={n.id}
            className={cn(
              "pointer-events-auto animate-slide-in-right border rounded-[var(--radius-base)] p-3 flex items-start gap-3 backdrop-blur-md",
              colorMap[n.type]
            )}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--color-text)]">{n.title}</p>
              <p className="text-[12px] text-[var(--color-accent-dim)] mt-0.5">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors duration-120"
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
