import 'server-only'

import nodemailer from 'nodemailer'

/**
 * The transactional email service.
 *
 * All SMTP configuration is read from the environment — nothing is hardcoded,
 * and the password never leaves `process.env`. The transport is created once
 * and cached on `globalThis` so Next's dev hot-reload does not open a new pool
 * on every edit (the same approach as the MySQL pool in `src/lib/db.js`).
 *
 * This phase is infrastructure only: it can open an authenticated connection
 * (`verifyConnection`) and send a message (`sendMail`), but the actual
 * registration / approval emails are built in a later phase.
 *
 * Reference: GoDaddy/Titan mailbox — host smtp.titan.email, port 465 (implicit
 * TLS). See `.env.example` for the variable names.
 */

const CACHE_KEY = '__atlasForgeMailTransport'

/** SMTP/email settings, read entirely from the environment. */
export function mailEnv() {
  return {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 465),
    // `true` => implicit TLS (port 465); `false` => STARTTLS (port 587).
    secure: String(process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
    replyTo: process.env.MAIL_REPLY_TO ?? '',
  }
}

/** True only when enough is set to actually send — the password included. */
export function isConfigured(env = mailEnv()) {
  return Boolean(env.host && env.user && env.pass && env.from)
}

function getTransport() {
  const env = mailEnv()
  if (!isConfigured(env)) {
    throw new Error(
      'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM in .env.local.'
    )
  }
  if (!globalThis[CACHE_KEY]) {
    globalThis[CACHE_KEY] = nodemailer.createTransport({
      host: env.host,
      port: env.port,
      secure: env.secure,
      auth: { user: env.user, pass: env.pass },
    })
  }
  return globalThis[CACHE_KEY]
}

/**
 * Opens the connection and authenticates WITHOUT sending anything — the safe
 * health check. Throws on a bad host/port/credential so a caller (or the
 * verify script) can report exactly what failed.
 */
export async function verifyConnection() {
  return getTransport().verify()
}

/**
 * Send one message. `from` and the default `replyTo` come from the environment;
 * callers pass the recipient and content. Returns the provider's message id and
 * the accepted/rejected lists so a caller can log the outcome.
 */
export async function sendMail({ to, subject, html, text, replyTo } = {}) {
  if (!to || !subject || (!html && !text)) {
    throw new Error('sendMail requires `to`, `subject`, and `html` or `text`.')
  }
  const env = mailEnv()
  const info = await getTransport().sendMail({
    from: env.from,
    to,
    subject,
    html: html ?? undefined,
    text: text ?? undefined,
    replyTo: replyTo ?? (env.replyTo || undefined),
  })
  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }
}
