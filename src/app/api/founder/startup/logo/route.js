import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/**
 * POST /api/founder/startup/logo — multipart body with one `file` part.
 *
 * Stores the image and answers with the URL it will be served from. It does
 * NOT write `startups.logo_url`: Edit Listing saves on "Save Changes", and a
 * founder who picks a logo and then leaves the page should not have changed
 * their listing. The form sends the returned URL with the rest of the fields,
 * so the same request that saves the tagline saves the logo — and the field
 * works identically in the Startup Profile Setup mode, where there is not yet
 * a startup row to write to.
 *
 * `readJson` is not used here: the body is multipart, and its size is bounded
 * by the upload limit rather than by MAX_BODY_BYTES.
 */
export const POST = route(async (request) => {
  const identity = await requireRole('founder')
  const form = await request.formData()
  return ok(await founder.uploadStartupLogo(identity.user, form.get('file')))
})
