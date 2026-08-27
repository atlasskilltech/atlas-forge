import 'server-only'

import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { uploadsConfig } from '@/lib/config/env'
import { AppError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/**
 * Files uploaded by users, on the server's own disk.
 *
 * This is the only module that writes to `UPLOAD_DIR`, the same way `db.js` is
 * the only module that touches the pool. Everything above it works in terms of
 * the site-relative URL that comes back.
 *
 * Three decisions worth stating:
 *
 *   * The stored name is the SHA-256 of the bytes, so nothing a founder types
 *     reaches the filesystem. Path traversal is impossible by construction
 *     rather than by escaping, and two founders uploading the same image share
 *     one file. That sharing is also why a replaced logo is never deleted —
 *     see `storeImage`.
 *   * The type is decided by the file's leading bytes, not by its name or the
 *     `Content-Type` the browser attached. Both of those are supplied by the
 *     caller and neither survives being renamed; the signature does.
 *   * Writes go to a temporary name and are renamed into place. A rename within
 *     one directory is atomic, so a reader never sees a half-written logo.
 */

/**
 * The image formats the logo field accepts, each with the byte signature that
 * proves it. JPEG's is three bytes because the fourth varies by marker
 * (JFIF, EXIF, ...); WebP's is split — 'RIFF', four bytes of length, then 'WEBP'.
 */
const IMAGE_FORMATS = [
  {
    extension: 'png',
    mime: 'image/png',
    matches: (bytes) =>
      bytes.length > 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  {
    extension: 'jpg',
    mime: 'image/jpeg',
    matches: (bytes) =>
      bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    extension: 'webp',
    mime: 'image/webp',
    matches: (bytes) =>
      bytes.length > 12 &&
      bytes.toString('latin1', 0, 4) === 'RIFF' &&
      bytes.toString('latin1', 8, 12) === 'WEBP',
  },
]

/** For the file picker's `accept` attribute and the message on a rejection. */
export const ACCEPTED_IMAGE_MIME = IMAGE_FORMATS.map((format) => format.mime).join(',')
export const ACCEPTED_IMAGE_LABEL = 'PNG, JPG, JPEG or WebP'
export const MAX_IMAGE_BYTES = uploadsConfig.maxBytes

/**
 * Compliance documents. A separate profile from the images above, not a wider
 * version of it: a startup logo must never be allowed to be a ZIP, and a
 * signed shareholders' agreement must never be allowed to be an SVG.
 *
 * PDF and ZIP only, both proven by signature. ZIP is here because the
 * reference collects IP/trademark papers and business licences as an archive;
 * it is stored and served untouched and is never unpacked on the server.
 *
 * There is deliberately no image or HTML entry. An HTML or SVG upload served
 * back to a browser is a stored cross-site-scripting hole, and these files are
 * downloaded by staff as well as by the founder who uploaded them.
 */
const DOCUMENT_FORMATS = [
  {
    extension: 'pdf',
    mime: 'application/pdf',
    matches: (bytes) => bytes.length > 4 && bytes.toString('latin1', 0, 5) === '%PDF-',
  },
  {
    extension: 'zip',
    mime: 'application/zip',
    // 50 4B 03 04 for a normal archive; 50 4B 05 06 is an empty one, which
    // is a mistake worth rejecting rather than storing.
    matches: (bytes) =>
      bytes.length > 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04,
  },
]

export const MAX_DOCUMENT_BYTES = uploadsConfig.maxDocumentBytes
export const DOCUMENT_MIME_BY_EXTENSION = Object.freeze(
  Object.fromEntries(DOCUMENT_FORMATS.map((format) => [format.extension, format.mime]))
)

/** Content types this module will serve back, keyed by stored extension. */
const SERVED_TYPES = new Map([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['webp', 'image/webp'],
])

/**
 * Folders a caller may write into. A closed list rather than a free string:
 * the folder is the one part of the path a route chooses, and this keeps a
 * future route from inventing `../../.next` as a destination.
 */
const FOLDERS = new Set(['startup-logos', 'startup-documents'])

/**
 * Folders the PUBLIC route may serve. Strictly narrower than FOLDERS above.
 *
 * `startup-documents` is writable but deliberately not listed here: those are
 * a company's incorporation certificate, PAN card and shareholders' agreement,
 * and they are reachable only through an authenticated route that checks who
 * is asking. Two other things already stop the public route reaching them —
 * their paths have three segments, and PDF/ZIP are not in SERVED_TYPES — but
 * neither of those says *why*, and both could be relaxed by accident later.
 */
const PUBLIC_FOLDERS = new Set(['startup-logos'])

/** The URL prefix `src/app/uploads/[...path]/route.js` answers on. */
const PUBLIC_PREFIX = '/uploads'

const megabytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) ? 1 : 0)}MB`

/**
 * Validate and store one uploaded image, returning its site-relative URL.
 *
 * The previous file at the same logical place is left alone. Names are content
 * hashes, so deleting "the old logo" would delete a file another startup may be
 * pointing at — an unreferenced image costs a few kilobytes, a deleted shared
 * one costs somebody else's logo.
 *
 * @param {File} file     From `request.formData()`.
 * @param {string} folder One of FOLDERS.
 * @returns {Promise<{ url: string, bytes: number, mime: string }>}
 */
export async function storeImage(file, folder) {
  if (!FOLDERS.has(folder)) throw new Error(`Unknown upload folder: ${folder}`)

  // `formData()` yields a string for a text field, so this is also what a
  // request that forgot the file part looks like.
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new ValidationError('Choose an image file to upload.', {
      fields: { file: 'No file was received.' },
    })
  }

  // Checked before the bytes are read into memory, then again below: `size` is
  // what the browser claims, and the length of what actually arrived is what
  // ends up on disk.
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      `That image is too large. The limit is ${megabytes(MAX_IMAGE_BYTES)}.`,
      { fields: { file: `Maximum ${megabytes(MAX_IMAGE_BYTES)}.` } }
    )
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  if (bytes.length === 0) {
    throw new ValidationError('That file is empty.', {
      fields: { file: 'The file has no content.' },
    })
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new ValidationError(
      `That image is too large. The limit is ${megabytes(MAX_IMAGE_BYTES)}.`,
      { fields: { file: `Maximum ${megabytes(MAX_IMAGE_BYTES)}.` } }
    )
  }

  const format = IMAGE_FORMATS.find((candidate) => candidate.matches(bytes))
  if (!format) {
    throw new ValidationError(`That file is not a supported image. Use ${ACCEPTED_IMAGE_LABEL}.`, {
      fields: { file: `Only ${ACCEPTED_IMAGE_LABEL} are accepted.` },
    })
  }

  const name = `${createHash('sha256').update(bytes).digest('hex')}.${format.extension}`
  const directory = join(uploadsConfig.directory, folder)

  try {
    await mkdir(directory, { recursive: true })
    // Unique per write, so two concurrent uploads of the same image cannot
    // rename over each other's partial file.
    const temporary = join(directory, `.${name}.${process.pid}.${Date.now()}.part`)
    await writeFile(temporary, bytes)
    await rename(temporary, join(directory, name))
  } catch (error) {
    // A read-only or missing UPLOAD_DIR is a server misconfiguration, not bad
    // input: it is logged with the path so it can be fixed, and answered with
    // a message that does not put that path in front of the user.
    logger.error('upload failed', { directory, code: error?.code, error })
    throw new AppError('The image could not be saved. Please try again.', {
      status: 500,
      code: 'UPLOAD_FAILED',
    })
  }

  return { url: `${PUBLIC_PREFIX}/${folder}/${name}`, bytes: bytes.length, mime: format.mime }
}

/**
 * Read a stored file for serving. Returns `null` when the path is not one this
 * module could have written, or when nothing is there.
 *
 * The segments arrive from the URL, so they are treated as hostile: the shape
 * of every segment is checked against what `storeImage` produces, and the
 * resolved path is then confirmed to be inside the upload root. The second
 * check is what catches anything the first one did not anticipate.
 */
export async function readStoredFile(segments) {
  if (!Array.isArray(segments) || segments.length !== 2) return null

  const [folder, name] = segments
  if (!PUBLIC_FOLDERS.has(folder)) return null
  if (!/^[a-f0-9]{64}\.[a-z]{3,4}$/.test(name)) return null

  const extension = name.split('.').pop()
  const mime = SERVED_TYPES.get(extension)
  if (!mime) return null

  const root = resolve(uploadsConfig.directory)
  const path = resolve(root, folder, name)
  if (!path.startsWith(root + sep)) return null

  try {
    return { body: await readFile(path), mime }
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    logger.error('upload could not be read', { path, code: error?.code, error })
    return null
  }
}


/* -------------------------------------------------------------------------- */
/* Compliance documents                                                       */
/* -------------------------------------------------------------------------- */

/** Where one startup's documents live. Never part of a URL. */
const DOCUMENTS_FOLDER = 'startup-documents'

function documentDirectory(startupId) {
  // Coerced through Number so a caller cannot pass "../../etc" as an id.
  const id = Number(startupId)
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Invalid startup id: ${startupId}`)
  return join(uploadsConfig.directory, DOCUMENTS_FOLDER, String(id))
}

