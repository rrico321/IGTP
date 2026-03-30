import { neon } from "@neondatabase/serverless";
import type { Machine, AccessRequest, User, TrustConnection, Notification, GpuJob, JobUsageSnapshot, UsageReport, Invite, ApiKey, MachineModel, Conversation, ConversationMessage, FriendRequest, A1111Session, DashboardStats } from "./types";

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
  a1111_enabled      AS "a1111Enabled",
  a1111_available    AS "a1111Available",
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
  // Verify ownership first
  const check = await sql`SELECT id FROM machines WHERE id = ${id} AND owner_id = ${ownerId}`;
  if (check.length === 0) return false;

  // Clean up related records (foreign key constraints)
  await sql`DELETE FROM a1111_sessions WHERE machine_id = ${id}`;
  await sql`DELETE FROM machine_models WHERE machine_id = ${id}`;
  await sql`DELETE FROM gpu_jobs WHERE machine_id = ${id}`;
  await sql`DELETE FROM access_requests WHERE machine_id = ${id}`;
  await sql`DELETE FROM machines WHERE id = ${id}`;
  return true;
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
  approved_at   AS "approvedAt",
  expires_at    AS "expiresAt",
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

export async function hasApprovedRequest(machineId: string, requesterId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    SELECT 1 FROM access_requests
    WHERE machine_id = ${machineId} AND requester_id = ${requesterId} AND status = 'approved'
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getApprovedRequest(machineId: string, requesterId: string): Promise<AccessRequest | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(REQUEST_COLS)} FROM access_requests
    WHERE machine_id = ${machineId} AND requester_id = ${requesterId} AND status = 'approved'
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY expires_at DESC NULLS FIRST
    LIMIT 1
  `;
  return rows[0] as AccessRequest | undefined;
}

export async function expireOldRequests(): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    UPDATE access_requests SET status = 'expired', updated_at = NOW()
    WHERE status = 'approved' AND expires_at IS NOT NULL AND expires_at <= NOW()
    RETURNING id
  `;
  return rows.length;
}

export async function getConnectedUsersForMachine(machineId: string): Promise<Array<AccessRequest & { requesterName: string; requesterEmail: string }>> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      ar.id, ar.machine_id AS "machineId", ar.requester_id AS "requesterId",
      ar.purpose, ar.estimated_hours AS "estimatedHours", ar.status,
      ar.owner_note AS "ownerNote", ar.approved_at AS "approvedAt",
      ar.expires_at AS "expiresAt", ar.created_at AS "createdAt", ar.updated_at AS "updatedAt",
      u.name AS "requesterName", u.email AS "requesterEmail"
    FROM access_requests ar
    JOIN users u ON u.id = ar.requester_id
    WHERE ar.machine_id = ${machineId}
      AND ar.status = 'approved'
      AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
    ORDER BY ar.expires_at ASC NULLS LAST
  `;
  return rows as any[];
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
  data: Omit<AccessRequest, "id" | "status" | "createdAt" | "updatedAt" | "approvedAt" | "expiresAt">
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

  // When approving, set approved_at and calculate expires_at
  let approvedAt = existing.approvedAt;
  let expiresAt = existing.expiresAt;
  if (updates.status === "approved" && !existing.approvedAt) {
    approvedAt = now;
    const hours = existing.estimatedHours || 1;
    const isExtension = existing.purpose.startsWith("[Extension]");

    if (isExtension) {
      // Find existing approved request for same user+machine and extend it
      const existingApproved = await getApprovedRequest(existing.machineId, existing.requesterId);
      if (existingApproved?.expiresAt) {
        // Add hours to the existing expiry (or from now if already expired)
        const base = Math.max(new Date(existingApproved.expiresAt).getTime(), Date.now());
        const newExpiry = new Date(base + hours * 60 * 60 * 1000).toISOString();
        // Update the original approved request's expiry
        await sql`
          UPDATE access_requests SET expires_at = ${newExpiry}, updated_at = ${now}
          WHERE id = ${existingApproved.id}
        `;
      }
      // Mark extension request as completed (it extended the original)
      expiresAt = null;
    } else {
      expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
  }

  const rows = await sql`
    UPDATE access_requests SET
      purpose         = ${merged.purpose},
      estimated_hours = ${merged.estimatedHours},
      status          = ${merged.status},
      owner_note      = ${merged.ownerNote ?? null},
      approved_at     = ${approvedAt ?? null},
      expires_at      = ${expiresAt ?? null},
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

