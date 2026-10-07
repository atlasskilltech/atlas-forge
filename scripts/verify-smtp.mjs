/**
 * Safe SMTP connection verification for the transactional email setup.
 *
 *   npm run smtp:verify                 # verify connection + auth only (no email sent)
 *   npm run smtp:verify -- --send you@example.com   # also send one test message
 *
 * Reads the same environment variables the app's email service uses
 * (src/lib/email/index.js). Self-contained — like the other scripts in this
 * folder it talks to the service directly rather than importing app code, so it
 * can run as a plain Node ESM module. The password is NEVER printed.
 */
import nodemailer from 'nodemailer'

const env = {
  host: process.env.SMTP_HOST ?? '',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: String(process.env.SMTP_SECURE ?? 'true').toLowerCase() === 'true',
  user: process.env.SMTP_USER ?? '',
  pass: process.env.SMTP_PASS ?? '',
  from: process.env.MAIL_FROM || process.env.SMTP_USER || '',
  replyTo: process.env.MAIL_REPLY_TO ?? '',
}

console.log('SMTP configuration (from environment):')
console.log(`  SMTP_HOST     : ${env.host || '(missing)'}`)
console.log(`  SMTP_PORT     : ${env.port}`)
console.log(`  SMTP_SECURE   : ${env.secure}  (${env.secure ? 'implicit TLS' : 'STARTTLS'})`)
console.log(`  SMTP_USER     : ${env.user || '(missing)'}`)
console.log(`  MAIL_FROM     : ${env.from || '(missing)'}`)
console.log(`  MAIL_REPLY_TO : ${env.replyTo || '(none)'}`)
console.log(`  SMTP_PASS     : ${env.pass ? '(set — not shown)' : '(missing)'}`)

if (!(env.host && env.user && env.pass && env.from)) {
  console.error(
    '\nNot fully configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM in .env.local, then re-run.'
  )
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: env.host,
  port: env.port,
  secure: env.secure,
  auth: { user: env.user, pass: env.pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
})

try {
  console.log(`\nConnecting to ${env.host}:${env.port} …`)
  await transporter.verify()
  console.log('OK — SMTP connection and authentication succeeded. No email was sent.')
} catch (error) {
  console.error(`\nFAILED — ${error.code ? `[${error.code}] ` : ''}${error.message}`)
  process.exit(1)
}

const sendIndex = process.argv.indexOf('--send')
const recipient = sendIndex !== -1 ? process.argv[sendIndex + 1] : null
if (recipient) {
  try {
    const info = await transporter.sendMail({
      from: env.from,
      to: recipient,
      replyTo: env.replyTo || undefined,
      subject: 'ATLAS Forge — SMTP test',
      text: 'This is a test message confirming the ATLAS Forge SMTP configuration works.',
    })
    console.log(`Test email sent to ${recipient} (messageId ${info.messageId}).`)
  } catch (error) {
    console.error(`Test send FAILED — ${error.message}`)
    process.exit(1)
  }
}

process.exit(0)
