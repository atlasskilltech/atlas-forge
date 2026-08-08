import { ValidationError } from '@/lib/errors'

/**
 * Input limits enforced at the HTTP boundary.
 *
 * These exist because MySQL cannot be relied on to enforce them. This project's
 * development server runs without `STRICT_TRANS_TABLES`, where a 300-character
 * subject in a `VARCHAR(255)` column is silently cut to 255 and reported as a
 * success; a stock MySQL 8, which is strict by default, raises `ER_DATA_TOO_LONG`
 * on exactly the same request and the caller sees a 500. Neither is an
 * acceptable answer to "your subject is too long", and which one you get
 * depends on the server rather than on the application.
 *
 * The connection now asks for strict mode (see `src/lib/db.js`) so the two
 * environments agree, and these helpers turn the class of failure into a 422
 * that names the field.
 */

/** Longest body we will parse at all, before any field is inspected. */
export const MAX_BODY_BYTES = 128 * 1024

/**
 * The ceiling for any single string field, independent of its column.
 *
 * Not a substitute for a column limit — it is the backstop that keeps a
 * megabyte of text out of the parser and off the connection.
 */
export const MAX_FIELD_CHARS = 20_000

/** Column widths shared by several tables, for callers that want the real limit. */
export const LIMITS = Object.freeze({
  title: 255,
  subject: 255,
  name: 255,
  shortText: 500,
  url: 255,
  identifier: 190,
})

/**
 * Collects field errors and throws them as one `ValidationError`.
 *
 * Reporting every bad field at once matters for a form: fixing one error at a
 * time, one round trip each, is how a five-field form takes five submissions.
 * The details travel to the client as `error.details.fields`.
 *
 * @example
 *   const check = validator()
 *   const subject = check.text('subject', input.subject, { required: true, max: 255 })
 *   check.throwIfInvalid()
 */
export function validator() {
  const fields = {}

  const invalid = (field, message) => {
    if (!fields[field]) fields[field] = message
    return undefined
  }

  return {
    /**
     * A trimmed string. Returns `undefined` when invalid, so a caller can keep
     * going and collect the rest of the errors before throwing.
     */
    text(field, value, { required = false, min = 0, max = MAX_FIELD_CHARS, label } = {}) {
      const name = label ?? field
      if (value === undefined || value === null || value === '') {
        return required ? invalid(field, `${name} is required.`) : undefined
      }
      // An object or array here means the caller sent the wrong shape; coercing
      // it would store "[object Object]" rather than reject it.
      if (typeof value !== 'string') return invalid(field, `${name} must be text.`)

      const trimmed = value.trim()
      if (required && trimmed === '') return invalid(field, `${name} is required.`)
      if (trimmed.length < min) {
        return invalid(field, `${name} must be at least ${min} characters.`)
      }
      if (trimmed.length > max) {
        return invalid(field, `${name} must be ${max} characters or fewer.`)
      }
      return trimmed
    },

    /** A positive integer id. Accepts the numeric strings that arrive in JSON. */
    id(field, value, { required = false, label } = {}) {
      const name = label ?? field
      if (value === undefined || value === null || value === '') {
        return required ? invalid(field, `${name} is required.`) : undefined
      }
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return invalid(field, `${name} is not valid.`)
      }
      return parsed
    },

    /** An integer within an inclusive range. */
    integer(field, value, { required = false, min, max, label } = {}) {
      const name = label ?? field
      if (value === undefined || value === null || value === '') {
        return required ? invalid(field, `${name} is required.`) : undefined
      }
      const parsed = Number(value)
      if (!Number.isInteger(parsed)) return invalid(field, `${name} must be a whole number.`)
      if (min !== undefined && parsed < min) {
        return invalid(field, `${name} must be ${min} or more.`)
      }
      if (max !== undefined && parsed > max) {
        return invalid(field, `${name} must be ${max} or less.`)
      }
      return parsed
    },

    /** One of a fixed set. The allowed values are echoed back — they are not secret. */
    oneOf(field, value, allowed, { required = false, label } = {}) {
      const name = label ?? field
      if (value === undefined || value === null || value === '') {
        return required ? invalid(field, `${name} is required.`) : undefined
      }
      if (!allowed.includes(value)) {
        return invalid(field, `${name} must be one of: ${allowed.join(', ')}.`)
      }
      return value
    },

    /** Records a failure discovered by a rule these helpers do not cover. */
    reject: invalid,

    get errors() {
      return fields
    },

    get valid() {
      return Object.keys(fields).length === 0
    },

    throwIfInvalid(message = 'Please correct the highlighted fields.') {
      if (Object.keys(fields).length > 0) throw new ValidationError(message, { fields })
    },
  }
}

/**
 * Rejects a body that is structurally unusable before any field is read.
 *
 * Guards two things a route cannot: a body far larger than any legitimate
 * request, and a string field so long it could only be an attack or a bug.
 * Nesting is walked because several endpoints accept arrays of ids.
 */
export function assertBodyWithinLimits(body, depth = 0) {
  if (body === null || body === undefined) return body
  if (typeof body === 'string') {
    if (body.length > MAX_FIELD_CHARS) {
      throw new ValidationError(
        `One of the submitted values is too long (limit ${MAX_FIELD_CHARS} characters).`
      )
    }
    return body
  }
  if (depth >= 6) throw new ValidationError('The submitted data is nested too deeply.')
  if (Array.isArray(body)) {
    if (body.length > 500) throw new ValidationError('Too many values were submitted at once.')
    for (const item of body) assertBodyWithinLimits(item, depth + 1)
    return body
  }
  if (typeof body === 'object') {
    for (const value of Object.values(body)) assertBodyWithinLimits(value, depth + 1)
  }
  return body
}
