// Adds pay_cycle JSONB column to companies table.
// Run once: node migrate-pay-cycle.js

import 'dotenv/config'
import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  await client.query(`
    ALTER TABLE companies
      ADD COLUMN IF NOT EXISTS pay_cycle JSONB DEFAULT NULL;
  `)
  console.log('✓ pay_cycle column added to companies')
  await client.end()
}

main().catch(err => { console.error(err.message); process.exit(1) })
