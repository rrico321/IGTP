# Ollama Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace shell command execution with Ollama model inference (chat + embedding), sync available models from machines, track token usage for future billing, and provide API access.

**Architecture:** The daemon talks to the local Ollama API (localhost:11434) instead of spawning shell processes. Models are synced to a `machine_models` table every 60s. Jobs now carry a `model` and `prompt` instead of a shell command. Token counts are stored on every job for auditing. An API layer lets programmatic clients send prompts and embeddings.

**Tech Stack:** Next.js 16 (App Router), Neon Postgres, Ollama API (localhost:11434), Node.js daemon

---

## Task 1: Database Schema — machine_models + job columns

**Files:**
- Modify: `lib/schema.sql`
- Modify: `lib/types.ts`
- Modify: `lib/db.ts`

**Step 1: Add machine_models table and new gpu_jobs columns to schema.sql**

Append before seed data:

```sql
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
```

**Step 2: Add types to lib/types.ts**

```typescript
export interface MachineModel {
  machineId: string;
  modelName: string;
  modelType: "chat" | "embedding";
  sizeBytes: number | null;
  updatedAt: string;
}
```

Add to GpuJob interface:
```typescript
  model: string | null;
  prompt: string | null;
  jobType: "chat" | "embedding";
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
```

**Step 3: Add machine_models CRUD + update JOB_COLS in lib/db.ts**

Add MachineModel to the import from types.

Add JOB_COLS entries:
```
  model,
  prompt,
  job_type          AS "jobType",
  prompt_tokens     AS "promptTokens",
  completion_tokens AS "completionTokens",
  total_tokens      AS "totalTokens",
```

Add updateJob to accept new fields: `model`, `prompt`, `jobType`, `promptTokens`, `completionTokens`, `totalTokens`.

Add new functions:

```typescript
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
```

**Step 4: Commit**

```bash
git add lib/schema.sql lib/types.ts lib/db.ts
git commit -m "feat: add machine_models table and Ollama job columns"
```

---

## Task 2: Model Sync API Endpoint

**Files:**
- Create: `app/api/machines/[id]/models/route.ts`

**Step 1: Create the endpoint**

```typescript
import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getMachineById, syncMachineModels, getModelsForMachine } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const models = await getModelsForMachine(id);
  return Response.json(models);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const machine = await getMachineById(id);
  if (!machine || machine.ownerId !== userId) {
    return Response.json({ error: "Machine not found or not owned by you" }, { status: 404 });
  }

  const body = await request.json();
  const models = body.models as Array<{ name: string; type: string; sizeBytes: number }>;
  if (!Array.isArray(models)) {
    return Response.json({ error: "models array required" }, { status: 400 });
  }

  await syncMachineModels(id, models);
  return Response.json({ ok: true, synced: models.length });
}
```

**Step 2: Commit**

```bash
git add "app/api/machines/[id]/models/route.ts"
git commit -m "feat: add model sync API endpoint for daemon"
```

---

## Task 3: Daemon Model Sync

**Files:**
- Modify: `igtp-daemon/index.ts`

**Step 1: Add Ollama config and model sync function**

Add at the top with other config:
```typescript
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
```

Add model sync function after sendHeartbeat:

```typescript
// ─── Model sync ──────────────────────────────────────────────────────────────

async function syncModels(): Promise<void> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) {
      console.error(`[igtp-daemon] Ollama not reachable: ${res.status}`);
      return;
    }
    const data = await res.json();
    const models = (data.models ?? []).map((m: { name: string; size: number }) => ({
      name: m.name,
      type: m.name.toLowerCase().includes("embed") ? "embedding" : "chat",
      sizeBytes: m.size,
    }));

    await apiPost(`/api/machines/${MACHINE_ID}/models`, { models });
    console.log(`[igtp-daemon] Synced ${models.length} models`);
  } catch (err) {
    console.error("[igtp-daemon] Model sync error:", err);
  }
}
```

**Step 2: Add syncModels to the startup and heartbeat interval**

Update the bottom of the file to call syncModels alongside heartbeat:

```typescript
// Immediate first sync
sendHeartbeat();
syncModels();
poll();

// Recurring intervals
setInterval(poll, POLL_INTERVAL_MS);
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
setInterval(syncModels, HEARTBEAT_INTERVAL_MS); // sync models every 60s too
```

**Step 3: Commit**

```bash
git add igtp-daemon/index.ts
git commit -m "feat: daemon syncs Ollama models to website every 60s"
```

---

## Task 4: Show Models on Machine Detail Page

**Files:**
- Modify: `app/machines/[id]/page.tsx`

**Step 1: Import getModelsForMachine and fetch models**

Add to the imports and data fetching in MachineDetailPage.

**Step 2: Add models section to the page**

After the details card and before the edit form, add:

