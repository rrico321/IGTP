import type { NextRequest } from "next/server";
import { getUsageReport } from "@/lib/db";
import { requireUserId } from "@/lib/auth";

export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? new Date().toISOString().slice(0, 10);

  const report = await getUsageReport(userId, from, to);
  return Response.json(report);
}
