/**
 * ATLAS Forge transactional email templates.
 *
 * Centralised and reusable: each function returns `{ subject, html, text }` and
 * nothing else — no transport, no secrets, no environment reads. The email
 * service (`./registration-emails`) composes these and hands them to
 * `sendMail`. Keeping them pure means they can be rendered in a test without a
 * live SMTP connection.
 *
 * Every value that originates from user input (name, reason) is HTML-escaped
 * before it reaches the markup.
 */

const BRAND = {
  ink: '#362980',
  purple: '#584add',
  text: '#2b2b38',
  muted: '#6c6b80',
  line: '#e2e1ec',
  panel: '#f4f3fb',
  bg: '#f2f2f5',
}

const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
  )

const firstName = (name) => String(name ?? '').trim().split(/\s+/)[0] || 'there'

/**
 * The shared, email-client-safe shell: a centred 600px card with a wordmark
 * header and a footer. Table-based and inline-styled because that is what mail
 * clients reliably render; no external CSS or web fonts.
 */
function layout({ preview = '', heading, bodyHtml }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BRAND.line};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:${BRAND.ink};padding:22px 32px;">
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:2px;color:#ffffff;">ATLAS&nbsp;FORGE</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:${BRAND.text};">
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND.ink};">${esc(heading)}</h1>
          ${bodyHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:20px 32px;border-top:1px solid ${BRAND.line};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
          ATLAS Forge — the Product Development Centre for ATLAS SkillTech University.<br>
          This is an automated message. You can reply to this email to reach the team.
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

const p = (html) =>
  `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND.text};">${html}</p>`

const button = (label, href) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;"><tr><td style="border-radius:8px;background:${BRAND.ink};">
    <a href="${esc(href)}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">${esc(label)}</a>
  </td></tr></table>`

const credRow = (label, value) =>
  `<tr>
    <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};width:150px;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:${BRAND.text};font-family:'Courier New',monospace;"><strong>${esc(value)}</strong></td>
  </tr>`

/* -------------------------------------------------------------------------- */
/* A — Pending registration                                                   */
/* -------------------------------------------------------------------------- */

export function pendingRegistration({ fullName, reference }) {
  const body =
    p(`Hi ${esc(firstName(fullName))},`) +
    p(`Thank you for registering to join the <strong>ATLAS Forge network</strong>. Your registration has been received and is now <strong>pending review</strong> by the ATLAS Forge team.`) +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-radius:8px;"><tr><td style="padding:14px 18px;font-size:14px;color:${BRAND.text};">Your reference ID: <strong style="font-family:'Courier New',monospace;">${esc(reference)}</strong></td></tr></table>` +
    p(`Your access is <strong>not active yet</strong>. We'll email you again once your registration has been reviewed.`) +
    p(`Please keep your reference ID for any correspondence.`)

  const text = `Hi ${firstName(fullName)},

Thank you for registering to join the ATLAS Forge network. Your registration has been received and is pending review by the ATLAS Forge team.

Your reference ID: ${reference}

Your access is not active yet. We'll email you again once your registration has been reviewed.

— ATLAS Forge`

  return {
    subject: 'We’ve received your ATLAS Forge registration',
    html: layout({ preview: 'Your registration is pending review.', heading: 'Registration received', bodyHtml: body }),
    text,
  }
}

/* -------------------------------------------------------------------------- */
/* B — Approval (new account, with temporary credentials)                     */
/* -------------------------------------------------------------------------- */

export function approvalNewAccount({ fullName, appId, temporaryPassword, loginUrl }) {
  const body =
    p(`Hi ${esc(firstName(fullName))},`) +
    p(`Good news — your registration has been <strong>approved</strong> and your ATLAS Forge account is ready.`) +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 6px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-radius:8px;width:100%;"><tr><td style="padding:16px 18px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        ${credRow('App ID', appId)}
        ${credRow('Temporary password', temporaryPassword)}
      </table>
    </td></tr></table>` +
    p(`<span style="color:${BRAND.muted};font-size:13px;">You can sign in with either your App ID or your email address.</span>`) +
    button('Sign in to ATLAS Forge', loginUrl) +
    p(`<strong>Important:</strong> for your security you must <strong>change this temporary password the first time you sign in</strong> — you'll be prompted automatically before you can continue.`) +
    p(`<span style="color:${BRAND.muted};font-size:13px;">If you didn't request this, please contact us by replying to this email.</span>`)

  const text = `Hi ${firstName(fullName)},

Your registration has been approved and your ATLAS Forge account is ready.

App ID: ${appId}
Temporary password: ${temporaryPassword}

Sign in: ${loginUrl}
(You can sign in with your App ID or your email address.)

IMPORTANT: You must change this temporary password the first time you sign in — you'll be prompted automatically before you can continue.

— ATLAS Forge`

  return {
    subject: 'Your ATLAS Forge account is ready',
    html: layout({ preview: 'Your account is ready — sign in and set a new password.', heading: 'Welcome to ATLAS Forge', bodyHtml: body }),
    text,
  }
}

/* --- Approval where the email already had an active account ---------------- */

export function approvalExistingAccount({ fullName, loginUrl }) {
  const body =
    p(`Hi ${esc(firstName(fullName))},`) +
    p(`Good news — your registration has been <strong>approved</strong> and you've been added to the ATLAS Forge network.`) +
    p(`This email already has an ATLAS Forge account, so there are no new credentials — just sign in with your existing password.`) +
    button('Sign in to ATLAS Forge', loginUrl) +
    p(`<span style="color:${BRAND.muted};font-size:13px;">If you've forgotten your password, contact us by replying to this email.</span>`)

  const text = `Hi ${firstName(fullName)},

Your registration has been approved and you've been added to the ATLAS Forge network.

This email already has an ATLAS Forge account, so there are no new credentials — just sign in with your existing password.

Sign in: ${loginUrl}

— ATLAS Forge`

  return {
    subject: 'Your ATLAS Forge registration is approved',
    html: layout({ preview: 'Your registration is approved.', heading: 'Your registration is approved', bodyHtml: body }),
    text,
  }
}

/* -------------------------------------------------------------------------- */
/* C — Rejection                                                              */
/* -------------------------------------------------------------------------- */

export function rejection({ fullName, reference, reason }) {
  const body =
    p(`Hi ${esc(firstName(fullName))},`) +
    p(`Thank you for your interest in the ATLAS Forge network. After review, we're <strong>unable to approve your registration at this time</strong>.`) +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-radius:8px;width:100%;"><tr><td style="padding:14px 18px;font-size:14px;color:${BRAND.text};">
      <div style="color:${BRAND.muted};font-size:13px;margin-bottom:4px;">Reason</div>
      <div>${esc(reason)}</div>
    </td></tr></table>` +
    p(`Reference ID: <strong style="font-family:'Courier New',monospace;">${esc(reference)}</strong>`) +
    p(`If you believe this was a mistake or would like to discuss it, you can reply to this email.`)

  const text = `Hi ${firstName(fullName)},

Thank you for your interest in the ATLAS Forge network. After review, we're unable to approve your registration at this time.

Reason: ${reason}

Reference ID: ${reference}

If you believe this was a mistake or would like to discuss it, you can reply to this email.

— ATLAS Forge`

  return {
    subject: 'Update on your ATLAS Forge registration',
    html: layout({ preview: 'An update on your registration.', heading: 'Registration update', bodyHtml: body }),
    text,
  }
}
