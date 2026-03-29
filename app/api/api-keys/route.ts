import type { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth";
import { createApiKey, getApiKeysByUser } from "@/lib/db";

export async function GET() {
  const userId = await requireUserId();
  const keys = await getApiKeysByUser(userId);
  return Response.json(keys);
}

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const body = await request.json();
  const label = body.label ?? "Daemon";
  const { apiKey, rawKey } = await createApiKey(userId, label);
  return Response.json({ ...apiKey, rawKey }, { status: 201 });
}
