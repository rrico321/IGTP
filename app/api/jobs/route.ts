import type { NextRequest } from "next/server";
import { getJobs, createJob, getRequestById, getMachineById } from "@/lib/db";
import { requireUserId, authenticateRequest } from "@/lib/auth";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB per image/PDF

function stripDataUri(input: string): { base64: string } {
  const match = input.match(/^data:[^;]+;base64,([\s\S]+)$/);
  if (match) return { base64: match[1] };
  return { base64: input };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const jobs = await getJobs({
    machineId: searchParams.get("machineId") ?? undefined,
    requesterId: searchParams.get("requesterId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  return Response.json(jobs);
}

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    const authed = await authenticateRequest(request);
    if (!authed) {
      userId = await requireUserId();
    } else {
      userId = authed;
    }
  } catch {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { requestId, command, dockerImage, priority, maxRuntimeSec, vramLimitGb, cpuLimitCores, ramLimitGb, model, prompt, jobType, images } = body;

  // If model and prompt are provided, use prompt as the command for backward compat
  const effectiveCommand = model && prompt ? prompt : command;

  if (!requestId || !effectiveCommand) {
    return Response.json({ error: "Missing required fields: requestId, command" }, { status: 400 });
  }

  // Validate the access request exists, belongs to this user, and is approved
  const accessRequest = await getRequestById(requestId);
  if (!accessRequest) {
    return Response.json({ error: "Access request not found" }, { status: 404 });
  }
  if (accessRequest.requesterId !== userId) {
    return Response.json({ error: "Not your access request" }, { status: 403 });
  }
  if (accessRequest.status !== "approved") {
    return Response.json({ error: "Access request is not approved" }, { status: 400 });
  }
  if (accessRequest.expiresAt && new Date(accessRequest.expiresAt) <= new Date()) {
    return Response.json({ error: "Your access to this machine has expired" }, { status: 403 });
  }

  const machine = await getMachineById(accessRequest.machineId);
  if (!machine) {
    return Response.json({ error: "Machine not found" }, { status: 404 });
  }

  // Validate and store images as-is (PDFs are converted to images by the daemon)
  let processedImages: string | undefined;
  if (images && Array.isArray(images) && images.length > 0) {
    const imageArray: string[] = [];
    for (const raw of images) {
      const { base64 } = stripDataUri(raw);
      const sizeBytes = Math.ceil(base64.length * 0.75);
      if (sizeBytes > MAX_IMAGE_BYTES) {
        return Response.json({ error: `File exceeds ${MAX_IMAGE_BYTES / 1024 / 1024}MB limit` }, { status: 400 });
      }
      imageArray.push(raw); // Store with data URI prefix intact so daemon knows the type
    }
    processedImages = JSON.stringify(imageArray);
  }

  const job = await createJob({
    machineId: accessRequest.machineId,
    requesterId: userId,
    requestId,
    command: effectiveCommand,
    dockerImage: dockerImage ?? "",
    priority: priority != null ? Number(priority) : 5,
    maxRuntimeSec: maxRuntimeSec != null ? Number(maxRuntimeSec) : 3600,
    vramLimitGb: vramLimitGb != null ? Number(vramLimitGb) : null,
    cpuLimitCores: cpuLimitCores != null ? Number(cpuLimitCores) : null,
    ramLimitGb: ramLimitGb != null ? Number(ramLimitGb) : null,
    model: model ?? undefined,
    prompt: prompt ?? undefined,
    jobType: jobType ?? undefined,
    images: processedImages,
  });

  return Response.json(job, { status: 201 });
}
