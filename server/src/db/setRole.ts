import 'dotenv/config';
import { pool } from './pool.js';

// Promotion is deliberately an out-of-band CLI action, not an API route:
// there's no bootstrap problem to solve (the first DEVELOPER has to come from
// somewhere) and no route means no route to get wrong.
//
//   npm run user:role -- <username|email> <USER|ADMIN|DEVELOPER>

const ROLES = ['USER', 'ADMIN', 'DEVELOPER'];

async function main() {
  const [identifier, role] = process.argv.slice(2);

  if (!identifier || !role) {
    console.error('Usage: npm run user:role -- <username|email> <USER|ADMIN|DEVELOPER>');
    process.exit(1);
  }
  const upper = role.toUpperCase();
  if (!ROLES.includes(upper)) {
    console.error(`Role must be one of: ${ROLES.join(', ')}`);
    process.exit(1);
  }

  const result = await pool.query(
    'UPDATE users SET system_role = $1 WHERE username = $2 OR email = $3',
    [upper, identifier, identifier.toLowerCase()],
  );

  if (result.rowCount === 0) {
    console.error(`No user found matching "${identifier}".`);
    await pool.end();
    process.exit(1);
  }

  // Privileged checks read the role straight from the database, so this is
  // live immediately — no re-login, no waiting for the old token to expire.
  console.log(`"${identifier}" is now ${upper}. Reload the page to see it.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error('Failed to set role:', err);
  process.exit(1);
});
