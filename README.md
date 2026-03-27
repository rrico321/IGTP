# IGTP — I Got The Power

A Next.js 16 web application. Greenfield project.

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Next.js](https://nextjs.org) | 16.x | Full-stack React framework (App Router) |
| [React](https://react.dev) | 19.x | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first styling |
| [ESLint](https://eslint.org) | 9.x | Linting |

## Prerequisites

- **Node.js** 20+ (recommended: latest LTS)
- **npm** 10+

## Getting Started

```bash
# Install dependencies (already done if you cloned this repo)
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server (requires build) |
| `npm run lint` | Run ESLint |

## Project Structure

```
.
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout (fonts, global styles)
│   ├── page.tsx          # Home page (/)
│   └── globals.css       # Global CSS + Tailwind base
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
└── postcss.config.mjs    # PostCSS (Tailwind) configuration
```

## Development Conventions

- **Server Components by default** — only add `'use client'` when you need browser APIs or interactivity
- **Async request APIs** — `await cookies()`, `await headers()`, `await params` (Next.js 16)
- **`proxy.ts` not `middleware.ts`** — place at project root alongside `app/`
- **Path alias** — use `@/` for imports from the project root (e.g., `@/components/Button`)

## Notes

- `@vercel/postgres` and `@vercel/kv` are sunset — use Neon and Upstash if you need a database or cache
- See `AGENTS.md` for agent-specific coding guidelines
