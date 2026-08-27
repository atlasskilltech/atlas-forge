import 'server-only'

import { execute, insert, query, queryOne } from '@/lib/db'
import * as sql from '@/lib/queries/documents'
import { bool, iso, num } from '@/lib/utils/rows'

/**
 * Compliance document rows.
 *
 * `stored_name` and `checksum` travel no further than the service layer — the
 * presenter drops them. They are the on-disk identity of a private file, and
 * nothing on a page needs them.
 */

const toDocument = (row) =>
  row.id
    ? {
        id: num(row.id),
        startupId: num(row.startup_id),
        categoryId: num(row.category_id),
        storedName: row.stored_name,
        originalName: row.original_name,
        mimeType: row.mime_type,
        byteSize: num(row.byte_size),
        checksum: row.checksum,
        isCurrent: bool(row.is_current),
        replacedAt: iso(row.replaced_at),
        uploadedByName: row.uploaded_by_name ?? null,
        createdAt: iso(row.created_at),
      }
    : null

/** One checklist row: the category, plus its current document or null. */
const toChecklistRow = (row) => ({
  category: {
    id: num(row.category_id),
    slug: row.category_slug,
    name: row.category_name,
    description: row.category_description,
    tier: row.tier,
    acceptedTypes: String(row.accepted_types ?? 'pdf')
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean),
    sortOrder: num(row.sort_order),
  },
  document: toDocument(row),
})

const toSummary = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  initial: row.initial,
  avatarTone: row.avatar_tone,
  logoUrl: row.logo_url ?? null,
  status: row.status,
  uploadedTotal: num(row.uploaded_total) ?? 0,
  uploadedCore: num(row.uploaded_core) ?? 0,
  lastUploadAt: iso(row.last_upload_at),
})

export async function findChecklist(startupId) {
  const rows = await query(sql.SELECT_STARTUP_CHECKLIST, [startupId])
  return rows.map(toChecklistRow)
}

export async function findCurrentDocuments(startupId) {
  const rows = await query(sql.SELECT_CURRENT_DOCUMENTS, [startupId])
  return rows.map((row) => ({
    ...toDocument(row),
    categorySlug: row.category_slug,
    categoryName: row.category_name,
  }))
}

/** One document with enough context for the download route to authorise it. */
export async function findById(id) {
  const row = await queryOne(sql.SELECT_DOCUMENT_BY_ID, [id])
  if (!row) return null
  return {
    ...toDocument(row),
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    startup: {
      id: num(row.startup_id),
      slug: row.startup_slug,
      name: row.startup_name,
      ownerUserId: num(row.owner_user_id),
    },
  }
}

export async function findHistory(startupId, categoryId) {
  const rows = await query(sql.SELECT_DOCUMENT_HISTORY, [startupId, categoryId])
  return rows.map(toDocument)
}

export async function supersedeCurrent(startupId, categoryId, conn) {
  const { affectedRows } = await execute(
    sql.SUPERSEDE_CURRENT_DOCUMENT,
    [startupId, categoryId],
    conn
  )
  return affectedRows
}

export async function create(data, conn) {
  return insert(
    sql.INSERT_DOCUMENT,
    [
      data.startupId,
      data.categoryId,
      data.storedName,
      data.originalName,
      data.mimeType,
      data.byteSize,
      data.checksum,
      data.uploadedBy ?? null,
    ],
    conn
  )
}

export async function findComplianceSummary() {
  const rows = await query(sql.SELECT_COMPLIANCE_SUMMARY)
  return rows.map(toSummary)
}
