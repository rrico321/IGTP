# Ollama Integration Design

## Overview

Transform IGTP from a generic shell command platform into an Ollama sharing network. Users share their local Ollama models with trusted friends. Two job types: chat (text → text) and embedding (text → vector). Token usage tracked for future billing.

## Architecture

```
Bob (browser or API)          Website (Vercel)              Alice's Mac (daemon + Ollama)
────────────────────          ────────────────              ────────────────────────────
Pick model: qwen3:8b    →    Store job (model+prompt)  →   Daemon polls, picks up job
Type: "What is AI?"     →                                  POST localhost:11434/api/generate
                                                           Counts tokens from response
                             ← Store response+tokens  ←   Returns full text + token counts
See response on page    ←

                             Model sync (every 60s):
                                                           GET localhost:11434/api/tags
                             ← machine_models table   ←   Sends model list to website
```

## Database Changes

### New table: machine_models

```sql
CREATE TABLE machine_models (
  machine_id  TEXT NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  model_name  TEXT NOT NULL,
  model_type  TEXT NOT NULL DEFAULT 'chat',
  size_bytes  BIGINT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (machine_id, model_name)
);
```

### New columns on gpu_jobs

- `model TEXT` — Ollama model name
- `prompt TEXT` — user's input prompt
- `prompt_tokens INTEGER` — input token count
- `completion_tokens INTEGER` — output token count
- `total_tokens INTEGER` — sum of both
- `job_type TEXT DEFAULT 'chat'` — 'chat' or 'embedding'

## Daemon Changes

1. Model sync loop (every 60s): GET Ollama tags → POST to website
2. Job execution: call Ollama API instead of shell
3. Auto-detect model type: name contains "embed" → embedding, else → chat
4. No more shell execution

## Website Changes

- New job form: model picker + prompt textarea
- Job detail: prompt sent, response received, token counts
- Machine detail: available models section
- API endpoints: POST /api/ollama/chat and /api/ollama/embed

## Build Chunks

1a: Model sync (daemon → API → DB)
1b: New job form (model picker + prompt)
1c: Daemon executes via Ollama API
1d: API endpoints for chat + embedding
