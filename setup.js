// One-time script to create all tables in Supabase.
// Run with: node setup.js

import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  connectionString: 'process.env.DB_URL',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  console.log('Connected to Supabase database...')

  await client.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name       TEXT    NOT NULL,
      hourly_rate NUMERIC NOT NULL,
      color      TEXT    NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✓ companies table')

  await client.query(`
    CREATE TABLE IF NOT EXISTS shifts (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
      date        DATE    NOT NULL,
      start_time  TEXT    NOT NULL,
      end_time    TEXT    NOT NULL,
      hours       NUMERIC NOT NULL,
      pay         NUMERIC NOT NULL,
      hourly_rate NUMERIC NOT NULL,
      paid        BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✓ shifts table')

  await client.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text       TEXT    NOT NULL,
      completed  BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  console.log('✓ todos table')

  // Allow public (anon) access — this is a single-user personal app
  await client.query(`
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='companies' AND policyname='public_all') THEN
        CREATE POLICY public_all ON companies FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;

    ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shifts' AND policyname='public_all') THEN
        CREATE POLICY public_all ON shifts FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;

    ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='todos' AND policyname='public_all') THEN
        CREATE POLICY public_all ON todos FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `)
  console.log('✓ RLS policies')

  await client.end()
  console.log('\nAll done! Your database is ready.')
}

main().catch((err) => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
