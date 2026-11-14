/**
 * READ-ONLY: which of the one-role migrations still need to run.
 *
 *   node --env-file=.env scripts/ops/role-migration-state.mjs
 *
 * Prints two lines that scripts/deploy.sh evaluates:
 *   NEED_014=0|1   (forge_users.google_sub missing → migration 014 not applied)
 *   NEED_015=0|1   (uq_user_roles_one_active missing → migration 015 not applied)
 * Exit 1 if the database cannot be read.
 */
import mysql from 'mysql2/promise'
import { dbEnv } from '../lib/forge-db.mjs'

const conn = await mysql.createConnection(dbEnv())
try {
  const [[col]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_users' AND COLUMN_NAME = 'google_sub'`
  )
  const [[idx]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles' AND INDEX_NAME = 'uq_user_roles_one_active'`
  )
  console.log(`NEED_014=${Number(col.n) > 0 ? 0 : 1}`)
  console.log(`NEED_015=${Number(idx.n) > 0 ? 0 : 1}`)
} finally {
  await conn.end()
}
