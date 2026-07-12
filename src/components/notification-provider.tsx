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
  success: "text-green-400 border-green-400/20 bg-green-400/5",
  error: "text-red-400 border-red-400/20 bg-red-400/5",
  warning: "text-amber-400 border-amber-400/20 bg-amber-400/5",
  info: "text-blue-400 border-blue-400/20 bg-blue-400/5",
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
              "pointer-events-auto animate-slide-in-right border rounded-[10px] p-3 flex items-start gap-3",
              colorMap[n.type]
            )}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#e5e5e5]">{n.title}</p>
              <p className="text-[12px] text-[#a3a3a3] mt-0.5">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-[#737373] hover:text-[#e5e5e5] transition-colors duration-120"
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
