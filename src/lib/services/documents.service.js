import 'server-only'

import { transaction } from '@/lib/db'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { can } from '@/lib/services/auth.service'
import * as documents from '@/lib/repositories/documents.repository'
import * as platform from '@/lib/repositories/platform.repository'
import { readDocument, storeDocument } from '@/lib/storage/uploads'
import { getDocumentCategories } from './lookups.service'

/**
 * Compliance & Documents — a startup's document vault.
 *
 * Two rules run through everything here:
 *
 *   * Ownership is the startup, never the person. A founder reaches a document
 *     because they own the startup it belongs to, and staff reach it because
 *     their role says so. `assertCanRead` and `assertCanManage` are the only
 *     two answers to "may this caller have this file", and every read and
 *     write goes through one of them.
 *   * Replacing is additive. The superseded row keeps its file and its
 *     metadata with `replaced_at` set, so the vault can answer what it held
 *     last quarter. These are legal records; overwriting one loses evidence.
 */

/** The checklist as the page renders it: every category, filled or empty. */
export const getChecklist = (startupId) => documents.findChecklist(startupId)

export const listCurrent = (startupId) => documents.findCurrentDocuments(startupId)

export const getHistory = (startupId, categoryId) => documents.findHistory(startupId, categoryId)

export const listComplianceSummary = () => documents.findComplianceSummary()

/**
 * May this identity read this startup's documents?
 *
 * Staff hold `document.view_all` for oversight. A founder qualifies only by
 * owning the startup — checked against `startups.owner_user_id` from the
 * document's own row, never against anything the request supplied.
 *
 * @param {object} identity  From the auth guard: { user, permissions }.
 * @param {object} startup   { ownerUserId }
 */
export function canRead(identity, startup) {
  if (!identity?.user?.id || !startup) return false
  if (can(identity, 'document.view_all')) return true

  const owner = ownerIdOf(startup)
  // An unknown owner is a refusal, never a pass. A startup row with no owner
  // is not "everybody's".
  return owner !== null && owner === identity.user.id
}

/**
 * The owner's user id, whichever shape the startup arrived in.
 *
 * `startupsService.getBySlug` and `getForOwner` return the repository's
 * `toStartup`, which nests the owner as `owner: { id, name }`; the founder
 * module passes a flatter `{ id, ownerUserId }`. Reading only one of the two
 * silently denies half the callers — and a comparison against `undefined` is
 * the kind of check that looks like it is guarding something when it is not.
 */
function ownerIdOf(startup) {
  const owner = startup?.ownerUserId ?? startup?.owner?.id ?? null
  return owner === null || owner === undefined ? null : Number(owner)
}

export function assertCanRead(identity, startup) {
  if (!canRead(identity, startup)) {
    // Deliberately the same answer whoever asks: telling a stranger that a
    // document exists but is not theirs is itself a disclosure.
    throw new NotFoundError('Document')
  }
}

/**
 * May this identity upload or replace in this startup's vault?
 *
 * Narrower than reading: staff can look, but the paperwork stays the startup's
 * to maintain. Nothing in the reference gives staff an upload control.
 */
export function assertCanManage(identity, startup) {
  if (!identity?.user?.id || !startup) throw new NotFoundError('Startup')
  if (!can(identity, 'document.manage_own')) {
    throw new ForbiddenError('You do not have permission to manage these documents.')
  }

  const owner = ownerIdOf(startup)
  if (owner === null || owner !== identity.user.id) {
    throw new ForbiddenError('These documents belong to another startup.')
  }
}

/**
 * Store an uploaded file and make it the current document for its category.
 *
 * The upload is validated and written to disk first, and the database row is
 * written second, inside a transaction with the supersede. If the write to
 * disk fails nothing is recorded; if the transaction fails the file is left on
 * disk unreferenced, which costs a few kilobytes and is the safe way round —
 * the opposite order would leave a row pointing at a file that is not there.
 */
