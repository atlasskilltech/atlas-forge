import 'server-only'

/**
 * Domain errors thrown by services.
 *
 * Route handlers map these to HTTP status codes, so a service never needs to
 * know it is being called over HTTP — the same service works from a Server
 * Action, a script or a test.
 */

export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.details = details
  }

  /** Safe for a response body — never includes stacks or SQL. */
  toJSON() {
    return { error: { code: this.code, message: this.message, ...(this.details && { details: this.details }) } }
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', details) {
    super(message, { status: 422, code: 'VALIDATION_ERROR', details })
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, { status: 404, code: 'NOT_FOUND' })
  }
}

export class ConflictError extends AppError {
  constructor(message = 'That record already exists.') {
    super(message, { status: 409, code: 'CONFLICT' })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(message, { status: 401, code: 'UNAUTHORIZED' })
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do that.') {
    super(message, { status: 403, code: 'FORBIDDEN' })
  }
}

/**
 * Too many attempts in the configured window.
 *
 * `retryAfterSeconds` travels in `details` so the route layer can turn it into
 * the `Retry-After` header without the service knowing anything about HTTP.
 */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many attempts. Try again later.', retryAfterSeconds = 60) {
    super(message, { status: 429, code: 'TOO_MANY_REQUESTS', details: { retryAfterSeconds } })
    this.retryAfterSeconds = retryAfterSeconds
  }
}
