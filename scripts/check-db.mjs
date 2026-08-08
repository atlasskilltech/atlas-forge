/**
 * Database connectivity check.
 *
 *   npm run db:check
 *
 * Reads the same variables the application uses (loaded by --env-file), so a
 * pass here means the app's pool will connect too. Run it after changing
 * .env.local or pointing at a different MySQL server.
 */
import mysql from 'mysql2/promise'

const {
  DB_HOST,
  DB_PORT = '3306',
  DB_USER,
  DB_PASSWORD = '',
  DB_NAME,
  DB_CONNECTION_LIMIT = '10',
} = process.env

const missing = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter((k) => !process.env[k])
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`)
  console.error('Copy .env.example to .env.local and fill it in.')
  process.exit(1)
}

const line = (label, value) => console.log(`  ${label.padEnd(24)}${value}`)

console.log(`\nATLAS Forge — database check`)
console.log(`  target                  ${DB_HOST}:${DB_PORT}/${DB_NAME}`)
console.log(`  user                    ${DB_USER} (password ${DB_PASSWORD ? 'set' : 'blank'})\n`)

let exitCode = 0
let server

try {
  server = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    connectTimeout: 8000,
  })
  const [[v]] = await server.query('SELECT VERSION() AS version')
  line('server reachable', `MySQL ${v.version}`)
} catch (error) {
  line('server UNREACHABLE', `${error.code}: ${error.message}`)
  console.error('\nIs MySQL running, and are the credentials correct?\n')
  process.exit(1)
}

const [schemas] = await server.query(
  `SELECT DEFAULT_CHARACTER_SET_NAME AS charset, DEFAULT_COLLATION_NAME AS collation
     FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`,
  [DB_NAME]
)
const dbExists = schemas.length > 0
line('database', dbExists ? `exists (${schemas[0].charset} / ${schemas[0].collation})` : `"${DB_NAME}" not created yet`)
await server.end()

if (dbExists) {
  const pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(DB_CONNECTION_LIMIT),
    timezone: 'Z',
    charset: 'utf8mb4_unicode_ci',
    multipleStatements: false,
  })

  try {
    const [[ping]] = await pool.query('SELECT 1 AS ok')
    line('pool connect', `ok=${ping.ok}`)

    const [[bound]] = await pool.execute('SELECT ? + ? AS sum, ? AS text', [2, 3, 'héllo ✓'])
    line('prepared statement', `${bound.sum}, utf8mb4 round-trip "${bound.text}"`)

    const started = Date.now()
    await Promise.all(Array.from({ length: 10 }, () => pool.query('SELECT SLEEP(0.05)')))
    line('10 parallel queries', `${Date.now() - started}ms across pool of ${DB_CONNECTION_LIMIT}`)

    const conn = await pool.getConnection()
    await conn.beginTransaction()
    await conn.query('CREATE TEMPORARY TABLE _tx_probe (id INT)')
    await conn.execute('INSERT INTO _tx_probe (id) VALUES (?)', [1])
    await conn.rollback()
    conn.release()
    line('transaction rollback', 'ok')

    const [tables] = await pool.query(
      'SELECT COUNT(*) AS n FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [DB_NAME]
    )
    line('tables present', tables[0].n)
  } catch (error) {
    line('pool FAILED', `${error.code}: ${error.message}`)
    exitCode = 1
  } finally {
    await pool.end()
  }
} else {
  console.log('\n  Schema has not been created yet — that is expected before Step 3 is approved.')
}

console.log(exitCode === 0 ? '\nAll checks passed.\n' : '\nChecks failed.\n')
process.exit(exitCode)
