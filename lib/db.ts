import { neon } from "@neondatabase/serverless";
import type { Machine, AccessRequest, User, TrustConnection, Notification, GpuJob, JobUsageSnapshot, UsageReport, Invite, ApiKey, MachineModel, Conversation, ConversationMessage } from "./types";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  return neon(url);
}

// ─── Machines ────────────────────────────────────────────────────────────────

const MACHINE_COLS = `
  id, name, description,
  gpu_model          AS "gpuModel",
  vram_gb            AS "vramGb",
  cpu_model          AS "cpuModel",
  ram_gb             AS "ramGb",
  status,
  owner_id           AS "ownerId",
  last_heartbeat_at  AS "lastHeartbeatAt",
  created_at         AS "createdAt",
  updated_at         AS "updatedAt"
`;

export async function getMachines(): Promise<Machine[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(MACHINE_COLS)} FROM machines ORDER BY created_at DESC
  `;
  return rows as Machine[];
}

export async function getMachineById(id: string): Promise<Machine | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(MACHINE_COLS)} FROM machines WHERE id = ${id}
  `;
  return rows[0] as Machine | undefined;
}

export async function createMachine(
  data: Omit<Machine, "id" | "createdAt" | "updatedAt">
): Promise<Machine> {
  const sql = getSql();
  const id = `machine-${Date.now()}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO machines (id, name, description, gpu_model, vram_gb, cpu_model, ram_gb, status, owner_id, created_at, updated_at)
    VALUES (${id}, ${data.name}, ${data.description}, ${data.gpuModel}, ${data.vramGb},
            ${data.cpuModel}, ${data.ramGb}, ${data.status}, ${data.ownerId}, ${now}, ${now})
    RETURNING ${sql.unsafe(MACHINE_COLS)}
  `;
  return rows[0] as Machine;
}

export async function updateMachine(
  id: string,
  updates: Partial<Omit<Machine, "id" | "createdAt">>
): Promise<Machine | null> {
  const existing = await getMachineById(id);
  if (!existing) return null;

  const sql = getSql();
  const now = new Date().toISOString();
  const merged = { ...existing, ...updates };
  const rows = await sql`
    UPDATE machines SET
      name        = ${merged.name},
      description = ${merged.description},
      gpu_model   = ${merged.gpuModel},
      vram_gb     = ${merged.vramGb},
      cpu_model   = ${merged.cpuModel},
      ram_gb      = ${merged.ramGb},
      status      = ${merged.status},
      updated_at  = ${now}
    WHERE id = ${id}
    RETURNING ${sql.unsafe(MACHINE_COLS)}
  `;
  return rows[0] as Machine;
}

export async function deleteMachine(id: string, ownerId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM machines WHERE id = ${id} AND owner_id = ${ownerId} RETURNING id
  `;
  return rows.length > 0;
}

// ─── Access Requests ──────────────────────────────────────────────────────────

const REQUEST_COLS = `
  id,
  machine_id    AS "machineId",
  requester_id  AS "requesterId",
  purpose,
  estimated_hours AS "estimatedHours",
  status,
  owner_note    AS "ownerNote",
  created_at    AS "createdAt",
  updated_at    AS "updatedAt"
`;

export async function getRequests(): Promise<AccessRequest[]> {
  const sql = getSql();
  const rows = await sql`SELECT ${sql.unsafe(REQUEST_COLS)} FROM access_requests ORDER BY created_at DESC`;
  return rows as AccessRequest[];
}

export async function getRequestById(id: string): Promise<AccessRequest | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(REQUEST_COLS)} FROM access_requests WHERE id = ${id}
  `;
  return rows[0] as AccessRequest | undefined;
}

export async function getRequestsByMachine(machineId: string): Promise<AccessRequest[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(REQUEST_COLS)} FROM access_requests
    WHERE machine_id = ${machineId}
    ORDER BY created_at DESC
  `;
  return rows as AccessRequest[];
}

export async function getRequestsByRequester(requesterId: string): Promise<AccessRequest[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(REQUEST_COLS)} FROM access_requests
    WHERE requester_id = ${requesterId}
    ORDER BY created_at DESC
  `;
  return rows as AccessRequest[];
}

