import { created, ok, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/documents — the founder's own compliance checklist. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getCompliance(identity.user))
})

/**
 * POST /api/founder/documents — multipart body with `categorySlug` and `file`.
 *
 * Upload and replace are the same request: the service supersedes whatever is
 * current in that slot and inserts the new version, so there is no separate
 * replace endpoint and no way to end up with two current documents.
 *
 * `readJson` is not used — the body is multipart, and its size is bounded by
 * UPLOAD_MAX_DOCUMENT_BYTES rather than by MAX_BODY_BYTES.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('document.manage_own')
  const form = await request.formData()

  return created(
    await founder.uploadDocument(identity, {
      categorySlug: String(form.get('categorySlug') ?? ''),
      file: form.get('file'),
    })
  )
})
