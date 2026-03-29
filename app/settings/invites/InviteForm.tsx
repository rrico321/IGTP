"use client";

import { useActionState, useState } from "react";
import { createInviteAction } from "./actions";

export function InviteForm() {
  const [state, formAction, isPending] = useActionState(createInviteAction, null);
  const [copied, setCopied] = useState(false);

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex gap-2">
        <input
          name="email"
          type="email"
          placeholder="friend@example.com"
          required
          className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isPending ? "Sending…" : "Send invite"}
        </button>
      </form>

      {state && "error" in state && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      {state && "ok" in state && (
        <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Invite link sent. Share it:</p>
            <p className="text-xs font-mono text-foreground/80 truncate">{state.inviteUrl}</p>
          </div>
          <button
            type="button"
            onClick={() => copyLink(state.inviteUrl)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
