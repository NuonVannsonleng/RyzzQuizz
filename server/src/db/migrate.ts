import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

// Small custom runner, not a framework — applies server/src/db/migrations/*.sql
// in filename order, once each, tracked in _migrations. Each file runs inside a
// transaction, so a half-applied migration rolls back instead of leaving the
// schema in a state no later run can recover from.

const MIGRATIONS_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'migrations');

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) NOT NULL PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query<{ name: string }>('SELECT name FROM _migrations');
  const applied = new Set(rows.map((r) => r.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`Applying ${file}...`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      ran++;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(ran === 0 ? 'No pending migrations.' : `Applied ${ran} migration(s).`);
  await pool.end();
}

main().catch(async (err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