export async function createRequest(
  data: Omit<AccessRequest, "id" | "status" | "createdAt" | "updatedAt">
): Promise<AccessRequest> {
  const sql = getSql();
  const id = `request-${Date.now()}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO access_requests (id, machine_id, requester_id, purpose, estimated_hours, status, owner_note, created_at, updated_at)
    VALUES (${id}, ${data.machineId}, ${data.requesterId}, ${data.purpose}, ${data.estimatedHours},
            'pending', ${data.ownerNote ?? null}, ${now}, ${now})
    RETURNING ${sql.unsafe(REQUEST_COLS)}
  `;
  return rows[0] as AccessRequest;
}

export async function updateRequest(
  id: string,
  updates: Partial<Omit<AccessRequest, "id" | "machineId" | "requesterId" | "createdAt">>
): Promise<AccessRequest | null> {
  const existing = await getRequestById(id);
  if (!existing) return null;

  const sql = getSql();
  const now = new Date().toISOString();
  const merged = { ...existing, ...updates };
  const rows = await sql`
    UPDATE access_requests SET
      purpose         = ${merged.purpose},
      estimated_hours = ${merged.estimatedHours},
      status          = ${merged.status},
      owner_note      = ${merged.ownerNote ?? null},
      updated_at      = ${now}
    WHERE id = ${id}
    RETURNING ${sql.unsafe(REQUEST_COLS)}
  `;
  return rows[0] as AccessRequest;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, email, created_at AS "createdAt"
    FROM users ORDER BY created_at ASC
  `;
  return rows as User[];
}

export async function getUserById(id: string): Promise<User | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, email, created_at AS "createdAt"
    FROM users WHERE id = ${id}
  `;
  return rows[0] as User | undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, name, email, created_at AS "createdAt"
    FROM users WHERE LOWER(email) = LOWER(${email})
  `;
  return rows[0] as User | undefined;
}

export async function createUser(name: string): Promise<User> {
  const sql = getSql();
  const slug = name.toLowerCase().replace(/\s+/g, ".");
  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO users (id, name, email, created_at)
    VALUES (${id}, ${name}, ${slug + "@example.com"}, ${now})
    RETURNING id, name, email, created_at AS "createdAt"
  `;
  return rows[0] as User;
}

export async function createUserWithEmail(name: string, email: string): Promise<User> {
  const sql = getSql();
  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO users (id, name, email, created_at)
    VALUES (${id}, ${name}, ${email}, ${now})
    RETURNING id, name, email, created_at AS "createdAt"
  `;
  return rows[0] as User;
}

// ─── Trust Connections ────────────────────────────────────────────────────────

export async function getTrustConnections(): Promise<TrustConnection[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, user_id AS "userId", trusted_user_id AS "trustedUserId", created_at AS "createdAt"
    FROM trust_connections ORDER BY created_at ASC
  `;
  return rows as TrustConnection[];
}

export async function getTrustedUserIds(userId: string): Promise<string[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT trusted_user_id FROM trust_connections WHERE user_id = ${userId}
  `;
  return rows.map((r) => r.trusted_user_id as string);
}

export async function isTrusted(userId: string, trustedUserId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT 1 FROM trust_connections
    WHERE user_id = ${userId} AND trusted_user_id = ${trustedUserId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function addTrustConnection(
  userId: string,
  trustedUserId: string
): Promise<TrustConnection | null> {
  if (userId === trustedUserId) return null;
  const already = await isTrusted(userId, trustedUserId);
  if (already) return null;

  const sql = getSql();
  const id = `trust-${Date.now()}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO trust_connections (id, user_id, trusted_user_id, created_at)
    VALUES (${id}, ${userId}, ${trustedUserId}, ${now})
    ON CONFLICT (user_id, trusted_user_id) DO NOTHING
    RETURNING id, user_id AS "userId", trusted_user_id AS "trustedUserId", created_at AS "createdAt"
  `;
  return rows.length > 0 ? (rows[0] as TrustConnection) : null;
}

export async function removeTrustConnection(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM trust_connections
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

// ─── Notifications ────────────────────────────────────────────────────────────

const NOTIF_COLS = `
  id,
  user_id     AS "userId",
  type,
  title,
  message,
  request_id  AS "requestId",
  read,
  created_at  AS "createdAt"
`;

export async function getNotificationsForUser(userId: string): Promise<Notification[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(NOTIF_COLS)} FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows as Notification[];
}

export async function getUnreadCountForUser(userId: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM notifications
    WHERE user_id = ${userId} AND read = FALSE
  `;
  return (rows[0] as { count: number }).count;
}

