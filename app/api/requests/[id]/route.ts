import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getRequestById, updateRequest, getMachineById, getUserById, createNotification } from "@/lib/db";
import { sendRequestStatusEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getRequestById(id);
  if (!existing) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status, ownerNote } = body;

  const validStatuses = ["pending", "approved", "denied", "completed", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (ownerNote !== undefined) updates.ownerNote = ownerNote;

  const updated = await updateRequest(id, updates);

  // Fire notifications when request moves to a terminal status
  if (status === "approved" || status === "denied") {
    const [machine, requester] = await Promise.all([
      getMachineById(existing.machineId),
      getUserById(existing.requesterId),
    ]);

    const machineName = machine?.name ?? "a machine";
    const type = status === "approved" ? "request_approved" : "request_denied";
    const title = status === "approved"
      ? `Request approved — ${machineName}`
      : `Request denied — ${machineName}`;
    const message = status === "approved"
      ? `Your access request for ${machineName} has been approved.${ownerNote ? ` Owner note: ${ownerNote}` : ""}`
      : `Your access request for ${machineName} has been denied.${ownerNote ? ` Owner note: ${ownerNote}` : ""}`;

    // Create in-app notification (best-effort)
    createNotification({ userId: existing.requesterId, type, title, message, requestId: id }).catch((err) => {
      console.error("[createNotification] failed:", err);
      Sentry.captureException(err, { tags: { context: "createNotification" } });
    });

    // Send email (best-effort, only if Resend is configured)
    if (requester) {
      sendRequestStatusEmail({
        to: requester.email,
        requesterName: requester.name,
        machineName,
        status,
        ownerNote,
      }).catch((err) => {
        console.error("[sendRequestStatusEmail] failed:", err);
        Sentry.captureException(err, { tags: { context: "sendRequestStatusEmail" } });
      });
    }
  }

  return Response.json(updated);
}
