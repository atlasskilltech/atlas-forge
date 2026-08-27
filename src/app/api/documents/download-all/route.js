import { route } from '@/lib/api/respond'
import { requireIdentity } from '@/lib/auth/guard'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { documentsService, startupsService } from '@/lib/services'
import { readDocument } from '@/lib/storage/uploads'
import { zipStream } from '@/lib/storage/zip'

/**
 * GET /api/documents/download-all — every current document for one startup,
 * as a ZIP.
 *
 *   (no query)          the caller's own startup — the founder's Download all
 *   ?startup=<slug>     that startup — staff oversight, needs document.view_all
 *
 * The archive is streamed and the files are read one at a time as the stream
 * pulls, so a full vault never sits in memory all at once.
 *
 * Authorisation is `listForArchive`, the same check the single download uses,
 * and it runs before a single byte is emitted. Once a stream has started there
 * is no way to turn it into an error response.
 */
export const GET = route(async (request) => {
  const identity = await requireIdentity()
  const slug = new URL(request.url).searchParams.get('startup')

  const startup = slug
    ? await startupsService.getBySlug(slug)
    : await startupsService.getForOwner(identity.user.id)

  if (!startup) throw new NotFoundError('Startup')

  const documents = await documentsService.listForArchive({ identity, startup })
  if (documents.length === 0) {
    throw new ValidationError('There are no documents to download yet.')
  }

  /**
   * Entries are named by category rather than by the uploaded filename: the
   * category is what identifies a document in the vault, it is unique, and it
   * keeps the extracted folder in checklist order. Two categories holding
   * files that happen to share a name would otherwise collide.
   */
  async function* entries() {
    for (const [index, document] of documents.entries()) {
      const file = await readDocument({
        startupId: startup.id,
        storedName: document.storedName,
      })
      // A row whose file is missing is skipped rather than failing the whole
      // archive — thirteen documents are more use than an error.
      if (!file) continue

      const extension = document.storedName.split('.').pop()
      yield {
        name: `${String(index + 1).padStart(2, '0')} ${document.categoryName}.${extension}`,
        body: file.body,
        date: document.createdAt ? new Date(document.createdAt) : undefined,
      }
    }
  }

  const filename = `${startup.slug}-compliance-documents.zip`

  return new Response(zipStream(entries()), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
})
