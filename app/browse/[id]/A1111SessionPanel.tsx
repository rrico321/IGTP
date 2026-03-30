"use client";

import { useState, useTransition, useEffect } from "react";
import { MonitorPlay, ExternalLink, Loader2, StopCircle } from "lucide-react";

interface Session {
  id: string;
  status: string;
  tunnelUrl: string | null;
  error: string | null;
  expiresAt: string | null;
}

export function A1111SessionPanel({
  machineId,
  machineName,
  isAvailable,
  hasApproval,
}: {
  machineId: string;
  machineName: string;
  isAvailable: boolean;
  hasApproval: boolean;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Poll for session status when we have a pending/active session
  useEffect(() => {
    if (!session || session.status === "ended" || session.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${session.id}/tunnel`);
        if (res.ok) {
          const updated = await res.json();
          setSession(updated);
          if (updated.status === "ended" || updated.status === "failed") {
            clearInterval(interval);
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [session?.id, session?.status]);

  function requestSession() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/machines/${machineId}/sessions`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to request session");
        return;
      }
      setSession(data);
    });
  }

  function stopSession() {
    if (!session) return;
    startTransition(async () => {
      await fetch(`/api/sessions/${session.id}/stop`, { method: "POST" });
      setSession({ ...session, status: "ended" });
    });
  }

  const isActive = session?.status === "active" && session.tunnelUrl;
  const isPendingSession = session?.status === "pending";
  const isFailed = session?.status === "failed";
  const isEnded = session?.status === "ended" || session?.status === "stop_requested";

  return (
    <div className="bg-card border border-border rounded-xl p-6 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 mb-3">
        <MonitorPlay className="w-5 h-5 text-purple-400" />
        <h2 className="text-base font-medium">Stable Diffusion (A1111)</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Launch a remote session to use {machineName}&apos;s GPU for AI image generation.
        You&apos;ll get the full AUTOMATIC1111 web interface.
      </p>

      {/* No active session */}
      {!session && !hasApproval && (
        <div className="py-3 px-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            You need an approved access request to use A1111 on this machine.
            Use the <strong>Request Access</strong> form below, and the machine owner will review it.
          </p>
        </div>
      )}

      {!session && hasApproval && (
        <>
          {isAvailable ? (
            <button
              onClick={requestSession}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? "Requesting…" : "Launch A1111 Session"}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              A1111 is currently at capacity. Try again later.
            </p>
          )}
        </>
      )}

      {/* Pending — waiting for daemon to create tunnel */}
      {isPendingSession && (
        <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/50 border border-border">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Setting up tunnel…</p>
            <p className="text-xs text-muted-foreground">
              The host machine is creating a secure connection. This usually takes 10–30 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Active — show tunnel link */}
      {isActive && (
        <div className="space-y-3">
          <div className="py-3 px-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm font-medium text-green-400 mb-1">Session active</p>
            <a
              href={session.tunnelUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-4 hover:text-purple-400 transition-colors"
            >
              Open A1111 <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {session.expiresAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Expires {new Date(session.expiresAt).toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={stopSession}
            disabled={isPending}
            className="w-full py-2 rounded-xl text-sm font-medium bg-card border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <StopCircle className="w-4 h-4" />
            End Session
          </button>
        </div>
      )}

      {/* Failed */}
      {isFailed && (
        <div className="space-y-3">
          <div className="py-3 px-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm font-medium text-red-400">Session failed</p>
            <p className="text-xs text-muted-foreground mt-1">{session?.error ?? "Unknown error"}</p>
          </div>
          <button
            onClick={() => { setSession(null); setError(null); }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Ended */}
      {isEnded && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center py-2">Session ended.</p>
          <button
            onClick={() => { setSession(null); setError(null); }}
            className="w-full py-2 rounded-xl text-sm font-medium bg-card border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Start new session
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
