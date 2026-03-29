"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AcceptInviteForm({
  token,
  inviteeEmail,
}: {
  token: string;
  inviteeEmail: string;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/invites/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "account_exists") {
          router.push("/login?reason=invite_existing_account");
          return;
        }
        setError(data.message ?? data.error ?? "Something went wrong.");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Your email
        </label>
        <input
          type="text"
          value={inviteeEmail}
          disabled
          className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-muted-foreground cursor-not-allowed"
        />
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-xs font-medium text-muted-foreground mb-1.5"
        >
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jane Smith"
          required
          autoFocus
          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/50"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="w-full py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Joining…" : "Accept invitation & join"}
      </button>
    </form>
  );
}
