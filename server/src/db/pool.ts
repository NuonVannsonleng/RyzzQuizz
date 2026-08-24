import pg from 'pg';

// Single shared pool for the whole process. Only auth reads from this today;
// live room/session state stays in-memory (roomService.ts) — see schema.sql's
// header comment for why that split is deliberate, not a TODO.
//
// Supabase (and most hosted Postgres) require TLS, so DB_SSL defaults to on
// unless explicitly disabled for a local, non-TLS server.
const useSsl = process.env.DB_SSL !== 'false';

export const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'postgres',
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  // Supabase terminates TLS with a cert this pool can't chain to a local root
  // store, so verification is off while encryption stays on. Fine here: the
  // only alternative is shipping their CA bundle around with the app.
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

// Without this an idle-client error (Supabase dropping a pooled connection)
// surfaces as an unhandled 'error' event and takes the whole process down.
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});
