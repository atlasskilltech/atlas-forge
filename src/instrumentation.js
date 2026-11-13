/**
 * Runs once when the Next.js server starts (see Next's instrumentation docs).
 *
 * Logs which database this process will use — host, port, database and user,
 * never the password — and then, without delaying startup, a read-only
 * `SELECT DATABASE()` result. `pm2 logs atlas-forge` therefore always shows
 * what the RUNNING process resolved from `.env`, and whether it can reach it.
 *
 * Deliberately does not import `@/lib/db`: that module is `server-only` and
 * holds the app's pool. This probe opens one short-lived connection and closes it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { DB_HOST, DB_PORT = '3306', DB_USER, DB_PASSWORD = '', DB_NAME } = process.env
  const target = `${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER} (password ${DB_PASSWORD ? 'set' : 'blank'})`
  console.log(`[atlas-forge] database target ${target}`)
  if (!DB_HOST || !DB_USER || !DB_NAME) return

  // Fire and forget: startup must not wait on (or fail because of) the database.
  import('mysql2/promise')
    .then(async ({ default: mysql }) => {
      const conn = await mysql.createConnection({
        host: DB_HOST,
        port: Number(DB_PORT),
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000),
        // Same TLS rule as src/lib/db.js.
        ...(['1', 'true', 'yes', 'on'].includes(String(process.env.DB_SSL).toLowerCase())
          ? { ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : { rejectUnauthorized: true } }
          : {}),
      })
      try {
        const [[row]] = await conn.query('SELECT DATABASE() AS db, CURRENT_USER() AS account')
        console.log(`[atlas-forge] database reachable: ${row.db} as ${row.account}`)
      } finally {
        await conn.end()
      }
    })
    .catch((error) => {
      console.error(
        `[atlas-forge] database UNREACHABLE (${error.code ?? 'ERROR'}): ${error.sqlMessage ?? error.message}`
      )
    })
}
