import { neon } from "@neondatabase/serverless";
import type { Machine, AccessRequest, User, TrustConnection, Notification } from "./types";

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
