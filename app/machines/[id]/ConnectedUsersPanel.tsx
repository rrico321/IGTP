"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, UserX, Clock } from "lucide-react";
import { kickUserAction } from "./kick-actions";

interface ConnectedUser {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  expiresAt: string | null;
  purpose: string;
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function UserRow({
  user,
  machineId,
  onKicked,
}: {
  user: ConnectedUser;
  machineId: string;
  onKicked: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [timeLeft, setTimeLeft] = useState(() =>
    user.expiresAt ? formatTimeLeft(user.expiresAt) : "no limit"
  );

  useEffect(() => {
    if (!user.expiresAt) return;
    const update = () => setTimeLeft(formatTimeLeft(user.expiresAt!));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [user.expiresAt]);

  function handleKick() {
    if (!confirm(`Kick ${user.requesterName}? This will end their access and disconnect them.`)) return;
    startTransition(async () => {
      await kickUserAction(user.id, machineId);
      onKicked();
    });
  }

  return (
    <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-muted/30 border border-border">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{user.requesterName}</span>
          <span className="text-xs text-muted-foreground">{user.requesterEmail}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground line-clamp-1">{user.purpose}</span>
          {user.expiresAt && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="w-3 h-3" />
              {timeLeft}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleKick}
        disabled={isPending}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
      >
        <UserX className="w-3 h-3" />
        {isPending ? "Kicking…" : "Kick"}
      </button>
    </div>
  );
}

export function ConnectedUsersPanel({
  users,
  machineId,
}: {
  users: ConnectedUser[];
  machineId: string;
}) {
  const router = useRouter();

  return (
    <div className="bg-card border border-border rounded-xl p-6 ring-1 ring-foreground/5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-base font-medium">Connected Users</h2>
        {users.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">({users.length})</span>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No one is currently connected to this machine.
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              machineId={machineId}
              onKicked={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
