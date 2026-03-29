import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = process.env.EMAIL_FROM ?? "IGTP <noreply@igtp.app>";

export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  inviteUrl: string;
}): Promise<void> {
  const client = getResend();
  if (!client) return;

  const { to, inviterName, inviteUrl } = opts;

  await client.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to IGTP`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 8px;">You're invited to IGTP</h2>
        <p style="color:#374151;">
          <strong>${inviterName}</strong> has invited you to join IGTP — a platform to share
          and access GPU compute with people you trust.
        </p>
        <div style="margin:24px 0;">
          <a href="${inviteUrl}"
             style="display:inline-block;background:#18181b;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
            Accept invitation →
          </a>
        </div>
        <p style="font-size:12px;color:#9ca3af;">
          This invite expires in 7 days. If you didn't expect this, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendRequestStatusEmail(opts: {
  to: string;
  requesterName: string;
  machineName: string;
  status: "approved" | "denied";
  ownerNote?: string;
}): Promise<void> {
  const client = getResend();
  if (!client) return; // Resend not configured — skip silently

  const { to, requesterName, machineName, status, ownerNote } = opts;
  const approved = status === "approved";
  const subject = approved
    ? `✅ Your request for ${machineName} was approved`
    : `❌ Your request for ${machineName} was denied`;

  const noteHtml = ownerNote
    ? `<p style="margin-top:12px;color:#6b7280;font-size:14px;"><strong>Owner note:</strong> ${ownerNote}</p>`
    : "";

  await client.emails.send({
    from: FROM,
    to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 8px;">Hi ${requesterName},</h2>
        <p style="color:#374151;">
          Your access request for <strong>${machineName}</strong> has been
          <strong style="color:${approved ? "#16a34a" : "#dc2626"};">${status}</strong>.
        </p>
        ${noteHtml}
        <p style="margin-top:24px;font-size:13px;color:#9ca3af;">
          Log in to <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://igtp.app"}">IGTP</a>
          to view your requests.
        </p>
      </div>
    `,
  });
}
