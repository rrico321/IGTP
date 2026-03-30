"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, LogOut } from "lucide-react";

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

export function AccessTimer({
  expiresAt,
  requestId,
  machineId,
}: {
  expiresAt: string;
  requestId: string;
  machineId: string;
}) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(expiresAt));
  const [expired, setExpired] = useState(() => new Date(expiresAt).getTime() <= Date.now());
  const [warning, setWarning] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setExpired(true);
      } else {
        setTimeLeft(formatTimeLeft(expiresAt));
        setWarning(diff < 15 * 60 * 1000);
      }
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  function handleDisconnect() {
    if (!confirm("Disconnect from this machine? Your active sessions will be ended.")) return;
    startTransition(async () => {
      // End the access request
      await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      // Notify daemon to kill tunnels
      await fetch(`/api/machines/${machineId}/kick`, {
        method: "POST",
      }).catch(() => {});
      router.refresh();
    });
  }

  if (expired) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
        <Clock className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm text-red-400 font-medium">Access expired</span>
        <span className="text-xs text-muted-foreground ml-auto">Submit a new request to continue</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border mb-4 ${
      warning
        ? 'bg-orange-500/10 border-orange-500/20'
        : 'bg-green-500/10 border-green-500/20'
    }`}>
      <CheckCircle className={`w-4 h-4 shrink-0 ${warning ? 'text-orange-400' : 'text-green-400'}`} />
      <span className={`text-sm font-medium ${warning ? 'text-orange-400' : 'text-green-400'}`}>
        Access granted
      </span>
      <span className={`text-xs ${warning ? 'text-orange-400' : 'text-muted-foreground'}`}>
        {timeLeft}
      </span>
      <button
        onClick={handleDisconnect}
        disabled={isPending}
        className="ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors cursor-pointer"
      >
        <LogOut className="w-3 h-3" />
        {isPending ? "Ending…" : "Disconnect"}
      </button>
    </div>
  );
}
