"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerateKeyButton() {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Daemon" }),
      });
      const data = await res.json();
      setNewKey(data.rawKey);
    } finally {
      setLoading(false);
    }
  }

  if (newKey) {
    return (
      <div className="space-y-3">
        <div className="bg-green-950/30 border border-green-800 rounded-xl px-5 py-4">
          <p className="text-xs text-green-400 mb-2">
            Copy this key now — you won&apos;t be able to see it again.
          </p>
          <code className="block text-sm font-mono text-green-300 break-all select-all bg-black/30 rounded-lg px-3 py-2">
            {newKey}
          </code>
        </div>
        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newKey); }}>
          Copy to clipboard
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleGenerate} disabled={loading}>
      {loading ? "Generating..." : "Generate API Key"}
    </Button>
  );
}

export function RevokeKeyButton({ keyId }: { keyId: string }) {
  const [revoked, setRevoked] = useState(false);

  async function handleRevoke() {
    if (!confirm("Revoke this API key? Any daemon using it will stop working.")) return;
    await fetch(`/api/api-keys/${keyId}`, { method: "DELETE" });
    setRevoked(true);
  }

  if (revoked) return <span className="text-xs text-red-400">Revoked</span>;

  return (
    <button
      onClick={handleRevoke}
      className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
    >
      Revoke
    </button>
  );
}
