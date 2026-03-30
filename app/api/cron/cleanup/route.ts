import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Stale threshold: cancel pending requests older than 7 days
const STALE_DAYS = 7;

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 500 });
  }

  const sql = neon(url);
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const cancelled = await sql`
    UPDATE access_requests
    SET status = 'cancelled', updated_at = NOW()
    WHERE status = 'pending'
      AND created_at < ${cutoff}
    RETURNING id
  `;

  // Expire approved requests that have passed their expiry time
  const expired = await sql`
    UPDATE access_requests
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'approved'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
    RETURNING id
  `;

  return NextResponse.json({
    cancelled: cancelled.length,
    expired: expired.length,
    cutoff,
  });
}
