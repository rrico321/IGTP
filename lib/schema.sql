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

-- Ollama model sync
CREATE TABLE IF NOT EXISTS machine_models (
  machine_id  TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  model_name  TEXT NOT NULL,
  model_type  TEXT NOT NULL DEFAULT 'chat',
  size_bytes  BIGINT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (machine_id, model_name)
);

-- Ollama job fields
ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS job_type TEXT NOT NULL DEFAULT 'chat';
ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER;
ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS completion_tokens INTEGER;
ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS total_tokens INTEGER;

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  machine_id  TEXT NOT NULL REFERENCES machines(id),
  request_id  TEXT NOT NULL REFERENCES access_requests(id),
  model       TEXT NOT NULL,
  title       TEXT NOT NULL DEFAULT 'New conversation',
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  job_id          TEXT REFERENCES gpu_jobs(id),
  tokens          INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON conversation_messages(conversation_id, created_at);

ALTER TABLE gpu_jobs ADD COLUMN IF NOT EXISTS conversation_id TEXT REFERENCES conversations(id);

-- Notification extras
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS friend_request_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;

-- User passwords
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Set default password 'Welcome123' for existing users (SHA-256 hash)
UPDATE users SET password_hash = '925d2e9bb3679c1b9dd58ab20bb974fdc61f3ff4db5e12bb54fab0600261c7b3'
WHERE password_hash IS NULL;

-- Friend requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id          TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_user_id   TEXT NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);

-- A1111 support
ALTER TABLE machines ADD COLUMN IF NOT EXISTS a1111_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS a1111_available BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS a1111_sessions (
  id            TEXT PRIMARY KEY,
  machine_id    TEXT NOT NULL REFERENCES machines(id),
  requester_id  TEXT NOT NULL REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'pending',
  tunnel_url    TEXT,
  error         TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a1111_sessions_machine ON a1111_sessions(machine_id, status);
CREATE INDEX IF NOT EXISTS idx_a1111_sessions_requester ON a1111_sessions(requester_id);

-- Clean up stale sessions (pending/active with no tunnel older than 5 min)
UPDATE a1111_sessions SET status = 'ended', updated_at = NOW()
WHERE status IN ('pending', 'active', 'failed') AND tunnel_url IS NULL
  AND created_at < NOW() - INTERVAL '5 minutes';

-- Seed data removed — real users register via the app
