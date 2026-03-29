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
