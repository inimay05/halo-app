# Halo — Healthy Screen Time for Kids

A Next.js 14 app with Supabase that helps parents manage children's screen time through a companion-based engagement system.

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) account and project

## Setup

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd halo-app
   ```

2. **Copy environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your Supabase credentials in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — your Supabase service role key (server-side only)

3. **Install dependencies**
   ```bash
   npm install
   ```

## Database setup

Run the migration files in order in your Supabase SQL editor or via the CLI:

```bash
# Via Supabase CLI (if linked)
supabase db push

# Or manually run each file in the Supabase SQL editor:
supabase/migrations/001_init.sql
supabase/migrations/002_sessions.sql
supabase/migrations/003_rewards.sql
supabase/migrations/004_parent.sql
supabase/migrations/005_anticheat.sql
supabase/migrations/006_last_seen.sql
supabase/migrations/007_garden_delta.sql
```

## Local development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Widget build

The browser widget (injected on child's browser) is a self-contained IIFE bundle:

```bash
npm run build:widget
```

This outputs `public/halo-widget.js`. Install on any website with:

```html
<script src="https://your-app.vercel.app/halo-widget.js" data-child-id="CHILD_UUID"></script>
```

## Production build

```bash
npm run build
npm start
```

The build script automatically builds the widget before running `next build`.

## Architecture overview

- `/src/app/(auth)/` — Login, register, onboarding, PIN setup
- `/src/app/(parent)/` — Parent PIN verification, dashboard
- `/src/app/parent/` — Parent management pages (analytics, rules, garden, profiles)
- `/src/app/child/` — Child-facing pages (home, shop, journey, time bank)
- `/src/app/api/widget/` — API routes used by the browser widget
- `/src/lib/` — Core engines (engagement detection, coins, badges, garden, breaks)
- `/src/widget/` — Browser widget source (compiled to `public/halo-widget.js`)
- `/src/store/` — Zustand client-side stores
- `/supabase/migrations/` — SQL migration files

## Product constraints

- Coins are cosmetic rewards only — they never extend screen time
- Time Bank is parent-controlled only — parents grant minutes, children cannot add time
- Engagement scores are informational for parents only