```tsx
{/* Available Ollama Models */}
{models.length > 0 && !isEditing && (
  <div className="bg-card border border-border rounded-xl p-6 mb-4 ring-1 ring-foreground/5">
    <h2 className="text-sm font-medium mb-3">
      Available Models <span className="text-muted-foreground font-normal">({models.length})</span>
    </h2>
    <div className="space-y-2">
      {models.map((m) => (
        <div key={m.modelName} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono text-foreground">{m.modelName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
              m.modelType === "embedding"
                ? "text-purple-400 border-purple-500/30"
                : "text-blue-400 border-blue-500/30"
            }`}>
              {m.modelType}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {m.sizeBytes ? `${(m.sizeBytes / 1e9).toFixed(1)} GB` : ""}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add "app/machines/[id]/page.tsx"
git commit -m "feat: show available Ollama models on machine detail page"
```

---

## Task 5: New Job Form with Model Picker

**Files:**
- Modify: `app/jobs/new/page.tsx`
- Rewrite: `app/jobs/new/JobSubmitForm.tsx`
- Modify: `app/api/jobs/route.ts`

**Step 1: Update the new job page to pass models**

Fetch models for each machine and pass them to the form component.

**Step 2: Rewrite JobSubmitForm**

Replace the command/docker fields with:
- Model dropdown (populated from machine_models for selected machine)
- Model type indicator (chat/embedding badge)
- Prompt textarea (replaces command)
- Remove docker image field, priority, and max runtime (not relevant for Ollama)

The form should:
- When user selects a machine, filter to show its available models
- When user selects a model, show its type badge
- Submit: POST to /api/jobs with `{ requestId, model, prompt, jobType }`

**Step 3: Update POST /api/jobs to accept model and prompt**

Accept `model`, `prompt`, `jobType` in the request body alongside `requestId`. Store in the job record. Set `command` to the prompt for backward compatibility.

**Step 4: Commit**

```bash
git add app/jobs/new/ app/api/jobs/route.ts
git commit -m "feat: new job form with Ollama model picker and prompt input"
```

---

## Task 6: Daemon Executes via Ollama API

**Files:**
- Modify: `igtp-daemon/index.ts`

**Step 1: Update GpuJob interface to include Ollama fields**

```typescript
interface GpuJob {
  id: string;
  machineId: string;
  command: string;
  model: string | null;
  prompt: string | null;
  jobType: string;
  dockerImage: string;
  maxRuntimeSec: number;
  vramLimitGb: number | null;
  cpuLimitCores: number | null;
  ramLimitGb: number | null;
}
```

**Step 2: Add Ollama execution function**

```typescript
async function executeOllamaJob(job: GpuJob): Promise<void> {
  console.log(`[igtp-daemon] Ollama job ${job.id}: ${job.jobType} with ${job.model}`);

  const isEmbedding = job.jobType === "embedding";
  const endpoint = isEmbedding ? "/api/embed" : "/api/generate";
  const body = isEmbedding
    ? { model: job.model, input: job.prompt }
    : { model: job.model, prompt: job.prompt, stream: false };

  try {
    const res = await fetch(`${OLLAMA_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      await reportCompletion(job.id, "failed", 1, null, `Ollama error: ${errText}`, null);
      return;
    }

    const data = await res.json();

    if (isEmbedding) {
      const outputText = JSON.stringify(data.embeddings ?? data.embedding);
      const tokens = { promptTokens: data.prompt_eval_count ?? 0, completionTokens: 0, totalTokens: data.prompt_eval_count ?? 0 };
      await reportCompletion(job.id, "completed", 0, null, outputText, tokens);
    } else {
      const outputText = data.response ?? "";
      const tokens = {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      };
      await reportCompletion(job.id, "completed", 0, null, outputText, tokens);
    }

    console.log(`[igtp-daemon] Ollama job ${job.id} completed`);
  } catch (err) {
    console.error(`[igtp-daemon] Ollama job ${job.id} failed:`, err);
    await reportCompletion(job.id, "failed", 1, null, `Error: ${err}`, null).catch(() => {});
  }
}
```

**Step 3: Update reportCompletion to include token data**

```typescript
async function reportCompletion(
  jobId: string,
  status: string,
  exitCode: number | null,
  logUrl: string | null,
  outputText: string | null,
  tokens: { promptTokens: number; completionTokens: number; totalTokens: number } | null
) {
  await apiPost(`/api/jobs/${jobId}/snapshot`, {
    status, exitCode, outputLogUrl: logUrl, outputLog: outputText,
    ...tokens,
  });
}
```

**Step 4: Update executeJob / poll to route Ollama jobs**

In the poll function or executeJob, check if `job.model` is set:
- If yes → `executeOllamaJob(job)`
- If no → existing `executeJob(job)` (legacy shell execution, kept for backward compat)

**Step 5: Commit**

```bash
git add igtp-daemon/index.ts
git commit -m "feat: daemon executes jobs via Ollama API with token tracking"
```

---

## Task 7: Update Snapshot API + Job Detail for Tokens

**Files:**
- Modify: `app/api/jobs/[id]/snapshot/route.ts`
- Modify: `app/jobs/[id]/page.tsx`

**Step 1: Update snapshot API to pass token fields through to updateJob**

Add `promptTokens`, `completionTokens`, `totalTokens` from body to the updateJob call.

**Step 2: Update updateJob SQL to include token columns**

Add to the UPDATE query:
```sql
prompt_tokens     = ${merged.promptTokens ?? null},
completion_tokens = ${merged.completionTokens ?? null},
total_tokens      = ${merged.totalTokens ?? null},
```

**Step 3: Update job detail page to show token usage**

Add a token usage card between the meta grid and resource limits:

```tsx
{/* Token Usage */}
{job.totalTokens != null && (
  <div className="grid grid-cols-3 gap-3 mb-6">
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-0.5">Prompt tokens</p>
      <p className="text-sm font-medium font-mono">{job.promptTokens?.toLocaleString() ?? '—'}</p>
    </div>
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-0.5">Completion tokens</p>
      <p className="text-sm font-medium font-mono">{job.completionTokens?.toLocaleString() ?? '—'}</p>
    </div>
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-0.5">Total tokens</p>
      <p className="text-sm font-medium font-mono">{job.totalTokens?.toLocaleString() ?? '—'}</p>
    </div>
  </div>
)}
```

Also update the "Sent to Machine" box to show model + prompt instead of raw command:
```tsx
{job.model && <p className="text-xs text-muted-foreground mb-2">Model: <span className="font-mono text-foreground/70">{job.model}</span></p>}
```

**Step 4: Commit**

```bash
git add "app/api/jobs/[id]/snapshot/route.ts" "app/jobs/[id]/page.tsx" lib/db.ts
git commit -m "feat: display token usage on job detail page"
```

---

## Task 8: Ollama API Endpoints (Chat + Embed)

**Files:**
- Create: `app/api/ollama/chat/route.ts`
- Create: `app/api/ollama/embed/route.ts`

**Step 1: Create chat endpoint**

```typescript
import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getMachineById, getModelsForMachine, createJob, getRequestsByRequester } from "@/lib/db";

export async function POST(request: NextRequest) {
  const userId = await authenticateRequest(request);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { machineId, model, prompt } = body;
  if (!machineId || !model || !prompt) {
    return Response.json({ error: "machineId, model, and prompt are required" }, { status: 400 });
  }

  // Verify user has approved access to this machine
  const requests = await getRequestsByRequester(userId);
  const approved = requests.find((r) => r.machineId === machineId && r.status === "approved");
  if (!approved) {
    return Response.json({ error: "No approved access to this machine" }, { status: 403 });
  }

  // Verify model exists on machine
  const models = await getModelsForMachine(machineId);
  const modelExists = models.some((m) => m.modelName === model && m.modelType === "chat");
  if (!modelExists) {
    return Response.json({ error: "Model not available on this machine" }, { status: 404 });
  }

  // Create job and return immediately — daemon will pick it up
  const job = await createJob({
    machineId,
    requesterId: userId,
    requestId: approved.id,
    command: prompt,
    model,
    prompt,
    jobType: "chat",
  });

  return Response.json({ jobId: job.id, status: "queued" }, { status: 201 });
}
```

**Step 2: Create embed endpoint**

Same structure but with `jobType: "embedding"` and validates model type is "embedding".

**Step 3: Commit**

```bash
git add app/api/ollama/
git commit -m "feat: add /api/ollama/chat and /api/ollama/embed API endpoints"
```

---

## Task 9: Update createJob to accept Ollama fields

**Files:**
- Modify: `lib/db.ts` (createJob function)
- Modify: `app/api/jobs/route.ts` (POST handler)

**Step 1: Update createJob to accept model, prompt, jobType**

Add optional fields to the createJob parameter type and INSERT query.

**Step 2: Update POST /api/jobs to pass model/prompt/jobType**

Accept these from the request body and pass to createJob.

**Step 3: Commit**

```bash
git add lib/db.ts app/api/jobs/route.ts
git commit -m "feat: createJob supports Ollama model, prompt, and jobType fields"
```

---

## Task 10: Deploy, Migrate, Update Daemon, Test

**Step 1:** Push to GitHub, wait for deploy
**Step 2:** Run migration to create machine_models table and add new columns
**Step 3:** Copy updated daemon to ~/.igtp/daemon/ and restart
**Step 4:** Verify models appear on machine detail page
**Step 5:** Submit a chat prompt through the browser
**Step 6:** Submit an embedding request via API
**Step 7:** Verify token counts appear on job detail page

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | DB schema + types + CRUD | schema.sql, types.ts, db.ts |
| 2 | Model sync API endpoint | api/machines/[id]/models/route.ts |
| 3 | Daemon model sync loop | igtp-daemon/index.ts |
| 4 | Models on machine detail page | machines/[id]/page.tsx |
| 5 | New job form with model picker | jobs/new/page.tsx, JobSubmitForm.tsx, api/jobs/route.ts |
| 6 | Daemon Ollama execution | igtp-daemon/index.ts |
| 7 | Token display on job detail | api/jobs/[id]/snapshot/route.ts, jobs/[id]/page.tsx |
| 8 | Chat + embed API endpoints | api/ollama/chat/route.ts, api/ollama/embed/route.ts |
| 9 | createJob accepts Ollama fields | db.ts, api/jobs/route.ts |
| 10 | Deploy + migrate + test | — |
