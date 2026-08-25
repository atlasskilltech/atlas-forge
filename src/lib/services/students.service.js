import 'server-only'

import { transaction } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'
import * as users from '@/lib/repositories/users.repository'
import * as platform from '@/lib/repositories/platform.repository'

/**
 * Student profile, skills and availability.
 *
 * Assembly of whole screens lives with each module in Step 5; this covers the
 * student *entity* so any role that reads a student uses the same code.
 */

export const getPool = (filters) => users.findStudentPool(filters)
export const listAll = () => users.findAll()

/** Full profile: user, student fields and skills. */
export async function getProfile(userId) {
  const profile = await users.findStudentProfile(userId)
  if (!profile) throw new NotFoundError('Student profile')
  const skills = await users.findSkills(userId)
  return { ...profile, skills }
}

export async function updateProfile(userId, { name, email, bio }) {
  return transaction(async (tx) => {
    await users.updateProfile(userId, { name, email, bio }, tx)
    await platform.logActivity(
      {
        actorUserId: userId,
        action: 'Updated profile',
        module: 'Account',
        entityType: 'user',
        entityId: userId,
        status: 'success',
      },
      tx
    )
    return true
  })
}

/**
 * Flag availability.
 *
 * Updates only the four availability columns when a profile row already
 * exists. The upsert is for first-time rows only: its ON DUPLICATE clause
 * writes every column, so reusing it here erased the student's programme and
 * year — data this screen never asks for and has no business clearing.
 */
export async function updateAvailability(userId, data) {
  const existing = await users.findStudentProfile(userId)

  return transaction(async (tx) => {
    if (existing) await users.updateAvailability(userId, data, tx)
    else await users.upsertStudentProfile(userId, data, tx)
    await platform.logActivity(
      {
        actorUserId: userId,
        action: `Flagged availability: ${data.hoursPerWeek ?? 0} hrs/week`,
        module: 'Service',
        entityType: 'student_profile',
        entityId: userId,
        status: 'success',
      },
      tx
    )
    return true
  })
}

/** Replaces the whole skill set — the UI edits skills as a single list. */
export async function updateSkills(userId, skillIds) {
  return transaction(async (tx) => {
    await users.replaceSkills(userId, skillIds, tx)
    return true
  })
}
