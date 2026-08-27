/**
 * Browser-side access to the Route Handlers.
 *
 * Client components never import a service, a repository or `mysql2` — they
 * call these helpers, which speak only HTTP. That is what keeps the database
 * on the server: there is no import path from a `'use client'` file to the
 * pool, and `server-only` turns any attempt into a build error.
 *
 * Every response is unwrapped from the `{ ok, data | error }` envelope, so a
 * caller gets the payload or an `ApiError` and never has to inspect status
 * codes inline.
 */

export class ApiError extends Error {
  constructor(message, { status, code, fields, requestId } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status ?? 0
    this.code = code ?? 'REQUEST_FAILED'
    /**
     * Per-field messages from a 422, keyed by field name — `{}` when the
     * failure was not field-specific. A form can merge this straight into its
     * error state; one that only shows `message` keeps working unchanged.
     */
    this.fields = fields ?? {}
    /** Present on a 500, for quoting to whoever reads the logs. */
    this.requestId = requestId ?? null
  }

  /** The listing was already applied to, the row already exists, and so on. */
  get isConflict() {
    return this.status === 409
  }

  /** The server rejected the submitted values rather than failing. */
  get isValidation() {
    return this.status === 422
  }
}

async function send(path, init) {
  let response
  try {
    response = await fetch(path, {
      ...init,
      // Send the session cookie; never reuse a cached authenticated response.
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('Could not reach the server. Check your connection.', { code: 'NETWORK' })
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.ok !== true) {
    throw new ApiError(payload?.error?.message ?? 'Something went wrong. Please try again.', {
      status: response.status,
      code: payload?.error?.code,
      fields: payload?.error?.details?.fields,
      requestId: payload?.error?.requestId ?? response.headers.get('x-request-id'),
    })
  }

  return payload.data
}

function request(path, { method = 'GET', body, signal } = {}) {
  return send(path, {
    method,
    signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

/**
 * POST a `FormData` body — the file-upload counterpart to `post`.
 *
 * `Content-Type` is deliberately not set: the browser has to add it itself so
 * it can append the multipart boundary. Setting it by hand produces a body the
 * server cannot parse.
 */
function upload(path, formData, { signal } = {}) {
  return send(path, { method: 'POST', signal, body: formData })
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  upload,
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: body ?? {} }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body: body ?? {} }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body: body ?? {} }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