export async function createNotification(data: {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  requestId?: string;
}): Promise<Notification> {
  const sql = getSql();
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO notifications (id, user_id, type, title, message, request_id, read, created_at)
    VALUES (${id}, ${data.userId}, ${data.type}, ${data.title}, ${data.message},
            ${data.requestId ?? null}, FALSE, ${now})
    RETURNING ${sql.unsafe(NOTIF_COLS)}
  `;
  return rows[0] as Notification;
}

export async function markNotificationRead(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE notifications SET read = TRUE
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const sql = getSql();
  await sql`UPDATE notifications SET read = TRUE WHERE user_id = ${userId} AND read = FALSE`;
}

// ─── Machine Heartbeat ────────────────────────────────────────────────────────

export async function updateMachineHeartbeat(id: string, ownerId: string): Promise<Machine | null> {
  const sql = getSql();
  const now = new Date().toISOString();
  const rows = await sql`
    UPDATE machines SET last_heartbeat_at = ${now}
    WHERE id = ${id} AND owner_id = ${ownerId}
    RETURNING ${sql.unsafe(MACHINE_COLS)}
  `;
  return rows.length > 0 ? (rows[0] as Machine) : null;
}

/** Returns true if the machine sent a heartbeat within the last 5 minutes. */
export function isMachineOnline(machine: Pick<Machine, "lastHeartbeatAt">): boolean {
  if (!machine.lastHeartbeatAt) return false;
  return Date.now() - new Date(machine.lastHeartbeatAt).getTime() < 5 * 60 * 1000;
}

// ─── GPU Jobs ─────────────────────────────────────────────────────────────────

const JOB_COLS = `
  id,
  machine_id        AS "machineId",
  requester_id      AS "requesterId",
  request_id        AS "requestId",
  command,
  docker_image      AS "dockerImage",
  priority,
  status,
  max_runtime_sec   AS "maxRuntimeSec",
  vram_limit_gb     AS "vramLimitGb",
  cpu_limit_cores   AS "cpuLimitCores",
  ram_limit_gb      AS "ramLimitGb",
  exit_code         AS "exitCode",
  output_log_url    AS "outputLogUrl",
  output_log        AS "outputLog",
  model,
  prompt,
  job_type          AS "jobType",
  prompt_tokens     AS "promptTokens",
  completion_tokens AS "completionTokens",
  total_tokens      AS "totalTokens",
  conversation_id   AS "conversationId",
  queued_at         AS "queuedAt",
  started_at        AS "startedAt",
  completed_at      AS "completedAt",
  created_at        AS "createdAt",
  updated_at        AS "updatedAt"
`;

export async function getJobs(filters: {
  machineId?: string;
  requesterId?: string;
  status?: string;
}): Promise<GpuJob[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(JOB_COLS)} FROM gpu_jobs
    WHERE (${filters.machineId ?? null}::text IS NULL OR machine_id = ${filters.machineId ?? null})
      AND (${filters.requesterId ?? null}::text IS NULL OR requester_id = ${filters.requesterId ?? null})
      AND (${filters.status ?? null}::text IS NULL OR status = ${filters.status ?? null})
    ORDER BY priority ASC, queued_at ASC
  `;
  return rows as GpuJob[];
}