/**
 * Validate and store one compliance document.
 *
 * Returns the metadata `startup_documents` records; it returns no URL, because
 * these files have none. A caller wanting the bytes back goes through
 * `readDocument`, which the authenticated download route calls after it has
 * checked who is asking.
 *
 * `accepted` is the category's own allowlist (`document_categories.accepted_types`),
 * so the Certificate of Incorporation slot can insist on a PDF while the IP
 * & Trademark slot also takes an archive. The signature check comes first and
 * the allowlist second: a ZIP renamed to .pdf fails the signature, and a real
 * ZIP offered to a PDF-only slot fails the allowlist.
 *
 * @param {File} file        From `request.formData()`.
 * @param {object} options
 * @param {number} options.startupId
 * @param {string[]} options.accepted  Extensions this category takes.
 */
export async function storeDocument(file, { startupId, accepted = ['pdf'] } = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new ValidationError('Choose a file to upload.', {
      fields: { file: 'No file was received.' },
    })
  }

  const label = accepted.map((extension) => extension.toUpperCase()).join(' or ')

  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new ValidationError(
      `That file is too large. The limit is ${megabytes(MAX_DOCUMENT_BYTES)}.`,
      { fields: { file: `Maximum ${megabytes(MAX_DOCUMENT_BYTES)}.` } }
    )
  }

  const bytes = Buffer.from(await file.arrayBuffer())

  if (bytes.length === 0) {
    throw new ValidationError('That file is empty.', {
      fields: { file: 'The file has no content.' },
    })
  }
  if (bytes.length > MAX_DOCUMENT_BYTES) {
    throw new ValidationError(
      `That file is too large. The limit is ${megabytes(MAX_DOCUMENT_BYTES)}.`,
      { fields: { file: `Maximum ${megabytes(MAX_DOCUMENT_BYTES)}.` } }
    )
  }

  const format = DOCUMENT_FORMATS.find((candidate) => candidate.matches(bytes))
  if (!format) {
    throw new ValidationError(`That file is not a ${label} document.`, {
      fields: { file: `Only ${label} files are accepted here.` },
    })
  }
  if (!accepted.includes(format.extension)) {
    throw new ValidationError(
      `This document must be a ${label} file, not a ${format.extension.toUpperCase()}.`,
      { fields: { file: `Only ${label} files are accepted here.` } }
    )
  }

  const checksum = createHash('sha256').update(bytes).digest('hex')
  const storedName = `${checksum}.${format.extension}`
  const directory = documentDirectory(startupId)

  try {
    await mkdir(directory, { recursive: true })
    const temporary = join(directory, `.${storedName}.${process.pid}.${Date.now()}.part`)
    await writeFile(temporary, bytes)
    await rename(temporary, join(directory, storedName))
  } catch (error) {
    logger.error('document upload failed', { directory, code: error?.code, error })
    throw new AppError('The document could not be saved. Please try again.', {
      status: 500,
      code: 'UPLOAD_FAILED',
    })
  }

  return {
    storedName,
    checksum,
    bytes: bytes.length,
    mime: format.mime,
    extension: format.extension,
  }
}

/**
 * Read one stored document. Returns null when it is not there.
 *
 * NO authorisation happens here — that is the caller's job, and every caller
 * is a route that has already established who is asking and whether they may
 * have this startup's papers. This function only guarantees that the path it
 * reads is one `storeDocument` could have written: the name must be a SHA-256
 * plus a known extension, and the resolved path must sit inside the startup's
 * own directory.
 */
export async function readDocument({ startupId, storedName }) {
  if (!/^[a-f0-9]{64}\.[a-z]{3,4}$/.test(storedName ?? '')) return null

  const extension = storedName.split('.').pop()
  const mime = DOCUMENT_MIME_BY_EXTENSION[extension]
  if (!mime) return null

  let directory
  try {
    directory = documentDirectory(startupId)
  } catch {
    return null
  }

  const root = resolve(directory)
  const path = resolve(root, storedName)
  if (!path.startsWith(root + sep)) return null

  try {
    return { body: await readFile(path), mime }
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    logger.error('document could not be read', { path, code: error?.code, error })
    return null
  }
}
