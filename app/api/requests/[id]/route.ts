import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getRequestById, updateRequest, getMachineById, getUserById, createNotification } from "@/lib/db";
import { sendRequestStatusEmail } from "@/lib/email";
import { requireUserId } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getRequestById(id);
  if (!existing) {
    return Response.json({ error: "Request not found" }, { status: 404 });
  }

  const machine = await getMachineById(existing.machineId);
  const isOwner = machine && machine.ownerId === userId;
  const isRequester = existing.requesterId === userId;

  if (!isOwner && !isRequester) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { status, ownerNote } = body;

  // Requester can only complete/cancel their own requests
  if (isRequester && !isOwner && status && !["completed", "cancelled"].includes(status)) {
    return Response.json({ error: "You can only complete or cancel your own requests" }, { status: 403 });
  }

  const validStatuses = ["pending", "approved", "denied", "completed", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (ownerNote !== undefined) updates.ownerNote = ownerNote;

  const updated = await updateRequest(id, updates);

  // Fire notifications when request moves to a terminal status
  if ((status === "approved" || status === "denied") && machine) {
    const requester = await getUserById(existing.requesterId);

    const machineName = machine.name;
    const type = status === "approved" ? "request_approved" : "request_denied";
    const title = status === "approved"
      ? `Request approved — ${machineName}`
      : `Request denied — ${machineName}`;
    const expiryNote = updated?.expiresAt
      ? ` Access expires ${new Date(updated.expiresAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`
      : "";
    const message = status === "approved"
      ? `Your access request for ${machineName} has been approved.${expiryNote}${ownerNote ? ` Owner note: ${ownerNote}` : ""}`
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