export async function getJobById(id: string): Promise<GpuJob | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(JOB_COLS)} FROM gpu_jobs WHERE id = ${id}
  `;
  return rows[0] as GpuJob | undefined;
}

export async function createJob(data: {
  machineId: string;
  requesterId: string;
  requestId: string;
  command: string;
  dockerImage?: string;
  priority?: number;
  maxRuntimeSec?: number;
  vramLimitGb?: number | null;
  cpuLimitCores?: number | null;
  ramLimitGb?: number | null;
  model?: string;
  prompt?: string;
  jobType?: string;
  conversationId?: string;
}): Promise<GpuJob> {
  const sql = getSql();
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO gpu_jobs (
      id, machine_id, requester_id, request_id, command, docker_image,
      priority, status, max_runtime_sec, vram_limit_gb, cpu_limit_cores,
      ram_limit_gb, model, prompt, job_type, conversation_id,
      queued_at, created_at, updated_at
    ) VALUES (
      ${id}, ${data.machineId}, ${data.requesterId}, ${data.requestId},
      ${data.command}, ${data.dockerImage ?? ''},
      ${data.priority ?? 5}, 'queued', ${data.maxRuntimeSec ?? 3600},
      ${data.vramLimitGb ?? null}, ${data.cpuLimitCores ?? null},
      ${data.ramLimitGb ?? null},
      ${data.model ?? null}, ${data.prompt ?? null}, ${data.jobType ?? 'chat'},
      ${data.conversationId ?? null},
      ${now}, ${now}, ${now}
    )
    RETURNING ${sql.unsafe(JOB_COLS)}
  `;
  return rows[0] as GpuJob;
}

export async function updateJob(
  id: string,
  updates: Partial<Pick<GpuJob, "status" | "priority" | "exitCode" | "outputLogUrl" | "outputLog" | "model" | "prompt" | "jobType" | "promptTokens" | "completionTokens" | "totalTokens" | "conversationId" | "startedAt" | "completedAt">>
): Promise<GpuJob | null> {
  const existing = await getJobById(id);
  if (!existing) return null;

  const sql = getSql();
  const now = new Date().toISOString();
  const merged = { ...existing, ...updates };
  const rows = await sql`
    UPDATE gpu_jobs SET
      status          = ${merged.status},
      priority        = ${merged.priority},
      exit_code       = ${merged.exitCode ?? null},
      output_log_url  = ${merged.outputLogUrl ?? null},
      output_log      = ${merged.outputLog ?? null},
      model             = ${merged.model ?? null},
      prompt            = ${merged.prompt ?? null},
      job_type          = ${merged.jobType ?? 'chat'},
      prompt_tokens     = ${merged.promptTokens ?? null},
      completion_tokens = ${merged.completionTokens ?? null},
      total_tokens      = ${merged.totalTokens ?? null},
      conversation_id   = ${merged.conversationId ?? null},
      started_at      = ${merged.startedAt ?? null},
      completed_at    = ${merged.completedAt ?? null},
      updated_at      = ${now}
    WHERE id = ${id}
    RETURNING ${sql.unsafe(JOB_COLS)}
  `;
  return rows[0] as GpuJob;
}

/** Fetch the next queued job for a machine (lowest priority number, oldest first). */
export async function getNextQueuedJob(machineId: string): Promise<GpuJob | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(JOB_COLS)} FROM gpu_jobs
    WHERE machine_id = ${machineId} AND status = 'queued'
    ORDER BY priority ASC, queued_at ASC
    LIMIT 1
  `;
  return rows[0] as GpuJob | undefined;
}

/** Atomically claim a queued job as running. Returns null if already claimed by another process. */
export async function claimJobAsRunning(jobId: string): Promise<GpuJob | null> {
  const sql = getSql();
  const now = new Date().toISOString();
  const rows = await sql`
    UPDATE gpu_jobs SET
      status     = 'running',
      started_at = ${now},
      updated_at = ${now}
    WHERE id = ${jobId} AND status = 'queued'
    RETURNING ${sql.unsafe(JOB_COLS)}
  `;
  return rows.length > 0 ? (rows[0] as GpuJob) : null;
}

// ─── Job Usage Snapshots ──────────────────────────────────────────────────────

const SNAPSHOT_COLS = `
  id,
  job_id          AS "jobId",
  sampled_at      AS "sampledAt",
  gpu_util_pct    AS "gpuUtilPct",
  vram_used_gb    AS "vramUsedGb",
  cpu_util_pct    AS "cpuUtilPct",
  ram_used_gb     AS "ramUsedGb"