async function hashPassword(password: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(password).digest("hex");
}

export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const sql = getSql();
  const hash = await hashPassword(password);
  const rows = await sql`
    SELECT 1 FROM users WHERE id = ${userId} AND password_hash = ${hash}
  `;
  return rows.length > 0;
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const sql = getSql();
  const hash = await hashPassword(newPassword);
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
}

export async function createUser(name: string, password: string = "Welcome123"): Promise<User> {
  const sql = getSql();
  const slug = name.toLowerCase().replace(/\s+/g, ".");
  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const pwHash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (${id}, ${name}, ${slug + "@example.com"}, ${pwHash}, ${now})
    RETURNING id, name, email, created_at AS "createdAt"
  `;
  return rows[0] as User;
}

export async function createUserWithEmail(name: string, email: string, password: string = "Welcome123"): Promise<User> {
  const sql = getSql();
  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  const pwHash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (${id}, ${name}, ${email}, ${pwHash}, ${now})
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
  friend_request_id AS "friendRequestId",
  link_url    AS "linkUrl",
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
  friendRequestId?: string;
  linkUrl?: string;
}): Promise<Notification> {
  const sql = getSql();
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO notifications (id, user_id, type, title, message, request_id, friend_request_id, link_url, read, created_at)
    VALUES (${id}, ${data.userId}, ${data.type}, ${data.title}, ${data.message},
            ${data.requestId ?? null}, ${data.friendRequestId ?? null}, ${data.linkUrl ?? null}, FALSE, ${now})
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

export async function updateMachineHeartbeat(
  id: string,
  ownerId: string,
  extra?: { a1111Enabled?: boolean; a1111Available?: boolean }
): Promise<Machine | null> {
  const sql = getSql();
  const now = new Date().toISOString();
  const a1111Enabled = extra?.a1111Enabled ?? false;
  const a1111Available = extra?.a1111Available ?? false;
  const rows = await sql`
    UPDATE machines SET last_heartbeat_at = ${now},
      a1111_enabled = ${a1111Enabled},
      a1111_available = ${a1111Available}
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

export async function getAllMachineModels(): Promise<MachineModel[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(MODEL_COLS)} FROM machine_models
    ORDER BY machine_id, model_name ASC
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

// ─── Friend Requests ─────────────────────────────────────────────────────────

const FRIEND_REQ_COLS = `
  id,
  from_user_id AS "fromUserId",
  to_user_id   AS "toUserId",
  status,
  created_at   AS "createdAt"
`;

export async function createFriendRequest(fromUserId: string, toUserId: string): Promise<FriendRequest> {
  const sql = getSql();
  const id = `freq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO friend_requests (id, from_user_id, to_user_id, status, created_at)
    VALUES (${id}, ${fromUserId}, ${toUserId}, 'pending', ${now})
    ON CONFLICT (from_user_id, to_user_id) DO NOTHING
    RETURNING ${sql.unsafe(FRIEND_REQ_COLS)}
  `;
  return rows[0] as FriendRequest;
}

export async function getFriendRequestsForUser(userId: string): Promise<FriendRequest[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(FRIEND_REQ_COLS)} FROM friend_requests
    WHERE (to_user_id = ${userId} OR from_user_id = ${userId})
    ORDER BY created_at DESC
  `;
  return rows as FriendRequest[];
}

export async function getPendingFriendRequestsForUser(userId: string): Promise<FriendRequest[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(FRIEND_REQ_COLS)} FROM friend_requests
    WHERE to_user_id = ${userId} AND status = 'pending'
    ORDER BY created_at DESC
  `;
  return rows as FriendRequest[];
}

export async function acceptFriendRequest(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const now = new Date().toISOString();
  // Only the recipient can accept
  const rows = await sql`
    UPDATE friend_requests SET status = 'accepted'
    WHERE id = ${id} AND to_user_id = ${userId} AND status = 'pending'
    RETURNING ${sql.unsafe(FRIEND_REQ_COLS)}
  `;
  if (rows.length === 0) return false;

  const req = rows[0] as FriendRequest;

  // Create bidirectional trust connections
  const trustId1 = `trust-${Date.now()}-a`;
  const trustId2 = `trust-${Date.now()}-b`;
  await sql`
    INSERT INTO trust_connections (id, user_id, trusted_user_id, created_at)
    VALUES (${trustId1}, ${req.fromUserId}, ${req.toUserId}, ${now})
    ON CONFLICT (user_id, trusted_user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO trust_connections (id, user_id, trusted_user_id, created_at)
    VALUES (${trustId2}, ${req.toUserId}, ${req.fromUserId}, ${now})
    ON CONFLICT (user_id, trusted_user_id) DO NOTHING
  `;

  return true;
}

