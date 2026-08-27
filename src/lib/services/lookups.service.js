import 'server-only'

import * as lookups from '@/lib/repositories/lookups.repository'

/**
 * Reference lists. These change rarely and are read on almost every screen, so
 * they are cached for the lifetime of the server process.
 *
 * `db:reference` is the only thing that changes them, and that runs at deploy
 * time — a restart clears the cache. `clearCache()` exists for tests and for a
 * future admin action that edits a lookup at runtime.
 */

const cache = new Map()

async function cached(key, loader) {
  if (!cache.has(key)) cache.set(key, await loader())
  return cache.get(key)
}

export function clearCache() {
  cache.clear()
}

export const getRoles = () => cached('roles', () => lookups.findLookup('roles'))
export const getIndustries = () => cached('industries', () => lookups.findLookup('industries'))
export const getStages = () => cached('stages', () => lookups.findLookup('stages'))
export const getListingTypes = () => cached('listing_types', () => lookups.findLookup('listing_types'))
export const getContractTypes = () => cached('contract_types', () => lookups.findLookup('contract_types'))
export const getMentorTypes = () => cached('mentor_types', () => lookups.findLookup('mentor_types'))
export const getMentorshipAreas = () =>
  cached('mentorship_areas', () => lookups.findLookup('mentorship_areas'))
export const getReadinessItems = () => cached('readiness_items', () => lookups.findLookup('readiness_items'))
export const getDocumentCategories = () =>
  cached('document_categories', () => lookups.findLookup('document_categories'))
export const getSkills = () => cached('skills', () => lookups.findSkills())

/** Resolve a lookup slug to its id, for writes that receive slugs from a form. */
export async function resolveId(list, slug) {
  if (!slug) return null
  const rows = await list()
  return rows.find((row) => row.slug === slug)?.id ?? null
}

export async function getRoleBySlug(slug) {
  const roles = await getRoles()
  return roles.find((role) => role.slug === slug) ?? null
}

/** Everything the form screens need, in one call. */
export async function getFormOptions() {
  const [industries, stages, listingTypes, contractTypes, mentorTypes, skills, readinessItems] =
    await Promise.all([
      getIndustries(),
      getStages(),
      getListingTypes(),
      getContractTypes(),
      getMentorTypes(),
      getSkills(),
      getReadinessItems(),
    ])
  return { industries, stages, listingTypes, contractTypes, mentorTypes, skills, readinessItems }
}

export const getSettings = () => lookups.findAllSettings()
export const getSetting = (key) => lookups.findSetting(key)

/** Settings as a flat `{ key: value }` map for feature checks. */
export async function getSettingsMap() {
  const settings = await lookups.findAllSettings()
  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]))
}
