import 'server-only'

import mysql from 'mysql2/promise'
import { dbConfig, describeDbTarget, isProduction } from '@/lib/config/env'
import { logger } from '@/lib/logger'

/**
 * The single MySQL access point for the entire application.
 *
 * Nothing above this file ever imports `mysql2`. Repositories call the helpers
 * exported here; React components never call either. The `server-only` import
 * makes an accidental client import a build error rather than a runtime leak.
 *
 * Every helper parameterises its SQL — values are passed to the driver as a
 * separate array and are never interpolated into the statement string.
 */

/**
 * Next.js reloads modules on every edit in development, which would otherwise
 * leak a new pool (and its sockets) per reload. Caching on `globalThis` keeps
 * exactly one pool per process.
 */
const globalForDb = globalThis

function buildPool() {
  return mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,

    waitForConnections: true,
    connectionLimit: dbConfig.connectionLimit,
    queueLimit: dbConfig.queueLimit,
    connectTimeout: dbConfig.connectTimeout,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,

    // Treat DATETIME/TIMESTAMP as UTC in both directions so values never shift
    // with the server's local timezone.
    timezone: 'Z',
    dateStrings: false,
    // Return DECIMAL and BIGINT as strings only when they would lose precision,
    // so ordinary ids stay JS numbers.
    supportBigNumbers: true,
    bigNumberStrings: false,
    decimalNumbers: true,
    charset: 'utf8mb4_unicode_ci',
    multipleStatements: false, // defence in depth against statement injection

    ...(dbConfig.ssl
      ? { ssl: dbConfig.sslCa ? { ca: dbConfig.sslCa } : { rejectUnauthorized: true } }
      : {}),
  })
}

/**
 * The SQL mode every connection runs under.
 *
 * `STRICT_TRANS_TABLES` is the reason this exists. Without it MySQL treats
 * "this value does not fit" as a warning: a 300-character subject going into a
 * `VARCHAR(255)` is silently cut to 255 and the write reports success, so the
 * application stores data the user never wrote and never learns it happened.
 * A stock MySQL 8 is strict by default, so leaving it to the server means the
 * same request corrupts data on one machine and fails on another.
 *
 * `ONLY_FULL_GROUP_BY` is deliberately NOT included. It is part of the MySQL 8
 * default, but several reporting queries here select columns alongside an
 * aggregate in ways it rejects, and turning it on would break working screens
 * to no benefit — the grouping in those queries is already unambiguous.
 */
const SQL_MODE = [
  'STRICT_TRANS_TABLES',
  'NO_ZERO_IN_DATE',
  'NO_ZERO_DATE',
  'ERROR_FOR_DIVISION_BY_ZERO',
  'NO_ENGINE_SUBSTITUTION',
].join(',')

/** @type {import('mysql2/promise').Pool} */
export const pool = globalForDb.__atlasForgePool ?? buildPool()

/**
 * Applied per connection rather than through a pool option, which mysql2 does
 * not offer for `sql_mode`. The pool emits this for each new physical
 * connection, including ones created later to meet demand.
 *
 * A failure here is logged rather than thrown: the connection is still usable,
 * and refusing to serve the request would be a worse outcome than running with
 * the server's own mode.
 */
pool.on('connection', (connection) => {
  connection.query(`SET SESSION sql_mode = '${SQL_MODE}'`, (error) => {
    if (error) logger.error('could not set session sql_mode', { reason: error.message })
  })
})

if (!isProduction) globalForDb.__atlasForgePool = pool

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Wraps driver errors so callers get a stable shape and stack, and so raw
 * MySQL messages (which can echo query fragments) never reach a response body.
 */
export class DatabaseError extends Error {
  constructor(message, { cause, sql, code } = {}) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code ?? cause?.code ?? 'DB_ERROR'
    this.sql = sql
    if (cause) this.cause = cause
  }

  /** True when the failure was a duplicate value on a UNIQUE key. */
  get isDuplicate() {
    return this.code === 'ER_DUP_ENTRY'
  }

  /** True when a foreign key constraint rejected the write. */
  get isForeignKeyViolation() {
    return (
      this.code === 'ER_NO_REFERENCED_ROW_2' ||
      this.code === 'ER_ROW_IS_REFERENCED_2' ||
      this.code === 'ER_NO_REFERENCED_ROW'
    )
  }
}