export async function denyFriendRequest(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE friend_requests SET status = 'denied'
    WHERE id = ${id} AND to_user_id = ${userId} AND status = 'pending'
    RETURNING id
  `;
  return rows.length > 0;
}

// ─── A1111 Sessions ──────────────────────────────────────────────────────────

const SESSION_COLS = `
  id,
  machine_id    AS "machineId",
  requester_id  AS "requesterId",
  status,
  tunnel_url    AS "tunnelUrl",
  error,
  expires_at    AS "expiresAt",
  created_at    AS "createdAt",
  updated_at    AS "updatedAt"
`;

export async function createA1111Session(machineId: string, requesterId: string): Promise<A1111Session> {
  const sql = getSql();
  const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const rows = await sql`
    INSERT INTO a1111_sessions (id, machine_id, requester_id, status, created_at, updated_at)
    VALUES (${id}, ${machineId}, ${requesterId}, 'pending', ${now}, ${now})
    RETURNING ${sql.unsafe(SESSION_COLS)}
  `;
  return rows[0] as A1111Session;
}

export async function getSessionsForMachine(machineId: string): Promise<A1111Session[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(SESSION_COLS)} FROM a1111_sessions
    WHERE machine_id = ${machineId} AND status IN ('pending', 'active', 'stop_requested')
    ORDER BY created_at DESC
  `;
  return rows as A1111Session[];
}

