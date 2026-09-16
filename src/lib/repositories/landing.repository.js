import 'server-only'

import { insert, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/landing'

/**
 * Landing-page enquiries.
 *
 * Repositories own row → domain mapping. Callers pass camelCase and never see
 * a column name.
 */

export function createServiceRequest({
  name,
  email,
  phone,
  serviceRequired,
  message = null,
  sourceIp = '',
  userAgent = null,
}) {
  return insert(sql.INSERT_SERVICE_REQUEST, [
    name,
    email,
    phone,
    serviceRequired,
    message,
    sourceIp,
    userAgent,
  ])
}

export function createPartnerRequest({
  name,
  email,
  phone,
  company,
  message = null,
  sourceIp = '',
  userAgent = null,
}) {
  return insert(sql.INSERT_PARTNER_REQUEST, [
    name,
    email,
    phone,
    company,
    message,
    sourceIp,
    userAgent,
  ])
}

/** `COUNT(*)` comes back as a number already — `queryValue` returns the scalar. */
const count = async (statement, params) => Number((await queryValue(statement, params)) ?? 0)

export const countRecentServiceByEmail = (email, windowSeconds) =>
  count(sql.COUNT_RECENT_SERVICE_BY_EMAIL, [email, windowSeconds])

export const countRecentPartnerByEmail = (email, windowSeconds) =>
  count(sql.COUNT_RECENT_PARTNER_BY_EMAIL, [email, windowSeconds])

export const countRecentServiceByIp = (ip, windowSeconds) =>
  count(sql.COUNT_RECENT_SERVICE_BY_IP, [ip, windowSeconds])

export const countRecentPartnerByIp = (ip, windowSeconds) =>
  count(sql.COUNT_RECENT_PARTNER_BY_IP, [ip, windowSeconds])
