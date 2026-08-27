import { route } from '@/lib/api/respond'
import { requireIdentity } from '@/lib/auth/guard'
import { NotFoundError } from '@/lib/errors'
import { documentsService } from '@/lib/services'

/**
 * GET /api/documents/:id/download — one compliance document.
 *
 * Not under /founder or /forge, because both reach it: the service decides
 * from the document's own row whether this caller may have it (owner, or staff
 * holding `document.view_all`). Putting it under one role's prefix would imply
 * the prefix was doing the work.
 *
 * Under /api on purpose. `next.config.mjs` stamps every /api response with
 * `Cache-Control: no-store`, which is what a shareholders' agreement needs and
 * the exact opposite of the year-long `immutable` header the public logo route
 * sends. Nothing about these files is cacheable by a shared proxy.
 *
 * A caller who may not have the document gets 404, not 403 — see
 * `assertCanRead`. Confirming that somebody else's document exists is itself a
 * disclosure.
 */
export const GET = route(async (_request, { params }) => {
  const identity = await requireIdentity()
  const { id } = await params

  const documentId = Number(id)
  if (!Number.isInteger(documentId) || documentId <= 0) throw new NotFoundError('Document')

  const { document, body, mime } = await documentsService.download({ identity, documentId })

  return new Response(body, {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(body.length),
      // `attachment`, always. These files are never rendered in the tab: an
      // inline document is a document the browser may execute in our origin.
      'Content-Disposition': `attachment; filename="${asciiFilename(document.originalName)}"; filename*=UTF-8''${encodeURIComponent(document.originalName)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
})

/**
 * A quoted `filename` must be plain ASCII, so a name with an accent or a quote
 * in it needs a fallback beside the RFC 5987 `filename*` above. Browsers that
 * understand `filename*` use it; the rest get this.
 */
function asciiFilename(name) {
  return (
    String(name)
      .replace(/[^\x20-\x7e]/g, '_')
      .replace(/["\\]/g, '_')
      .slice(0, 120) || 'document'
  )
}
