import 'server-only'

import { logger } from '@/lib/logger'
import { isConfigured, sendMail } from './index'
import {
  approvalExistingAccount,
  approvalNewAccount,
  pendingRegistration,
  rejection,
} from './templates'

/**
 * Registration email senders.
 *
 * These compose a template and hand it to the shared `sendMail` (no transporter
 * logic is duplicated here). They are deliberately BEST-EFFORT and NEVER throw:
 * every email is sent AFTER its database work has committed, so a send failure
 * must not undo a saved registration, a created account, or a recorded
 * decision. The caller gets `{ sent }` and decides what to surface.
 *
 * Nothing secret is ever logged: only the recipient, the email type and an
 * error code — never the temporary password, the message body, or SMTP_PASS.
 * (The temporary password lives only in the rendered message handed to the
 * transport; it is not passed to the logger.)
 */

/** Runs a send, swallowing every failure into a logged, non-throwing result. */
async function deliver(type, to, build) {
  if (!isConfigured()) {
    logger.warn('registration email skipped — SMTP not configured', { type, to })
    return { sent: false, reason: 'not-configured' }
  }
  try {
    const message = build()
    const { messageId } = await sendMail({ to, subject: message.subject, html: message.html, text: message.text })
    logger.info('registration email sent', { type, to, messageId })
    return { sent: true, messageId }
  } catch (error) {
    // `error` is an Error; the logger records name/message/code, which never
    // contain the password or the body.
    logger.error('registration email failed', { type, to, code: error?.code ?? null })
    return { sent: false, reason: 'send-failed' }
  }
}

export function sendPendingRegistrationEmail({ to, fullName, reference }) {
  return deliver('registration.pending', to, () => pendingRegistration({ fullName, reference }))
}

export function sendApprovalEmail({ to, fullName, appId, temporaryPassword, loginUrl, isNew }) {
  return deliver('registration.approved', to, () =>
    isNew
      ? approvalNewAccount({ fullName, appId, temporaryPassword, loginUrl })
      : approvalExistingAccount({ fullName, loginUrl })
  )
}

export function sendRejectionEmail({ to, fullName, reference, reason }) {
  return deliver('registration.rejected', to, () => rejection({ fullName, reference, reason }))
}
