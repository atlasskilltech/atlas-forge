import { readStoredFile } from '@/lib/storage/uploads'

/**
 * GET /uploads/<folder>/<file> — serves a stored upload from UPLOAD_DIR.
 *
 * Uploads live outside the deployed directory (so a release cannot delete
 * them), which puts them outside `public/` too, and Next only serves `public/`.
 * This handler is the bridge — the one route that reads the upload directory.
 *
 * Not under `/api`, deliberately: `next.config.mjs` stamps every `/api/*`
 * response with `Cache-Control: no-store`, which is right for personal JSON and
 * wrong for an immutable image that every visitor to a startup page loads.
 *
 * `readStoredFile` returns null for anything that is not a name this
 * application wrote, so a crafted path is a 404 rather than a file read.
 *
 * No auth check: a logo is public by nature — it renders on the student-facing
 * project browser — and the file name is a SHA-256 of the contents, so the URL
 * is unguessable for anyone who has not been shown it.
 */
export async function GET(_request, { params }) {
  const { path } = await params
  const file = await readStoredFile(path)

  if (!file) return new Response('Not found', { status: 404 })

  return new Response(file.body, {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.body.length),
      // The name is a content hash, so a given URL can never point at
      // different bytes — the strongest caching HTTP offers is also the safest.
      'Cache-Control': 'public, max-age=31536000, immutable',
      // The bytes were checked against an image signature before they were
      // stored; this stops a browser from deciding otherwise.
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  })
}
