import { neon } from '@neondatabase/serverless'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const databaseUrl =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || ''

if (!databaseUrl) {
  console.error('Missing DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL.')
  process.exit(1)
}

const dataFile = join(process.cwd(), '.data', 'app-state.json')
const raw = await readFile(dataFile, 'utf8')
const state = JSON.parse(raw)

const requiredArrays = [
  'clients',
  'deals',
  'payments',
  'expenses',
  'expensePlannerCategories',
  'plannedExpenses',
  'expensePlannerPayments',
  'incomePlannerCategories',
  'plannedIncomes',
  'incomePlannerPayments',
  'moneyBalances',
  'creditCards'
]

for (const key of requiredArrays) {
  if (!Array.isArray(state[key])) {
    console.error(`Invalid app state: "${key}" must be an array.`)
    process.exit(1)
  }
}

const sql = neon(databaseUrl)

await sql`
  CREATE TABLE IF NOT EXISTS app_state (
    id text PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`

await sql`
  INSERT INTO app_state (id, data, updated_at)
  VALUES (${'main'}, ${JSON.stringify(state)}::jsonb, now())
  ON CONFLICT (id)
  DO UPDATE SET
    data = excluded.data,
    updated_at = now()
`

console.log(`Migrated ${raw.length} bytes from ${dataFile} to Neon app_state/main.`)
