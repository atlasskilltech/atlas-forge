import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/** GET /api/backend/users — the full account directory with role group counts. */
export const GET = route(async () => {
  await requireRole('backend-manager')
  return ok(await backend.getUsers())
})

/**
 * POST /api/backend/users — create a staff account.
 *
 * Guarded twice: `requireRole` keeps the route inside the Backend Manager area,
 * and `requirePermission('user.manage')` is the real authority check — the same
 * grant the role already holds in reference data, so no schema change was
 * needed to enable this. Returns 201 with the new account, including a
 * one-time temporary password when the manager left the field blank.
 */
export const POST = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('user.manage')
  return created(await backend.createStaffUser(identity.user, await readJson(request)))
})

/**
 * PATCH /api/backend/users   { userId, role }
 *
 * Change an account's single role to any of the five roles (replacing the old
 * one). Staff roles need an @atlasuniversity.edu.in email.
 */
/**
 * DELETE /api/backend/users   { userId, confirmEmail }
 *
 * PERMANENT hard delete (no backup, no undo), in one transaction. The caller
 * must repeat the user's email; you cannot delete yourself or the last
 * Backend Manager. The preview is GET /api/backend/users/delete-preview.
 */
export const DELETE = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('user.manage')
  return ok(await backend.deleteUser(identity.user, await readJson(request)))
})

export const PATCH = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('user.manage')
  return ok(await backend.changeUserRole(identity.user, await readJson(request)))
})
