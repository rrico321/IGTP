import type { NextRequest } from "next/server";
import { getRequestsByRequester } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const requesterId = searchParams.get("requesterId");

  if (!requesterId) {
    return Response.json(
      { error: "Missing required query param: requesterId" },
      { status: 400 }
    );
  }

  const requests = getRequestsByRequester(requesterId);
  return Response.json(requests);
}
