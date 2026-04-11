// Adds user_id to all tables and tightens RLS to per-user access.
// Run ONCE after setting up Google OAuth: node setup-auth.js

import 'dotenv/config'
import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  console.log('Connected...')

  // Add user_id columns (safe to run even if column already exists)
  await client.query(`
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

    ALTER TABLE shifts ADD COLUMN IF NOT EXISTS
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

    ALTER TABLE todos ADD COLUMN IF NOT EXISTS
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
  `)
  console.log('✓ user_id columns added')

  // Drop the old open policies and replace with per-user policies
  await client.query(`
    DROP POLICY IF EXISTS public_all    ON companies;
    DROP POLICY IF EXISTS user_isolation ON companies;
    CREATE POLICY user_isolation ON companies
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS public_all    ON shifts;
    DROP POLICY IF EXISTS user_isolation ON shifts;
    CREATE POLICY user_isolation ON shifts
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS public_all    ON todos;
    DROP POLICY IF EXISTS user_isolation ON todos;
    CREATE POLICY user_isolation ON todos
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  `)
  console.log('✓ RLS policies updated to per-user')

  await client.end()
  console.log('\nDone! Each user now only sees their own data.')
  console.log('Note: any data added before auth was enabled had no user_id and will no longer be visible.')
}

main().catch(err => { console.error(err.message); process.exit(1) })
