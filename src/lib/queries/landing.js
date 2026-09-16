/**
 * SQL for the two public landing-page forms.
 *
 * Statement text only — no driver, no connection. Every value travels as a
 * bound `?` parameter; nothing here interpolates input.
 */

export const INSERT_SERVICE_REQUEST = `
  INSERT INTO service_requests
    (name, email, phone, service_required, message, source_ip, user_agent)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`

export const INSERT_PARTNER_REQUEST = `
  INSERT INTO partner_requests
    (name, email, phone, company, message, source_ip, user_agent)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`

/**
 * Has this address already written in the last `?` seconds?
 *
 * The window is compared inside MySQL rather than against a JS `Date`, so the
 * answer does not depend on the application server's clock agreeing with the
 * database's — the same reason the auth rate limiter does its arithmetic here.
 */
export const COUNT_RECENT_SERVICE_BY_EMAIL = `
  SELECT COUNT(*) AS total
    FROM service_requests
   WHERE email = ?
     AND created_at > (NOW() - INTERVAL ? SECOND)
`

export const COUNT_RECENT_PARTNER_BY_EMAIL = `
  SELECT COUNT(*) AS total
    FROM partner_requests
   WHERE email = ?
     AND created_at > (NOW() - INTERVAL ? SECOND)
`

/** Per-address throttle: submissions from one client across the window. */
export const COUNT_RECENT_SERVICE_BY_IP = `
  SELECT COUNT(*) AS total
    FROM service_requests
   WHERE source_ip = ?
     AND source_ip <> ''
     AND created_at > (NOW() - INTERVAL ? SECOND)
`

export const COUNT_RECENT_PARTNER_BY_IP = `
  SELECT COUNT(*) AS total
    FROM partner_requests
   WHERE source_ip = ?
     AND source_ip <> ''
     AND created_at > (NOW() - INTERVAL ? SECOND)
`