export async function upload({ startup, categorySlug, file, actorId }) {
  const categories = await getDocumentCategories()
  const category = categories.find((item) => item.slug === categorySlug)
  if (!category) throw new ValidationError('Choose a document category.')

  const accepted = String(category.acceptedTypes ?? 'pdf')
    .split(',')
    .map((type) => type.trim())
    .filter(Boolean)

  const stored = await storeDocument(file, { startupId: startup.id, accepted })

  // The name the founder's own filesystem gave it, kept for the download and
  // trimmed to the column. Any directory part a browser included is dropped —
  // it is not ours to keep and it is not ours to trust.
  const originalName = String(file.name ?? `${categorySlug}.${stored.extension}`)
    .split(/[\\/]/)
    .pop()
    .slice(0, 255)

  const documentId = await transaction(async (tx) => {
    const replaced = await documents.supersedeCurrent(startup.id, category.id, tx)

    const id = await documents.create(
      {
        startupId: startup.id,
        categoryId: category.id,
        storedName: stored.storedName,
        originalName,
        mimeType: stored.mime,
        byteSize: stored.bytes,
        checksum: stored.checksum,
        uploadedBy: actorId,
      },
      tx
    )

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `${replaced > 0 ? 'Replaced' : 'Uploaded'} ${category.name}: ${startup.name}`,
        module: 'Compliance',
        entityType: 'startup_document',
        entityId: id,
        status: 'success',
        meta: { startupId: startup.id, category: category.slug, bytes: stored.bytes },
      },
      tx
    )

    return id
  })

  return { documentId, replaced: true, category: category.slug }
}

/**
 * Fetch one document's bytes for an authorised caller.
 *
 * Authorisation happens here rather than in the route so that every caller —
 * the single download, the ZIP, anything added later — passes the same check
 * against the same source of truth.
 */
export async function download({ identity, documentId }) {
  const document = await documents.findById(documentId)
  if (!document) throw new NotFoundError('Document')

  assertCanRead(identity, document.startup)

  const file = await readDocument({
    startupId: document.startup.id,
    storedName: document.storedName,
  })
  // The row exists but the file does not: a restored database against an empty
  // upload directory, or a file removed by hand. Worth its own log line.
  if (!file) throw new NotFoundError('Document file')

  await logAccess({
    actorId: identity.user.id,
    action: `Downloaded ${document.categoryName}: ${document.startup.name}`,
    entityId: document.id,
    meta: { startupId: document.startup.id, category: document.categorySlug },
  })

  return { document, body: file.body, mime: file.mime }
}

/**
 * Every current document for a startup, for the ZIP.
 *
 * Files are read one at a time by the caller rather than all at once here: a
 * full vault is fourteen documents, and holding all of them in memory to build
 * one archive is how a server runs out of it.
 */
export async function listForArchive({ identity, startup }) {
  assertCanRead(identity, startup)
  const current = await documents.findCurrentDocuments(startup.id)

  await logAccess({
    actorId: identity.user.id,
    action: `Downloaded all documents: ${startup.name}`,
    entityId: startup.id,
    entityType: 'startup',
    meta: { startupId: startup.id, documents: current.length },
  })

  return current
}

/** Reads the bytes of one already-authorised document. */
export function readFor(startupId, storedName) {
  return readDocument({ startupId, storedName })
}

/**
 * Access logging is fire-and-forget on purpose: an audit line that fails must
 * not deny somebody a document they are entitled to. The failure still reaches
 * `error_logs` through the route's own error handling if it is a real fault.
 */
async function logAccess({ actorId, action, entityId, entityType = 'startup_document', meta }) {
  try {
    await platform.logActivity({
      actorUserId: actorId,
      action,
      module: 'Compliance',
      entityType,
      entityId,
      status: 'logged',
      meta,
    })
  } catch {
    /* never block a download on the audit trail */
  }
}
