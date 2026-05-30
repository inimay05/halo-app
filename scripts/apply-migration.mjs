/**
 * Applies supabase/migrations/001_init.sql to the remote project
 * via the Supabase Management API.
 *
 * Requirements: SUPABASE_ACCESS_TOKEN in .env.local
 *   Get yours at: https://supabase.com/dashboard/account/tokens
 *
 * Usage:  node scripts/apply-migration.mjs
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local manually
const envRaw = readFileSync(join(__dir, '../.env.local'), 'utf8')
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const PAT   = env.SUPABASE_ACCESS_TOKEN
const URL   = env.NEXT_PUBLIC_SUPABASE_URL   // https://REF.supabase.co
const REF   = URL?.replace('https://', '').replace('.supabase.co', '')

if (!PAT) {
  console.error('\n❌  SUPABASE_ACCESS_TOKEN not found in .env.local')
  console.error('   Get yours at: https://supabase.com/dashboard/account/tokens')
  console.error('   Then add:  SUPABASE_ACCESS_TOKEN=<token>  to .env.local\n')
  process.exit(1)
}

const sql = readFileSync(join(__dir, '../supabase/migrations/001_init.sql'), 'utf8')

console.log(`Applying migration to project: ${REF}`)

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method:  'POST',
  headers: {
    Authorization:  `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

if (!res.ok) {
  const body = await res.text()
  console.error(`\n❌  API error (${res.status}): ${body}\n`)
  process.exit(1)
}

console.log('✅  Migration applied successfully!\n')
