"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteMachineButton({ machineId }: { machineId: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this machine? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/machines/${machineId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete machine.");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
