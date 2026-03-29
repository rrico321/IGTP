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
      className="w-full text-xs px-3 py-1.5 border border-border rounded-lg hover:border-red-500/50 text-red-400 hover:text-red-300 cursor-pointer transition-colors disabled:opacity-50"
    >
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
