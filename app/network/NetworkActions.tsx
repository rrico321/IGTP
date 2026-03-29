"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FriendRequest } from "@/lib/types";

export function AddFriendButton({ userId, friendRequests }: { userId: string; friendRequests: FriendRequest[] }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const router = useRouter();

  // Check if there's already a pending request for this user
  const existingRequest = friendRequests.find(
    (fr) =>
      fr.status === "pending" &&
      (fr.toUserId === userId || fr.fromUserId === userId)
  );

  async function handleAdd() {
    setStatus("sending");
    try {
      await fetch("/api/friend-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: userId }),
      });
      setStatus("sent");
      router.refresh();
    } catch {
      setStatus("idle");
    }
  }

  if (existingRequest) return <span className="text-xs text-yellow-400">Pending</span>;
  if (status === "sent") return <span className="text-xs text-yellow-400">Requested</span>;

  return (
    <button
      onClick={handleAdd}
      disabled={status === "sending"}
      className="text-xs px-3 py-1 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-colors"
    >
      {status === "sending" ? "Sending..." : "Add to Network"}
    </button>
  );
}

export function PendingRequests({ requests, users }: { requests: FriendRequest[]; users: Map<string, { name: string; email: string }> }) {
  const router = useRouter();

  async function handleAction(id: string, action: "accept" | "deny") {
    await fetch(`/api/friend-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const sender = users.get(req.fromUserId);
        return (
          <PendingRequestRow
            key={req.id}
            request={req}
            senderName={sender?.name ?? "Unknown"}
            senderEmail={sender?.email ?? ""}
            onAction={handleAction}
          />
        );
      })}
    </div>
  );
}

function PendingRequestRow({
  request,
  senderName,
  senderEmail,
  onAction,
}: {
  request: FriendRequest;
  senderName: string;
  senderEmail: string;
  onAction: (id: string, action: "accept" | "deny") => Promise<void>;
}) {
  const [acting, setActing] = useState<"accept" | "deny" | null>(null);
  const [done, setDone] = useState<"accepted" | "denied" | null>(null);

  async function handle(action: "accept" | "deny") {
    setActing(action);
    await onAction(request.id, action);
    setDone(action === "accept" ? "accepted" : "denied");
    setActing(null);
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-3 ring-1 ring-foreground/5">
      <div>
        <div className="font-medium text-sm text-foreground">{senderName}</div>
        {senderEmail && <div className="text-xs text-muted-foreground">{senderEmail}</div>}
      </div>
      {done ? (
        <span className={`text-xs ${done === "accepted" ? "text-green-400" : "text-red-400"}`}>
          {done === "accepted" ? "Accepted" : "Denied"}
        </span>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => handle("accept")}
            disabled={acting !== null}
            className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {acting === "accept" ? "..." : "Accept"}
          </button>
          <button
            onClick={() => handle("deny")}
            disabled={acting !== null}
            className="text-xs px-3 py-1 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 disabled:opacity-50 transition-colors"
          >
            {acting === "deny" ? "..." : "Deny"}
          </button>
        </div>
      )}
    </div>
  );
}

export function RemoveFriendButton({ connectionId }: { connectionId: string }) {
  const [removed, setRemoved] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    if (!confirm("Remove this person from your trust network?")) return;
    await fetch(`/api/trust/${connectionId}`, { method: "DELETE" });
    setRemoved(true);
    router.refresh();
  }

  if (removed) return <span className="text-xs text-red-400">Removed</span>;

  return (
    <button
      onClick={handleRemove}
      className="text-xs text-muted-foreground/50 hover:text-red-400 transition-colors"
    >
      Remove
    </button>
  );
}

export function InviteByEmail() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError("");

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus("sent");
        setEmail("");
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to send invite");
        setStatus("error");
      }
    } catch {
      setError("Network error");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setStatus("idle"); }}
        placeholder="friend@example.com"
        className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-foreground/20"
      />
      <button
        type="submit"
        disabled={status === "sending" || !email.trim()}
        className="px-4 py-2 text-sm bg-foreground text-background rounded-lg font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors shrink-0"
      >
        {status === "sending" ? "Sending..." : status === "sent" ? "Sent!" : "Send Invite"}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </form>
  );
}
