# IGTP — I Got The Power

> Share your computer's GPU power with friends you trust. No cloud accounts, no fees — just your network.

---

## What Is This?

IGTP lets people share their computer's processing power (GPU) with friends. Think of it like lending your gaming PC to a friend for their AI project — except they can use it remotely, and you stay in control of who gets access.

**Two parts work together:**

1. **The Website** (hosted on Vercel) — Where you manage everything: sign up, register your machine, approve requests, and monitor jobs.
2. **The Daemon** (runs on your computer) — A small background program that connects your machine to the website and runs approved jobs.

---

## How It Works

### If You Want to Share Your Machine

1. **Sign up** at [igtp.vercel.app](https://igtp.vercel.app)
2. **Get an API key** from Settings > API Keys
3. **Install the daemon** on your machine:

   **Mac or Linux** — open Terminal and run:
   ```bash
   curl -fsSL https://igtp.vercel.app/install.sh | bash
   ```

   **Windows** — open PowerShell and run:
   ```powershell
   irm https://igtp.vercel.app/install.ps1 | iex
   ```

   The installer will:
   - Check that Node.js is installed (and help you install it if not)
   - Detect your GPU, CPU, and RAM
   - Register your machine on the website
   - Set up auto-start so it runs in the background

4. **Approve requests** when friends ask to use your machine

That's it. Your machine will quietly run in the background, picking up and running approved jobs.

### If You Want to Use Someone's Machine

1. **Get an invite** — Someone in the network needs to invite you
2. **Sign up** using the invite link
3. **Browse** available machines from people in your trust network
4. **Request access** — Describe what you need and for how long
5. **Submit a job** once approved — Provide your command and Docker image
6. **Monitor and download results** from the website

---

## The Trust Network

IGTP is built on trust. You only see machines from people you've explicitly trusted, and they only see yours if they trust you back.

- **Inviting someone** automatically adds them to your trust network (and you to theirs)
- **Trust is directional** — you can trust someone without them trusting you back
- **You control access** — Every request to use your machine needs your approval

---

## Managing Your Daemon

After installation, you can control the daemon with these commands:

| Command | What It Does |
|---------|-------------|
| `igtp status` | Check if the daemon is running |
| `igtp start` | Start sharing your machine |
| `igtp stop` | Stop sharing (pause) |
| `igtp logs` | See what the daemon is doing |
| `igtp autostart on` | Start automatically when you log in |
| `igtp autostart off` | Don't start automatically |
| `igtp uninstall` | Remove everything from your machine |

---

## Features

| Feature | Description |
|---------|-------------|
| Machine Registry | Register your GPU machine with full hardware specs |
| Browse & Request | Browse available machines and request time |
| Trust Network | Control who sees your machines |
| Invite System | Invite friends via email |
| GPU Jobs | Submit, monitor, and cancel workloads |
| Real-time Updates | Get notified when requests are approved or jobs finish |
| Usage Reports | Track how your machines are being used |
| Auto-Start | Daemon starts when your computer boots up |

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
| File Storage | Vercel Blob |
| Email | Resend |
| Monitoring | Sentry |
| Analytics | Vercel Analytics |

### Architecture

```
┌──────────────────────────────────┐     ┌──────────────────────────────┐
│  Website (Vercel)                │     │  Your Machine (Daemon)       │
│                                  │     │                              │
│  Users, trust network, requests  │◄───►│  Polls for jobs every 10s    │
│  Job queue, notifications        │     │  Runs approved workloads     │
│  API for daemon communication    │     │  Sends heartbeats            │
│                                  │     │  Uploads results             │
└──────────────────────────────────┘     └──────────────────────────────┘
```

### Running the Website Locally

```bash
git clone https://github.com/rrico321/IGTP.git
cd IGTP
npm install
```

Create `.env.local`:

```env
DATABASE_URL="postgresql://..."     # Neon connection string
BLOB_READ_WRITE_TOKEN="vercel_..."  # Vercel Blob token
RESEND_API_KEY="re_..."             # For invite emails (optional)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

```bash
npm run dev
curl -X POST http://localhost:3000/api/migrate   # Set up database
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob storage token |
| `RESEND_API_KEY` | No | Resend API key for invite emails |
| `EMAIL_FROM` | No | Sender email for invites |
| `NEXT_PUBLIC_APP_URL` | No | App URL for email links (defaults to localhost) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry error tracking DSN |
| `CRON_SECRET` | No | Legacy daemon auth (use API keys instead) |

### API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/machines` | List all machines |
| `POST` | `/api/machines` | Register a machine (auth required) |
| `PATCH` | `/api/machines/:id` | Update machine (owner only) |
| `POST` | `/api/machines/:id/heartbeat` | Daemon heartbeat |
| `POST` | `/api/requests` | Submit access request |
| `PATCH` | `/api/requests/:id` | Approve/deny request |
| `POST` | `/api/jobs/dispatch` | Get next job for a machine |
| `POST` | `/api/jobs/:id/snapshot` | Report job metrics/completion |
| `POST` | `/api/invites` | Send an invite |
| `GET` | `/api/api-keys` | List your API keys |
| `POST` | `/api/api-keys` | Generate a new API key |

### Deployment

Push to `main` — Vercel auto-deploys. Run the migration once after first deploy:

```bash
curl -X POST https://igtp.vercel.app/api/migrate
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