function fail(error, sql) {
  if (dbConfig.debug) logger.debug('query failed', { sql, error })
  throw new DatabaseError(
    `Database query failed (${error.code ?? 'unknown'})`,
    { cause: error, sql, code: error.code }
  )
}

/* -------------------------------------------------------------------------- */
/* Core helpers                                                               */
/* -------------------------------------------------------------------------- */

async function run(executor, sql, params) {
  const startedAt = dbConfig.debug ? performance.now() : 0
  try {
    const [result] = await executor.execute(sql, params)
    if (dbConfig.debug) {
      const ms = (performance.now() - startedAt).toFixed(1)
      logger.debug('query', { ms: Number(ms), sql: sql.replace(/\s+/g, ' ').trim().slice(0, 160) })
    }
    return result
  } catch (error) {
    fail(error, sql)
  }
}

/**
 * Run a SELECT and return every row.
 *
 * @param {string} sql       Statement with `?` placeholders.
 * @param {Array}  [params]  Values bound by the driver, never interpolated.
 * @param {object} [conn]    Optional connection, for use inside a transaction.
 * @returns {Promise<object[]>}
 */
export async function query(sql, params = [], conn = pool) {
  return run(conn, sql, params)
}

/**
 * Run a SELECT expected to match at most one row.
 * @returns {Promise<object|null>}
 */
export async function queryOne(sql, params = [], conn = pool) {
  const rows = await run(conn, sql, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Run an INSERT/UPDATE/DELETE.
 * @returns {Promise<{affectedRows:number, insertId:number, changedRows:number}>}
 */
export async function execute(sql, params = [], conn = pool) {
  const result = await run(conn, sql, params)
  return {
    affectedRows: result.affectedRows ?? 0,
    insertId: result.insertId ?? 0,
    changedRows: result.changedRows ?? 0,
  }
}

/** Convenience for INSERTs — returns the new primary key. */
export async function insert(sql, params = [], conn = pool) {
  const { insertId } = await execute(sql, params, conn)
  return insertId
}

/** Scalar SELECT, e.g. `SELECT COUNT(*) AS total ...`. */
export async function queryValue(sql, params = [], conn = pool) {
  const row = await queryOne(sql, params, conn)
  if (!row) return null
  const values = Object.values(row)
  return values.length > 0 ? values[0] : null
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Run `callback` inside a transaction on a dedicated connection.
 *
 * Commits on success, rolls back on any throw, and always releases the
 * connection back to the pool.
 *
 * @example
 *   await transaction(async (tx) => {
 *     const id = await insert('INSERT INTO listings ...', [...], tx)
 *     await execute('INSERT INTO listing_skills ...', [id, skillId], tx)
 *   })
 */
export async function transaction(callback) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      if (dbConfig.debug) logger.error('rollback failed', { error: rollbackError })
    }
    if (error instanceof DatabaseError) throw error
    throw new DatabaseError(`Transaction failed: ${error.message}`, { cause: error })
  } finally {
    connection.release()
  }
}

/* -------------------------------------------------------------------------- */
/* Operations                                                                 */
/* -------------------------------------------------------------------------- */

/** Liveness probe for a health route. Never returns credentials. */
export async function healthCheck() {
  const startedAt = performance.now()
  try {
    await pool.query('SELECT 1')
    return {
      ok: true,
      target: describeDbTarget(),
      latencyMs: Number((performance.now() - startedAt).toFixed(1)),
    }
  } catch (error) {
    return {
      ok: false,
      target: describeDbTarget(),
      code: error.code ?? 'UNKNOWN',
      message: 'Unable to reach the database.',
    }
  }
}

/** Closes the pool. For scripts and tests — the server keeps it open. */
export async function closePool() {
  await pool.end()
  if (!isProduction) delete globalForDb.__atlasForgePool
}
