-- IGTP database schema
-- Run via /api/migrate (development) or psql (production)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  gpu_model TEXT NOT NULL,
  vram_gb INTEGER NOT NULL,
  cpu_model TEXT NOT NULL,
  ram_gb INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  owner_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_requests (
  id TEXT PRIMARY KEY,
  machine_id TEXT NOT NULL REFERENCES machines(id),
  requester_id TEXT NOT NULL REFERENCES users(id),
  purpose TEXT NOT NULL,
  estimated_hours NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trust_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  trusted_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, trusted_user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  request_id TEXT REFERENCES access_requests(id),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE machines ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;

-- Phase 8: GPU Workload Management
CREATE TABLE IF NOT EXISTS gpu_jobs (
  id                TEXT PRIMARY KEY,
  machine_id        TEXT NOT NULL REFERENCES machines(id),
  requester_id      TEXT NOT NULL REFERENCES users(id),
  request_id        TEXT NOT NULL REFERENCES access_requests(id),
  command           TEXT NOT NULL,
  docker_image      TEXT NOT NULL DEFAULT '',
  priority          INTEGER NOT NULL DEFAULT 5,
  status            TEXT NOT NULL DEFAULT 'queued',
  -- queued | running | completed | failed | cancelled | timed_out
  max_runtime_sec   INTEGER NOT NULL DEFAULT 3600,
  vram_limit_gb     INTEGER,
  cpu_limit_cores   NUMERIC,
  ram_limit_gb      INTEGER,
  exit_code         INTEGER,
  output_log_url    TEXT,
  queued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gpu_jobs_machine    ON gpu_jobs(machine_id, status);
CREATE INDEX IF NOT EXISTS idx_gpu_jobs_requester  ON gpu_jobs(requester_id);
CREATE INDEX IF NOT EXISTS idx_gpu_jobs_request    ON gpu_jobs(request_id);

CREATE TABLE IF NOT EXISTS job_usage_snapshots (
  id              TEXT PRIMARY KEY,
  job_id          TEXT NOT NULL REFERENCES gpu_jobs(id),
  sampled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gpu_util_pct    INTEGER,
  vram_used_gb    NUMERIC,
  cpu_util_pct    INTEGER,
  ram_used_gb     NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_job_snapshots_job ON job_usage_snapshots(job_id, sampled_at);

-- Phase 10: Invite System
CREATE TABLE IF NOT EXISTS invites (
  id             TEXT PRIMARY KEY,
  token          TEXT NOT NULL UNIQUE,
  inviter_id     TEXT NOT NULL REFERENCES users(id),
  invitee_email  TEXT NOT NULL,
  accepted_by_user_id TEXT REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'pending',
  -- pending | accepted | expired
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL,
  accepted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invites_token   ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);

-- API Keys for daemon authentication
CREATE TABLE IF NOT EXISTS api_keys (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  key_hash    TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,
  label       TEXT NOT NULL DEFAULT '',
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS output_log TEXT;

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Seed data (idempotent via ON CONFLICT DO NOTHING)
INSERT INTO users (id, name, email, created_at) VALUES
  ('user-1', 'Alice Chen', 'alice@example.com', '2026-03-01T00:00:00.000Z'),
  ('user-2', 'Bob Martinez', 'bob@example.com', '2026-03-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO machines (id, name, description, gpu_model, vram_gb, cpu_model, ram_gb, status, owner_id, created_at, updated_at) VALUES
  ('machine-1', 'Alice''s Beast', 'High-end gaming rig, great for inference', 'RTX 4090', 24, 'Intel i9-13900K', 64, 'available', 'user-1', '2026-03-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trust_connections (id, user_id, trusted_user_id, created_at) VALUES
  ('trust-1', 'user-1', 'user-2', '2026-03-27T00:00:00.000Z'),
  ('trust-2', 'user-2', 'user-1', '2026-03-27T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