`;

export async function getSnapshotsForJob(jobId: string): Promise<JobUsageSnapshot[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(SNAPSHOT_COLS)} FROM job_usage_snapshots
    WHERE job_id = ${jobId}
    ORDER BY sampled_at ASC
  `;
  return rows as JobUsageSnapshot[];
}

export async function createSnapshot(data: {
  jobId: string;
  gpuUtilPct?: number | null;
  vramUsedGb?: number | null;
  cpuUtilPct?: number | null;
  ramUsedGb?: number | null;
}): Promise<JobUsageSnapshot> {
  const sql = getSql();
  const id = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO job_usage_snapshots (id, job_id, sampled_at, gpu_util_pct, vram_used_gb, cpu_util_pct, ram_used_gb)
    VALUES (${id}, ${data.jobId}, ${now},
            ${data.gpuUtilPct ?? null}, ${data.vramUsedGb ?? null},
            ${data.cpuUtilPct ?? null}, ${data.ramUsedGb ?? null})
    RETURNING ${sql.unsafe(SNAPSHOT_COLS)}
  `;
  return rows[0] as JobUsageSnapshot;
}

// ─── Usage Report ─────────────────────────────────────────────────────────────

export async function getUsageReport(
  userId: string,
  from: string,
  to: string
): Promise<UsageReport> {
  const sql = getSql();

  const jobRows = await sql`
    SELECT
      j.id,
      j.machine_id        AS "machineId",
      j.status,
      j.started_at        AS "startedAt",
      j.completed_at      AS "completedAt",
      EXTRACT(EPOCH FROM (COALESCE(j.completed_at, NOW()) - j.started_at))::int AS "runtimeSec"
    FROM gpu_jobs j
    WHERE j.requester_id = ${userId}
      AND j.queued_at >= ${from}::timestamptz
      AND j.queued_at < ${to}::timestamptz
  `;

  const snapshotAgg = await sql`
    SELECT
      j.machine_id AS "machineId",
      AVG(s.gpu_util_pct) AS "avgGpuUtil"
    FROM job_usage_snapshots s
    JOIN gpu_jobs j ON j.id = s.job_id
    WHERE j.requester_id = ${userId}
      AND j.queued_at >= ${from}::timestamptz
      AND j.queued_at < ${to}::timestamptz
    GROUP BY j.machine_id
  `;

  const machineMap = new Map<string, { jobs: number; runtimeSec: number }>();
  let totalRuntimeSec = 0;

  for (const row of jobRows) {
    const machineId = row.machineId as string;
    const entry = machineMap.get(machineId) ?? { jobs: 0, runtimeSec: 0 };
    entry.jobs += 1;
    const rt = row.startedAt ? (row.runtimeSec as number) : 0;
    entry.runtimeSec += rt;
    totalRuntimeSec += rt;
    machineMap.set(machineId, entry);
  }

  const avgGpuRows = snapshotAgg as Array<{ machineId: string; avgGpuUtil: number | null }>;
  const overallAvgGpu =
    avgGpuRows.length > 0
      ? Math.round(avgGpuRows.reduce((s, r) => s + (r.avgGpuUtil ?? 0), 0) / avgGpuRows.length)
      : null;

  return {
    userId,
    from,
    to,
    totalJobs: jobRows.length,
    completedJobs: jobRows.filter((r) => r.status === "completed").length,
    failedJobs: jobRows.filter((r) => r.status === "failed").length,
    timedOutJobs: jobRows.filter((r) => r.status === "timed_out").length,
    totalRuntimeSec,
    avgGpuUtilPct: overallAvgGpu,
    machineBreakdown: Array.from(machineMap.entries()).map(([machineId, v]) => ({
      machineId,
      jobs: v.jobs,
      runtimeSec: v.runtimeSec,
    })),
  };
}

// ─── Invites ──────────────────────────────────────────────────────────────────

const INVITE_COLS = `
  id,
  token,
  inviter_id              AS "inviterId",
  invitee_email           AS "inviteeEmail",
  accepted_by_user_id     AS "acceptedByUserId",
  status,
  created_at              AS "createdAt",
  expires_at              AS "expiresAt",
  accepted_at             AS "acceptedAt"
`;

export async function createInvite(
  inviterId: string,
  inviteeEmail: string
): Promise<Invite> {
  const sql = getSql();
  const id = `invite-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const token = `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const rows = await sql`
    INSERT INTO invites (id, token, inviter_id, invitee_email, status, created_at, expires_at)
    VALUES (${id}, ${token}, ${inviterId}, ${inviteeEmail}, 'pending', ${now.toISOString()}, ${expiresAt.toISOString()})
    RETURNING ${sql.unsafe(INVITE_COLS)}
  `;
  return rows[0] as Invite;
}

export async function getInviteByToken(token: string): Promise<Invite | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(INVITE_COLS)} FROM invites WHERE token = ${token}
  `;
  return rows[0] as Invite | undefined;
}

