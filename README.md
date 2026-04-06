# IGTP — I Got The Power

> Share your computer's AI power with friends you trust. No cloud accounts, no monthly fees — just your network.

---

## What Is This?

IGTP is a platform that lets friends share AI models with each other. If you have a powerful computer with AI models installed (using [Ollama](https://ollama.com)), you can let your trusted friends use those models remotely — right from their web browser or through an API.

Think of it like this: your friend has a powerful gaming computer with AI models on it. Instead of you buying your own expensive computer, your friend lets you use theirs. IGTP makes that easy and safe.

**There are two parts:**

1. **The Website** — This is where everything happens. You sign up, find machines, chat with AI models, and manage your account. You access it in your web browser at [igtp.vercel.app](https://igtp.ricobuilds.com).

2. **The Daemon** (pronounced "dee-mon") — This is a small helper program that runs quietly in the background on the computer being shared. It connects that computer to the website so other people can use its AI models. You only need the daemon if you are **sharing your own computer**. If you just want to use someone else's computer, you only need the website.

---

## How Does It Work?

### If you want to USE someone else's AI models

You don't need to install anything. Everything happens in your web browser.

1. **Get an invite** — Someone already using IGTP needs to send you an invite by email
2. **Click the invite link** in the email and create your account
3. **Go to Browse** — You'll see computers available from people in your network
4. **Request access** — Click on a computer and tell the owner what you need it for
5. **Wait for approval** — The owner will approve your request (they get notified)
6. **Start chatting** — Once approved, click **Chat** in the menu to start a conversation with any AI model on that computer

That's it. You type questions, the AI responds. Just like ChatGPT, except the AI is running on your friend's computer instead of a big company's servers.

### If you want to SHARE your computer's AI models

You need two things on your computer: **Ollama** (the AI software) and the **IGTP daemon** (the helper program that connects your computer to the website).

#### Step 1: Install Ollama

Ollama is the software that actually runs AI models on your computer. If you don't have it yet:

1. Go to [ollama.com](https://ollama.com)
2. Click **Download** and install it for your operating system
3. Open your terminal (on Mac, search for "Terminal" in Spotlight)
4. Run this command to download an AI model:
   ```
   ollama pull qwen3:8b
   ```
   This downloads a small but capable AI model. It might take a few minutes depending on your internet speed.
5. Make sure Ollama is running. You can check by running:
   ```
   ollama list
   ```
   If you see your model listed, you're good.

#### Step 2: Sign up on the website

1. Go to [igtp.vercel.app](https://igtp.ricobuilds.com)
2. Create your account
3. Go to **Settings > API Keys** (click "API Keys" in the top menu)
4. Click **Generate API Key**
5. **Copy the key** that appears — you'll need it in the next step. It looks something like `igtp_abc123_def456_ghi789_jkl012`. Save it somewhere safe.

#### Step 3: Install the daemon

The daemon is a small program that runs in the background on your computer. It does three things:
- Tells the website what AI models you have available
- Picks up requests from friends who want to use your models
- Sends the requests to Ollama and returns the results

**On Mac or Linux**, open Terminal and paste this command:

```bash
curl -fsSL https://igtp.ricobuilds.com/install.sh | bash
```

**On Windows**, open PowerShell (search for "PowerShell" in the Start menu) and paste this command:

```powershell
irm https://igtp.ricobuilds.com/install.ps1 | iex
```

The installer will walk you through everything:
1. It checks if Node.js is installed (and helps you install it if it's not)
2. It detects your computer's hardware (GPU, CPU, RAM)
3. It asks you to paste the API key you copied earlier
4. It asks you to name your computer (like "Rob's Mac" or "Gaming PC")
5. It registers your computer on the website
6. It asks if you want to enable **A1111 image generation** (see below)
7. It asks if you want it to start automatically when you turn on your computer (say yes)
8. It starts running

When it's done, you'll see a success message. Your computer is now sharing its AI models with your network.

#### Step 4: Invite friends

1. Go to **Invite** in the top menu on the website
2. Enter your friend's email address
3. They'll get an email with a link to join
4. When they join, you'll automatically trust each other — they can see your machines and request access

#### Step 5: Approve requests

When a friend requests to use your computer:
1. You'll see a notification on the website (the bell icon updates in real time)
2. Go to **My Machines** > click your machine > click **Requests**
3. Click **Approve** to give them access — you can set a time limit (e.g. 24 hours)
4. When the time runs out, their access expires automatically. They can request an extension if they need more time.

---

## Chatting with AI Models

Once you have access to a machine, click **Chat** in the top menu. This opens a conversation interface — similar to ChatGPT.

1. Click **New Chat**
2. Pick the machine and AI model you want to use
3. Type your message and press Enter
4. The AI responds — you can keep the conversation going with follow-up questions
5. Your conversations are saved in the sidebar on the left — you can come back to them anytime

Each conversation remembers what you've talked about, so you can ask follow-up questions and the AI will understand the context.

**Token counter:** You'll see a token count next to each conversation. Tokens are how AI models measure usage — roughly 1 token equals about 3/4 of a word. The machine owner can see how many tokens you've used (this is useful if they want to charge for usage later).

---

## AI Image Generation (A1111)

If the machine you're using has [AUTOMATIC1111](https://github.com/AUTOMATIC1111/stable-diffusion-webui) (A1111) installed, you can use it for AI image generation with Stable Diffusion — right from your browser.

### How it works

1. On the **Browse** page, machines with A1111 enabled show an "A1111" badge
2. Click the machine and then **Start A1111 Session**
3. The daemon creates a secure tunnel to the machine's A1111 instance
4. You get a private URL that opens A1111's full web interface in your browser
5. Generate images using the machine's GPU — all the usual A1111 features work (txt2img, img2img, ControlNet, etc.)
6. When you're done, click **Stop Session** to free up the GPU for others

Sessions have a time limit (default 2 hours) set by the machine owner. Only one session runs at a time per machine.

### For machine owners

The installer asks if you want to enable A1111. If you said no during setup, you can enable it later by editing `~/.igtp/.env` (or `%USERPROFILE%\.igtp\.env` on Windows):

```env
A1111_ENABLED=true
A1111_URL=http://localhost:7860
A1111_SESSION_MAX_MINS=120
```

The daemon uses [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (`cloudflared`) to securely expose your local A1111 instance without opening any ports. The installer will help you set up `cloudflared` if needed.

---

## Using the API

If you're a developer and want to use IGTP from your own code (instead of the web browser), you can use the API.

First, generate an API key at **Settings > API Keys** on the website.

### Chat with a model

```bash
curl -X POST https://igtp.ricobuilds.com/api/ollama/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "machine-123",
    "model": "qwen3:8b",
    "prompt": "What is the capital of France?"
  }'
```

This returns a job ID. Poll for the result:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://igtp.ricobuilds.com/api/jobs/JOB_ID_HERE
```

The response includes the AI's answer and token usage.

### Generate embeddings

```bash
curl -X POST https://igtp.ricobuilds.com/api/ollama/embed \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "machineId": "machine-123",
    "model": "mxbai-embed-large:latest",
    "input": "Hello world"
  }'
```

---

## Managing the Daemon

The daemon is the helper program running on the shared computer. After installation, you control it by typing commands in your terminal.

| Command | What It Does |
|---------|-------------|
| `igtp status` | Shows if the daemon is running and your machine details |
| `igtp start` | Start the daemon (begin sharing your computer) |
| `igtp stop` | Stop the daemon (pause sharing — nobody can use your machine) |
| `igtp logs` | Show what the daemon is doing (useful for troubleshooting) |
| `igtp kick` | Kill all active tunnels and disconnect all remote users immediately |
| `igtp autostart on` | Make the daemon start automatically when you log in to your computer |
| `igtp autostart off` | Stop the daemon from starting automatically |
| `igtp uninstall` | Completely remove the daemon and all its files from your computer |

**Tip:** If you just installed the daemon and `igtp` doesn't work, close your terminal and open a new one. The command needs a fresh terminal to be recognized.

---

## The Trust & Friend System

IGTP only lets you see and use machines from people you trust. This keeps things safe.

- **When you invite someone**, they automatically become part of your trust network (and you become part of theirs)
- **Friend requests** — You can also send a friend request to someone already on IGTP. If they accept, you're added to each other's trust networks. No invite link needed.
- **Trust goes one way** — just because you trust someone doesn't mean they have to trust you back
- **You always approve access** — even if someone can see your machine, they still need your permission before they can use it
- **Time-limited access** — when you approve a request, access expires after a set time (e.g. 24 hours). Users can request extensions when their access is about to run out.
- **You can remove trust** — Go to Settings > Trust to manage who's in your network

---

## Features

| Feature | Description |
|---------|-------------|
| AI Chat | Chat with Ollama models in a familiar interface, with conversation history |
| AI Image Generation | Start A1111/Stable Diffusion sessions on remote machines with secure tunneling |
| Ollama Integration | Automatically detects and syncs available AI models |
| Token Tracking | Every request tracks token usage for auditing and future billing |
| API Access | Programmatic access for chat and embeddings via REST API |
| Machine Registry | Register your computer with hardware specs auto-detected |
| Trust Network | Control exactly who can see and use your machines |
| Friend Requests | Send friend requests to add people to your trust network without an invite |
| Invite System | Bring friends into your network via email |
| Time-Limited Access | Approved requests expire after a set duration; users can request extensions |
| Connection Badges | See who's currently connected to your machine at a glance |
| Connected Users Panel | View all users connected to your machine and kick them if needed |
| Disconnect Button | Users can disconnect themselves when they're done (complete/cancel requests) |
| Real-Time Notifications | SSE-powered live updates for machine status and notification badges |
| Notifications | Get notified when someone requests your machine, sends a friend request, or approves your access |
| Auto-Start | Daemon starts when your computer boots up |
| Cross-Platform | Works on Mac, Linux, and Windows |

---

## Frequently Asked Questions

**Do I need a powerful computer to use IGTP?**
No — you only need a powerful computer if you want to *share* AI models. If you just want to *use* someone else's models, any computer with a web browser works.

**What is Ollama?**
Ollama is free software that lets you run AI models on your own computer. Think of it as the engine that powers the AI. IGTP connects that engine to the internet so your friends can use it too. Download it at [ollama.com](https://ollama.com).

**What is A1111?**
AUTOMATIC1111 (A1111) is a popular web interface for generating AI images using Stable Diffusion. If a machine owner has it installed and enabled, you can start a remote session to use it through your browser. The daemon creates a secure tunnel so you get the full A1111 experience without any setup on your end.

**What is a daemon?**
A daemon (pronounced "dee-mon") is a program that runs quietly in the background on your computer. You don't see a window for it — it just works behind the scenes. The IGTP daemon connects your computer to the IGTP website so friends can use your AI models. You can stop it anytime with `igtp stop`.

**Is it safe?**
Yes. The daemon only runs AI prompts through Ollama — it cannot access your files, install software, or do anything else on your computer. You also control exactly who can use your machine through the trust and approval system. A1111 sessions use encrypted Cloudflare Tunnels — no ports are opened on your machine.

**How much does it cost?**
IGTP is free. The only cost is the electricity to run your computer and the internet bandwidth. The website is hosted on Vercel's free tier.

**Can the machine owner see my prompts?**
Currently, the machine owner can see job records (prompts and responses) in the admin view. Keep this in mind when using someone else's machine.

**What happens if I close my laptop?**
The daemon stops when your computer sleeps or shuts down. When you open it again, the daemon restarts automatically (if you enabled auto-start). Your friends won't be able to use your machine while it's off.

**Can multiple people use my machine at the same time?**
For AI chat, the daemon handles one request at a time. If multiple people send prompts, they'll be queued and processed one after another. For A1111 image generation, only one session runs at a time by default (configurable via `A1111_MAX_SESSIONS`).

**What happens when my access expires?**
You'll see a countdown timer showing how much time you have left. When access expires, you can request an extension from the machine owner. Your conversations are saved — you just need renewed access to keep chatting.

---

## For Developers

<details>
<summary>Click to expand technical documentation</summary>

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Neon Serverless Postgres |
| Styling | Tailwind CSS 4 + shadcn/ui |
| AI Runtime | Ollama (local) |
| Image Gen | AUTOMATIC1111 (local, optional) |
| Tunneling | Cloudflare Tunnel (cloudflared) |
| Email | Resend |
| Monitoring | Sentry |
| Analytics | Vercel Analytics |
| Real-Time | Server-Sent Events (SSE) |

### Architecture

```
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│  Website (Vercel)                │     │  Shared Machine (Daemon + Ollama)│
│                                  │     │                                  │
│  Users, trust network, requests  │◄───►│  Syncs Ollama models every 60s  │
│  Conversations, job queue        │     │  Polls for jobs every 10s       │
│  A1111 session management        │     │  Polls for A1111 sessions       │
│  SSE live updates                │     │  Sends heartbeats every 60s    │
│  API (chat, embed, CRUD)         │     │  Calls Ollama API locally       │
│  Token tracking & auditing       │     │  Manages cloudflared tunnels    │
└──────────────────────────────────┘     └──────────────────────────────────┘
```

### Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts (with password hashes) |
| machines | Registered computers with hardware specs and A1111 status |
| machine_models | Ollama models synced from each machine |
| access_requests | Requests from users to use a machine (with expiry timestamps) |
| gpu_jobs | Individual AI requests with token counts (for auditing/billing) |
| job_usage_snapshots | Periodic GPU/CPU/RAM usage samples during job execution |
| conversations | Chat conversation threads |
| conversation_messages | Messages within conversations |
| trust_connections | Directional trust graph |
| friend_requests | Friend requests between users (pending/accepted/denied) |
| invites | Email invite tokens |
| notifications | In-app notifications (includes friend request notifications) |
| api_keys | Personal API keys for daemon and API access |
| a1111_sessions | A1111 image generation sessions with tunnel URLs and expiry |

### API Reference

#### AI / Inference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ollama/chat` | Submit a chat prompt (API key auth) |
| `POST` | `/api/ollama/embed` | Submit an embedding request (API key auth) |

#### Machines

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/machines` | List all machines |
| `POST` | `/api/machines` | Register a machine (auth required) |
| `GET` | `/api/machines/:id` | Get machine details |
| `PATCH` | `/api/machines/:id` | Update machine (owner only) |
| `DELETE` | `/api/machines/:id` | Delete machine (owner only) |
| `GET` | `/api/machines/:id/models` | List Ollama models on a machine |
| `POST` | `/api/machines/:id/models` | Sync models from daemon |
| `POST` | `/api/machines/:id/heartbeat` | Daemon heartbeat (reports A1111 status) |
| `POST` | `/api/machines/:id/kick` | Kill all active sessions on a machine (owner only) |
| `GET` | `/api/machines/:id/requests` | List access requests for a machine |
| `POST` | `/api/machines/:id/requests` | Submit an access request |

#### A1111 Sessions

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/machines/:id/sessions` | List A1111 sessions for a machine |
| `POST` | `/api/machines/:id/sessions` | Request a new A1111 session |
| `POST` | `/api/sessions/:id/stop` | Stop an active session |
| `POST` | `/api/sessions/:id/tunnel` | Daemon reports tunnel URL or status |
| `GET` | `/api/sessions/:id/tunnel` | Check session/tunnel status |

#### Access Requests

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/requests` | List requests by requester |
| `PATCH` | `/api/requests/:id` | Approve/deny/complete/cancel a request |

#### Conversations

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/conversations` | List/create conversations |
| `GET/POST` | `/api/conversations/:id/messages` | List/send messages |
| `DELETE` | `/api/conversations/:id` | Delete a conversation |

#### Jobs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs` | List jobs |
| `GET` | `/api/jobs/:id` | Get job details/result |
| `POST` | `/api/jobs/dispatch` | Get next queued job for a machine |
| `POST` | `/api/jobs/:id/snapshot` | Report job progress, completion + tokens |

#### Trust & Friends

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/trust` | List your trust connections |
| `POST` | `/api/trust` | Add a trust connection |
| `DELETE` | `/api/trust/:id` | Remove a trust connection |
| `GET` | `/api/friend-requests` | List pending friend requests |
| `POST` | `/api/friend-requests` | Send a friend request |
| `PATCH` | `/api/friend-requests/:id` | Accept or deny a friend request |

#### Other

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/api-keys` | Manage API keys |
| `DELETE` | `/api/api-keys/:id` | Delete an API key |
| `POST` | `/api/invites/:token` | Accept an invite |
| `GET` | `/api/usage/report` | Get usage report (jobs, tokens, runtime) |
| `GET` | `/api/sse` | Server-Sent Events stream (machine status, notifications) |
| `POST` | `/api/migrate` | Run database migrations |

### Daemon Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `IGTP_API_URL` | Yes | — | Base URL of the IGTP app |
| `IGTP_MACHINE_ID` | Yes | — | ID of this machine |
| `IGTP_API_KEY` | Yes | — | API key for authentication |
| `POLL_INTERVAL_MS` | No | `10000` | How often to poll for jobs |
| `HEARTBEAT_INTERVAL_MS` | No | `60000` | How often to send heartbeats |
| `OLLAMA_URL` | No | `http://localhost:11434` | Local Ollama URL |
| `A1111_ENABLED` | No | `false` | Enable A1111 session hosting |
| `A1111_URL` | No | `http://localhost:7860` | Local A1111 URL |
| `A1111_LAUNCH_CMD` | No | — | Command to start A1111 if not running |
| `A1111_MAX_SESSIONS` | No | `1` | Max concurrent tunnel sessions |
| `A1111_SESSION_MAX_MINS` | No | `120` | Max session duration in minutes |

### Running Locally

```bash
git clone https://github.com/rrico321/IGTP.git
cd IGTP
npm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."     # Neon connection string
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

```bash
npm run dev
curl -X POST http://localhost:3000/api/migrate   # Set up database
```

### Deployment

Push to `main` — Vercel auto-deploys. Run the migration once after first deploy:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_MIGRATE_SECRET"}' \
  https://your-app.vercel.app/api/migrate
```

</details>

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes and run `npm run lint`
4. Open a Pull Request against `main`

---

## License

MIT
