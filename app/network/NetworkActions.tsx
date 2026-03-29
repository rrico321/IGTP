"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddFriendButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const router = useRouter();

  async function handleAdd() {
    setStatus("sending");
    try {
      await fetch("/api/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trustedUserId: userId }),
      });
      setStatus("sent");
      router.refresh();
    } catch {
      setStatus("idle");
    }
  }

  if (status === "sent") return <span className="text-xs text-green-400">Added</span>;

  return (
    <button
      onClick={handleAdd}
      disabled={status === "sending"}
      className="text-xs px-3 py-1 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-colors"
    >
      {status === "sending" ? "Adding..." : "Add to Network"}
    </button>
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