export async function getInvitesByInviter(inviterId: string): Promise<Invite[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(INVITE_COLS)} FROM invites
    WHERE inviter_id = ${inviterId}
    ORDER BY created_at DESC
  `;
  return rows as Invite[];
}

export async function acceptInvite(
  token: string,
  acceptedByUserId: string
): Promise<Invite | null> {
  const sql = getSql();
  const now = new Date().toISOString();
  const rows = await sql`
    UPDATE invites SET
      status               = 'accepted',
      accepted_by_user_id  = ${acceptedByUserId},
      accepted_at          = ${now}
    WHERE token = ${token}
      AND status = 'pending'
      AND expires_at > NOW()
    RETURNING ${sql.unsafe(INVITE_COLS)}
  `;
  return rows.length > 0 ? (rows[0] as Invite) : null;
}

/** Returns all users who were directly invited by this user (accepted invites). */
export async function getReferralsByInviter(inviterId: string): Promise<User[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.created_at AS "createdAt"
    FROM invites i
    JOIN users u ON u.id = i.accepted_by_user_id
    WHERE i.inviter_id = ${inviterId} AND i.status = 'accepted'
    ORDER BY i.accepted_at ASC
  `;
  return rows as User[];
}

/** Returns the inviter of a given user (who invited them), if any. */
export async function getInviterOfUser(userId: string): Promise<User | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.created_at AS "createdAt"
    FROM invites i
    JOIN users u ON u.id = i.inviter_id
    WHERE i.accepted_by_user_id = ${userId} AND i.status = 'accepted'
    LIMIT 1
  `;
  return rows[0] as User | undefined;
}

// ─── Machine Models ──────────────────────────────────────────────────────────

const MODEL_COLS = `
  machine_id  AS "machineId",
  model_name  AS "modelName",
  model_type  AS "modelType",
  size_bytes  AS "sizeBytes",
  updated_at  AS "updatedAt"
`;

export async function getModelsForMachine(machineId: string): Promise<MachineModel[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(MODEL_COLS)} FROM machine_models
    WHERE machine_id = ${machineId}
    ORDER BY model_name ASC
  `;
  return rows as MachineModel[];
}

export async function syncMachineModels(
  machineId: string,
  models: Array<{ name: string; type: string; sizeBytes: number }>
): Promise<void> {
  const sql = getSql();
  const now = new Date().toISOString();

  // Delete models no longer present
  const modelNames = models.map((m) => m.name);
  if (modelNames.length > 0) {
    await sql`
      DELETE FROM machine_models
      WHERE machine_id = ${machineId}
        AND model_name != ALL(${modelNames})
    `;
  } else {
    await sql`DELETE FROM machine_models WHERE machine_id = ${machineId}`;
  }

  // Upsert current models
  for (const m of models) {
    await sql`
      INSERT INTO machine_models (machine_id, model_name, model_type, size_bytes, updated_at)
      VALUES (${machineId}, ${m.name}, ${m.type}, ${m.sizeBytes}, ${now})
      ON CONFLICT (machine_id, model_name) DO UPDATE SET
        model_type = ${m.type},
        size_bytes = ${m.sizeBytes},
        updated_at = ${now}
    `;
  }
}

// ─── API Keys ────────────────────────────────────────────────────────────────

async function hashApiKey(key: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): string {
  const segments = Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 8)
  );
  return `igtp_${segments.join("_")}`;
}