export async function getSessionById(id: string): Promise<A1111Session | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(SESSION_COLS)} FROM a1111_sessions WHERE id = ${id}
  `;
  return rows[0] as A1111Session | undefined;
}

export async function getActiveSessionForRequester(requesterId: string): Promise<A1111Session | undefined> {
  const sql = getSql();
  const rows = await sql`
    SELECT ${sql.unsafe(SESSION_COLS)} FROM a1111_sessions
    WHERE requester_id = ${requesterId} AND status IN ('pending', 'active')
    ORDER BY created_at DESC LIMIT 1
  `;
  return rows[0] as A1111Session | undefined;
}

export async function updateSessionTunnel(
  id: string,
  data: { tunnelUrl?: string | null; status?: string; error?: string; expiresAt?: string }
): Promise<A1111Session | undefined> {
  const sql = getSql();
  const now = new Date().toISOString();
  const rows = await sql`
    UPDATE a1111_sessions SET
      tunnel_url = COALESCE(${data.tunnelUrl ?? null}, tunnel_url),
      status = COALESCE(${data.status ?? null}, status),
      error = COALESCE(${data.error ?? null}, error),
      expires_at = COALESCE(${data.expiresAt ?? null}::timestamptz, expires_at),
      updated_at = ${now}
    WHERE id = ${id}
    RETURNING ${sql.unsafe(SESSION_COLS)}
  `;
  return rows[0] as A1111Session | undefined;
}

export async function requestStopSession(id: string, userId: string): Promise<boolean> {
  const sql = getSql();
  // Allow the requester or the machine owner to stop
  const rows = await sql`
    UPDATE a1111_sessions SET status = 'stop_requested', updated_at = NOW()
    WHERE id = ${id} AND status IN ('pending', 'active')
      AND (requester_id = ${userId} OR machine_id IN (
        SELECT id FROM machines WHERE owner_id = ${userId}
      ))
    RETURNING id
  `;
  return rows.length > 0;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string, since?: string): Promise<DashboardStats> {
  const sql = getSql();

  const sinceFilter = since ?? null;

  const [
    networkSizeRows,
    machinesOnlineRows,
    totalModelsRows,
    tokensUsedRows,
    tokensServedRows,
    conversationCountRows,
    jobsCompletedRows,
    topModelsUsedRows,
    myMachineStatsRows,
    myMachineTopModelRows,
    myMachineConnectionRows,
    popularMachinesRows,
    popularModelsRows,
    pendingFriendRows,
    pendingAccessRows,
    a1111SessionCountRows,
    a1111TotalMinutesRows,
    activeConnectionRows,
    pendingOutboundRows,
  ] = await Promise.all([
    // networkSize — count of trusted user IDs (all-time)
    sql`
      SELECT COUNT(*)::int AS "networkSize"
      FROM trust_connections
      WHERE user_id = ${userId}
    `,

    // machinesOnline — machines in network online now (all-time)
    sql`
      SELECT COUNT(*)::int AS "machinesOnline"
      FROM machines
      WHERE owner_id IN (
        SELECT trusted_user_id FROM trust_connections WHERE user_id = ${userId}
      )
        AND last_heartbeat_at IS NOT NULL
        AND last_heartbeat_at > NOW() - INTERVAL '5 minutes'
    `,

    // totalModelsAvailable — distinct models across network machines (all-time)
    sql`
      SELECT COUNT(DISTINCT mm.model_name)::int AS "totalModelsAvailable"
      FROM machine_models mm
      JOIN machines m ON m.id = mm.machine_id
      WHERE m.owner_id IN (
        SELECT trusted_user_id FROM trust_connections WHERE user_id = ${userId}
      )
    `,

    // tokensUsed — sum total_tokens as requester (time-filtered)
    sql`
      SELECT COALESCE(SUM(total_tokens), 0)::bigint AS "tokensUsed"
      FROM gpu_jobs
      WHERE requester_id = ${userId}
        AND (${sinceFilter}::timestamptz IS NULL OR queued_at >= ${sinceFilter}::timestamptz)
    `,

    // tokensServed — sum total_tokens on user's machines (time-filtered)
    sql`
      SELECT COALESCE(SUM(j.total_tokens), 0)::bigint AS "tokensServed"
      FROM gpu_jobs j
      JOIN machines m ON m.id = j.machine_id
      WHERE m.owner_id = ${userId}
        AND (${sinceFilter}::timestamptz IS NULL OR j.queued_at >= ${sinceFilter}::timestamptz)
    `,

    // conversationCount (time-filtered)
    sql`
      SELECT COUNT(*)::int AS "conversationCount"
      FROM conversations
      WHERE user_id = ${userId}
        AND (${sinceFilter}::timestamptz IS NULL OR created_at >= ${sinceFilter}::timestamptz)
    `,

    // jobsCompleted as requester (time-filtered)
    sql`
      SELECT COUNT(*)::int AS "jobsCompleted"
      FROM gpu_jobs
      WHERE requester_id = ${userId}
        AND status = 'completed'
        AND (${sinceFilter}::timestamptz IS NULL OR queued_at >= ${sinceFilter}::timestamptz)
    `,

    // topModelsUsed — top 5 models by job count as requester (time-filtered)
    sql`
      SELECT
        model,
        COUNT(*)::int AS "jobCount",
        COALESCE(SUM(total_tokens), 0)::bigint AS "totalTokens"
      FROM gpu_jobs
      WHERE requester_id = ${userId}
        AND model IS NOT NULL
        AND (${sinceFilter}::timestamptz IS NULL OR queued_at >= ${sinceFilter}::timestamptz)
      GROUP BY model
      ORDER BY "jobCount" DESC
      LIMIT 5
    `,

    // myMachineStats — base stats per machine (time-filtered for hours/tokens)
    sql`
      SELECT
        m.id AS "machineId",
        m.name AS "machineName",
        (m.last_heartbeat_at IS NOT NULL AND m.last_heartbeat_at > NOW() - INTERVAL '5 minutes') AS "online",
        COALESCE(SUM(
          CASE WHEN j.status = 'completed' AND j.started_at IS NOT NULL AND j.completed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) / 3600.0
            ELSE 0
          END
        ), 0)::float AS "totalHoursServed",
        COALESCE(SUM(j.total_tokens), 0)::bigint AS "totalTokensProcessed"
      FROM machines m
      LEFT JOIN gpu_jobs j ON j.machine_id = m.id
        AND (${sinceFilter}::timestamptz IS NULL OR j.queued_at >= ${sinceFilter}::timestamptz)
      WHERE m.owner_id = ${userId}
      GROUP BY m.id, m.name, m.last_heartbeat_at
    `,

    // myMachineTopModel — most used model per machine (time-filtered)
    sql`
      SELECT DISTINCT ON (j.machine_id)
        j.machine_id AS "machineId",
        j.model AS "topModel"
      FROM gpu_jobs j
      JOIN machines m ON m.id = j.machine_id
      WHERE m.owner_id = ${userId}
        AND j.model IS NOT NULL
        AND (${sinceFilter}::timestamptz IS NULL OR j.queued_at >= ${sinceFilter}::timestamptz)
      GROUP BY j.machine_id, j.model
      ORDER BY j.machine_id, COUNT(*) DESC
    `,

    // myMachineConnections — active approved connections per machine (not filtered)
    sql`
      SELECT
        ar.machine_id AS "machineId",
        COUNT(*)::int AS "activeConnections"
      FROM access_requests ar
      JOIN machines m ON m.id = ar.machine_id
      WHERE m.owner_id = ${userId}
        AND ar.status = 'approved'
        AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
      GROUP BY ar.machine_id
    `,

    // popularMachines — top 3 machines in network by job count (time-filtered)
    sql`
      SELECT
        m.id AS "machineId",
        m.name AS "machineName",
        COUNT(*)::int AS "jobCount"
      FROM gpu_jobs j
      JOIN machines m ON m.id = j.machine_id
      WHERE m.owner_id IN (
        SELECT trusted_user_id FROM trust_connections WHERE user_id = ${userId}
      )
        AND (${sinceFilter}::timestamptz IS NULL OR j.queued_at >= ${sinceFilter}::timestamptz)
      GROUP BY m.id, m.name
      ORDER BY "jobCount" DESC
      LIMIT 3
    `,

    // popularModels — top 5 models across network by job count (time-filtered)
    sql`
      SELECT
        j.model,
        COUNT(*)::int AS "jobCount"
      FROM gpu_jobs j
      JOIN machines m ON m.id = j.machine_id
      WHERE m.owner_id IN (
        SELECT trusted_user_id FROM trust_connections WHERE user_id = ${userId}
      )
        AND j.model IS NOT NULL
        AND (${sinceFilter}::timestamptz IS NULL OR j.queued_at >= ${sinceFilter}::timestamptz)
      GROUP BY j.model
      ORDER BY "jobCount" DESC
      LIMIT 5
    `,

    // pendingFriendRequests (not filtered)
    sql`
      SELECT
        fr.id,
        fr.from_user_id AS "fromUserId",
        u.name AS "fromUserName",
        u.email AS "fromUserEmail",
        fr.created_at AS "createdAt"
      FROM friend_requests fr
      JOIN users u ON u.id = fr.from_user_id
      WHERE fr.to_user_id = ${userId} AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `,

    // pendingAccessRequests on YOUR machines (not filtered)
    sql`
      SELECT
        ar.id,
        ar.machine_id AS "machineId",
        m.name AS "machineName",
        ar.requester_id AS "requesterId",
        u.name AS "requesterName",
        ar.purpose,
        ar.estimated_hours AS "estimatedHours",
        ar.created_at AS "createdAt"
      FROM access_requests ar
      JOIN machines m ON m.id = ar.machine_id
      JOIN users u ON u.id = ar.requester_id
      WHERE m.owner_id = ${userId} AND ar.status = 'pending'
      ORDER BY ar.created_at DESC
    `,

    // a1111SessionCount as requester (time-filtered)
    sql`
      SELECT COUNT(*)::int AS "a1111SessionCount"
      FROM a1111_sessions
      WHERE requester_id = ${userId}
        AND (${sinceFilter}::timestamptz IS NULL OR created_at >= ${sinceFilter}::timestamptz)
    `,

    // a1111TotalMinutes from ended sessions (time-filtered)
    sql`
      SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM (updated_at - created_at)) / 60.0
      ), 0)::float AS "a1111TotalMinutes"
      FROM a1111_sessions
      WHERE requester_id = ${userId}
        AND status = 'ended'
        AND (${sinceFilter}::timestamptz IS NULL OR created_at >= ${sinceFilter}::timestamptz)
    `,

    // activeConnections — user's approved, non-expired access to other machines (not filtered)
    sql`
      SELECT
        ar.id AS "requestId",
        ar.machine_id AS "machineId",
        m.name AS "machineName",
        ar.expires_at AS "expiresAt",
        ar.approved_at AS "approvedAt",
        ar.purpose
      FROM access_requests ar
      JOIN machines m ON m.id = ar.machine_id
      WHERE ar.requester_id = ${userId}
        AND ar.status = 'approved'
        AND (ar.expires_at IS NULL OR ar.expires_at > NOW())
      ORDER BY ar.approved_at DESC
    `,

    // pendingOutboundRequests — user's pending requests to other machines (not filtered)
    sql`
      SELECT
        ar.id AS "requestId",
        ar.machine_id AS "machineId",
        m.name AS "machineName",
        ar.purpose,
        ar.estimated_hours AS "estimatedHours",
        ar.created_at AS "createdAt"
      FROM access_requests ar
      JOIN machines m ON m.id = ar.machine_id
      WHERE ar.requester_id = ${userId}
        AND ar.status = 'pending'
      ORDER BY ar.created_at DESC
    `,
  ]);

  // Build lookup maps for machine sub-queries
  const topModelMap = new Map<string, string | null>();
  for (const row of myMachineTopModelRows) {
    topModelMap.set(row.machineId as string, (row.topModel as string) ?? null);
  }

  const connectionMap = new Map<string, number>();
  for (const row of myMachineConnectionRows) {
    connectionMap.set(row.machineId as string, row.activeConnections as number);
  }

  return {
    networkSize: (networkSizeRows[0] as any).networkSize,
    machinesOnline: (machinesOnlineRows[0] as any).machinesOnline,
    totalModelsAvailable: (totalModelsRows[0] as any).totalModelsAvailable,

    tokensUsed: Number((tokensUsedRows[0] as any).tokensUsed),
    tokensServed: Number((tokensServedRows[0] as any).tokensServed),
    conversationCount: (conversationCountRows[0] as any).conversationCount,
    jobsCompleted: (jobsCompletedRows[0] as any).jobsCompleted,

    topModelsUsed: topModelsUsedRows.map((r: any) => ({
      model: r.model as string,
      jobCount: r.jobCount as number,
      totalTokens: Number(r.totalTokens),
    })),

    myMachineStats: myMachineStatsRows.map((r: any) => ({
      machineId: r.machineId as string,
      machineName: r.machineName as string,
      online: r.online as boolean,
      totalHoursServed: Math.round((r.totalHoursServed as number) * 100) / 100,
      totalTokensProcessed: Number(r.totalTokensProcessed),
      activeConnections: connectionMap.get(r.machineId as string) ?? 0,
      topModel: topModelMap.get(r.machineId as string) ?? null,
    })),

    popularMachines: popularMachinesRows.map((r: any) => ({
      machineId: r.machineId as string,
      machineName: r.machineName as string,
      jobCount: r.jobCount as number,
    })),

    popularModels: popularModelsRows.map((r: any) => ({
      model: r.model as string,
      jobCount: r.jobCount as number,
    })),

    pendingFriendRequests: pendingFriendRows.map((r: any) => ({
      id: r.id as string,
      fromUserId: r.fromUserId as string,
      fromUserName: r.fromUserName as string,
      fromUserEmail: r.fromUserEmail as string,
      createdAt: r.createdAt as string,
    })),

    pendingAccessRequests: pendingAccessRows.map((r: any) => ({
      id: r.id as string,
      machineId: r.machineId as string,
      machineName: r.machineName as string,
      requesterId: r.requesterId as string,
      requesterName: r.requesterName as string,
      purpose: r.purpose as string,
      estimatedHours: r.estimatedHours as number,
      createdAt: r.createdAt as string,
    })),

    a1111SessionCount: (a1111SessionCountRows[0] as any).a1111SessionCount,
    a1111TotalMinutes: Math.round(((a1111TotalMinutesRows[0] as any).a1111TotalMinutes as number) * 100) / 100,

    activeConnections: activeConnectionRows.map((r: any) => ({
      requestId: r.requestId as string,
      machineId: r.machineId as string,
      machineName: r.machineName as string,
      expiresAt: r.expiresAt as string | null,
      approvedAt: r.approvedAt as string | null,
      purpose: r.purpose as string,
    })),

    pendingOutboundRequests: pendingOutboundRows.map((r: any) => ({
      requestId: r.requestId as string,
      machineId: r.machineId as string,
      machineName: r.machineName as string,
      purpose: r.purpose as string,
      estimatedHours: r.estimatedHours as number,
      createdAt: r.createdAt as string,
    })),
  };
}