const API_KEY_COLS = `
  id,
  user_id      AS "userId",
  key_prefix   AS "keyPrefix",
  label,
  last_used_at AS "lastUsedAt",
  created_at   AS "createdAt"
`;

export async function createApiKey(userId: string, label: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
  const sql = getSql();
  const rawKey = generateApiKey();
  const id = `apikey-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO api_keys (id, user_id, key_hash, key_prefix, label, created_at)
    VALUES (${id}, ${userId}, ${await hashApiKey(rawKey)}, ${rawKey.slice(0, 9)}, ${label}, ${now})
    RETURNING ${sql.unsafe(API_KEY_COLS)}
  `;
  return { apiKey: rows[0] as ApiKey, rawKey };
}

export async function getApiKeysByUser(userId: string): Promise<ApiKey[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(API_KEY_COLS)} FROM api_keys
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows as ApiKey[];
}

export async function validateApiKey(rawKey: string): Promise<string | null> {
  const sql = getSql();
  const hash = await hashApiKey(rawKey);
  const rows = await sql`
    SELECT user_id, id FROM api_keys WHERE key_hash = ${hash}
  `;
  if (rows.length === 0) return null;
  // Update last_used_at (fire-and-forget)
  const now = new Date().toISOString();
  sql`UPDATE api_keys SET last_used_at = ${now} WHERE id = ${rows[0].id}`.catch(() => {});
  return rows[0].user_id as string;
}

export async function deleteApiKey(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM api_keys WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;
  return rows.length > 0;
}

// ─── Conversations ───────────────────────────────────────────────────────────

const CONV_COLS = `
  id,
  user_id      AS "userId",
  machine_id   AS "machineId",
  request_id   AS "requestId",
  model,
  title,
  total_tokens AS "totalTokens",
  created_at   AS "createdAt",
  updated_at   AS "updatedAt"
`;

const CONV_MSG_COLS = `
  id,
  conversation_id AS "conversationId",
  role,
  content,
  job_id          AS "jobId",
  tokens,
  created_at      AS "createdAt"
`;

export async function getConversationsByUser(userId: string): Promise<Conversation[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(CONV_COLS)} FROM conversations
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return rows as Conversation[];
}

export async function getConversationById(id: string): Promise<Conversation | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(CONV_COLS)} FROM conversations WHERE id = ${id}
  `;
  return rows[0] as Conversation | undefined;
}

export async function createConversation(data: {
  userId: string;
  machineId: string;
  requestId: string;
  model: string;
  title?: string;
}): Promise<Conversation> {
  const sql = getSql();
  const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO conversations (id, user_id, machine_id, request_id, model, title, created_at, updated_at)
    VALUES (${id}, ${data.userId}, ${data.machineId}, ${data.requestId}, ${data.model},
            ${data.title ?? 'New conversation'}, ${now}, ${now})
    RETURNING ${sql.unsafe(CONV_COLS)}
  `;
  return rows[0] as Conversation;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`UPDATE conversations SET title = ${title}, updated_at = ${now} WHERE id = ${id}`;
}

export async function updateConversationTokens(id: string, additionalTokens: number): Promise<void> {
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    UPDATE conversations SET total_tokens = total_tokens + ${additionalTokens}, updated_at = ${now}
    WHERE id = ${id}
  `;
}

export async function deleteConversation(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM conversations WHERE id = ${id} AND user_id = ${userId} RETURNING id
  `;
  return rows.length > 0;
}

export async function getMessagesForConversation(conversationId: string): Promise<ConversationMessage[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(CONV_MSG_COLS)} FROM conversation_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
  return rows as ConversationMessage[];
}

export async function addConversationMessage(data: {
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  jobId?: string;
  tokens?: number;
}): Promise<ConversationMessage> {
  const sql = getSql();
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO conversation_messages (id, conversation_id, role, content, job_id, tokens, created_at)
    VALUES (${id}, ${data.conversationId}, ${data.role}, ${data.content},
            ${data.jobId ?? null}, ${data.tokens ?? null}, ${now})
    RETURNING ${sql.unsafe(CONV_MSG_COLS)}
  `;
  return rows[0] as ConversationMessage;
}
