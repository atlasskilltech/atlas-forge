/**
 * Imports the alumni mentorship form export into the `mentors` system.
 *
 *   node --env-file=.env.local scripts/import-alumni-mentors.mjs            # dry run
 *   node --env-file=.env.local scripts/import-alumni-mentors.mjs --commit   # writes
 *   node --env-file=.env.local scripts/import-alumni-mentors.mjs --file=<path>
 *
 * Requires migrations/005_alumni_mentors.sql.
 *
 * Dry run is the default on purpose: this writes seventy rows of real people's
 * data, and the run that shows you what it would do should not be the run that
 * does it. Nothing but `--commit` opens a transaction.
 *
 * Re-runnable. Mentors are keyed on `uq_mentors_email`, so a second run updates
 * the same rows rather than creating a second copy of anybody, and each
 * mentor's areas are rewritten from the file rather than appended to.
 *
 * Only the mentoring half of the form is imported. The session/event answers,
 * the investment answers, the incubation-support answers and the free-text
 * comments stay in the CSV: they belong to features that do not exist yet, and
 * a column filled with a guess is worse than a column left empty.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import mysql from 'mysql2/promise'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const commit = args.includes('--commit')
const fileArg = args.find((arg) => arg.startsWith('--file='))?.slice('--file='.length)
const CSV = fileArg
  ? join(root, fileArg)
  : join(root, 'reference', 'Atlas_Forge_Alumni_Mentorship_2026-08-14_06_14_32.csv')

/** Marks every row this import owns, so a rollback can be scoped to them. */
const IMPORT_SOURCE = 'alumni-form-2026-08'

/**
 * Form answer → `mentorship_areas.slug`.
 *
 * Keyed on the exact string the form wrote, including the parenthetical list
 * on the sector-specific option. An answer that is not in this map stops the
 * run rather than being dropped: a new option added to the form is a decision
 * for a person, not something an importer should silently discard.
 */
const AREA_SLUGS = new Map([
  ['Design & Creative', 'design-creative'],
  ['Business & Strategy', 'business-strategy'],
  ['Career & Personal Development', 'career-development'],
  ['Marketing & Growth', 'marketing-growth'],
  ['Product & Technology', 'product-technology'],
  ['Sales & Business Development', 'sales-bizdev'],
  ['HR & Culture', 'hr-culture'],
  ['Finance & Fundraising', 'finance-fundraising'],
  ['Operations & Supply Chain', 'operations-supply-chain'],
  [
    'Sector-specific (Fintech, Edtech, Healthtech, Agritech, D2C/Private Label, CleanTech, SaaS, Deep Tech)',
    'sector-specific',
  ],
])

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/* -------------------------------------------------------------------------- */
/* CSV                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Minimal RFC-4180 parser.
 *
 * Written out rather than pulled from a package because the multi-select
 * answers contain newlines *inside* quoted fields — the case that makes
 * splitting on line breaks produce 573 lines from 71 records — and because a
 * one-off import script should not add a dependency to the application.
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  // A UTF-8 BOM would otherwise become part of the first header's name.
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\r') {
      /* handled by the \n that follows */
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows
  return body
    .filter((cells) => cells.some((cell) => cell.trim() !== ''))
    .map((cells) => Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])))
}

/* -------------------------------------------------------------------------- */
/* Field normalisation                                                        */
/* -------------------------------------------------------------------------- */

const text = (value, max) => {
  const trimmed = (value ?? '').trim()
  if (trimmed === '') return null
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed
}

/** "Aug 7, 2026" → "2026-08-07 00:00:00". The date they accepted the consent. */
function consentAt(value) {
  const match = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/.exec((value ?? '').trim())
  if (!match) return null
  const month = MONTHS.indexOf(match[1])
  if (month < 0) return null
  return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[2].padStart(2, '0')} 00:00:00`
}

function graduationYear(value) {
  const year = Number.parseInt((value ?? '').trim(), 10)
  // Anything outside this range is a typo rather than a graduation year, and
  // is better left NULL than stored as fact.
  return Number.isInteger(year) && year >= 1990 && year <= 2035 ? year : null
}

/**
 * The form wrote every number in US format — "(973) 978-4384" — including for
 * the thirty-nine alumni living in Mumbai, so the punctuation carries no
 * meaning. The digits are kept and the decoration is dropped; adding a country
 * code would be inventing one.
 */
function phone(value) {
  const digits = (value ?? '').replace(/\D/g, '')
  return digits.length >= 7 ? digits : null
}

/**
 * The LinkedIn field was free text, and it shows: six people pasted a profile
 * without the scheme ("www.linkedin.com/in/...") and one typed their own name.
 * The first kind is repaired, the second is dropped — a `linkedin_url` column
 * holding "Priyanka Shewani" would render as a broken link on whatever staff
 * screen shows it, and a wrong value is worse than an absent one.
 */
function linkedin(value) {
  const trimmed = (value ?? '').trim()
  if (trimmed === '') return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 255)
  if (/^(www\.)?linkedin\.com\//i.test(trimmed)) return `https://${trimmed}`.slice(0, 255)
  return null
}

/** "Yes" / "Maybe" → the value stored in `mentoring_availability`. */
function availability(value) {
  const answer = (value ?? '').trim().toLowerCase()
  if (answer.startsWith('yes')) return 'yes'
  if (answer.startsWith('maybe')) return 'maybe'
  return null
}

/** "Tanvi Walanj" → "TW"; single-word names keep one letter. */
function initials(name) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]
  return letters.toUpperCase().slice(0, 4)
}

function areasOf(row) {
  return (row['Areas of mentorship interest'] ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/* -------------------------------------------------------------------------- */
/* Build                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * One record per person, newest submission winning every scalar field and the
 * areas unioned across all of them.
 *
 * The union is deliberate: the one duplicate in this file is a person who
 * submitted twice, four days apart, listing three areas the first time and two
 * the second. Taking only the newest row would quietly drop an area they told
 * us they can mentor in.
 */
function collate(rows) {
  const byEmail = new Map()

  for (const row of rows) {
    const email = (row['Email Address'] ?? '').trim().toLowerCase()
    if (!email) continue
    const existing = byEmail.get(email)
    if (existing) existing.push(row)
    else byEmail.set(email, [row])
  }

  const people = []
  for (const [email, submissions] of byEmail) {
    const ordered = [...submissions].sort(
      (a, b) => Date.parse(a['Submission Date']) - Date.parse(b['Submission Date'])
    )
    const newest = ordered[ordered.length - 1]

    const areas = new Set()
    for (const submission of ordered) for (const area of areasOf(submission)) areas.add(area)

    people.push({
      email,
      submissions: ordered.length,
      fullName: text(newest['Full Name'], 160),
      phone: phone(newest['WhatsApp Number']),
      linkedinUrl: linkedin(newest['LinkedIn Profile URL']),
      roleTitle: text(newest['Current Role & Company'], 160),
      city: text(newest['Current City'], 120),
      course: text(newest['Course'], 160),
      graduationYear: graduationYear(newest['Batch / Graduation Year']),
      industry: text(newest['Industry / Sector'], 96),
      experienceBand: text(newest['Years of Professional Experience'], 16),
      availability: availability(newest['Are you willing to mentor?']),
      consentAt: consentAt(newest['Submission Date']),
      areas: [...areas],
    })
  }

  return people.sort((a, b) => a.fullName.localeCompare(b.fullName))
}

/* -------------------------------------------------------------------------- */
/* Run                                                                        */
/* -------------------------------------------------------------------------- */

const rows = parseCsv(await readFile(CSV, 'utf8'))
const people = collate(rows)

const unknownAreas = new Set()
for (const person of people) {
  for (const area of person.areas) if (!AREA_SLUGS.has(area)) unknownAreas.add(area)
}

const nameless = people.filter((person) => !person.fullName)
const unwilling = people.filter((person) => person.availability === null)

console.log(`\nAlumni mentor import ${commit ? '(COMMIT)' : '(dry run — nothing will be written)'}`)
console.log(`  file                    ${CSV}`)
console.log(`  rows in file            ${rows.length}`)
console.log(`  unique people           ${people.length}`)
console.log(`  resubmissions merged    ${people.filter((p) => p.submissions > 1).length}`)
console.log(`  willing to mentor       ${people.filter((p) => p.availability === 'yes').length} yes, ${people.filter((p) => p.availability === 'maybe').length} maybe`)
console.log(`  area links              ${people.reduce((total, p) => total + p.areas.length, 0)}`)
console.log(`  with LinkedIn           ${people.filter((p) => p.linkedinUrl).length} (of ${people.filter((p) => (rows.find((r) => r['Email Address'].trim().toLowerCase() === p.email)?.['LinkedIn Profile URL'] ?? '').trim()).length} who answered)`)
console.log(`  with no areas           ${people.filter((p) => p.areas.length === 0).length}`)

if (unknownAreas.size > 0) {
  console.error(`\nFAILED: the form offered options this import does not know:`)
  for (const area of unknownAreas) console.error(`  - ${area}`)
  console.error(`Add them to mentorship_areas and to AREA_SLUGS, then re-run.\n`)
  process.exit(1)
}
if (nameless.length > 0) {
  console.error(`\nFAILED: ${nameless.length} record(s) have no name.\n`)
  process.exit(1)
}
if (unwilling.length > 0) {
  console.error(`\nFAILED: ${unwilling.length} record(s) have no answer to "willing to mentor".\n`)
  process.exit(1)
}

if (!commit) {
  console.log('\n  first five, as they would be stored:')
  for (const person of people.slice(0, 5)) {
    console.log(
      `    ${person.fullName} (${initials(person.fullName)}) · ${person.roleTitle ?? '—'} · ` +
        `${person.graduationYear ?? '—'} · ${person.availability} · areas: ${person.areas.length}`
    )
  }
  console.log('\nRe-run with --commit to write.\n')
  process.exit(0)
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})

try {
  const [[alumniType]] = await connection.query(
    `SELECT id FROM mentor_types WHERE slug = 'alumni'`
  )
  if (!alumniType) throw new Error("mentor_types has no 'alumni' row — run db:reference first.")

  const [areaRows] = await connection.query(`SELECT id, slug FROM mentorship_areas`)
  const areaIdBySlug = new Map(areaRows.map((row) => [row.slug, row.id]))
  for (const slug of AREA_SLUGS.values()) {
    if (!areaIdBySlug.has(slug)) {
      throw new Error(`mentorship_areas is missing '${slug}' — apply migration 005 first.`)
    }
  }

  await connection.beginTransaction()

  let inserted = 0
  let updated = 0
  let links = 0

  for (const person of people) {
    // Looked up before the write rather than inferred from the driver's
    // response afterwards. Neither `affectedRows` nor `insertId` distinguishes
    // an insert from an update reliably here: this MariaDB reports
    // affectedRows = 1 for both a fresh insert and an unchanged duplicate-key
    // match, and sets insertId whenever the upsert actually modifies a row.
    // Asking first is one query and is exact.
    const [[before]] = await connection.query(`SELECT id FROM mentors WHERE email = ?`, [
      person.email,
    ])

    // Keyed on uq_mentors_email. `is_active` and `is_primary` are deliberately
    // absent from the UPDATE clause: if staff have since deactivated someone,
    // re-running the import must not quietly bring them back.
    const [result] = await connection.execute(
      `INSERT INTO mentors
         (full_name, email, phone, linkedin_url, role_title, city, course,
          graduation_year, industry, experience_band, mentoring_availability,
          import_source, consent_at, mentor_type_id, initials, avatar_tone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'primary')
       ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name),
         phone = VALUES(phone),
         linkedin_url = VALUES(linkedin_url),
         role_title = VALUES(role_title),
         city = VALUES(city),
         course = VALUES(course),
         graduation_year = VALUES(graduation_year),
         industry = VALUES(industry),
         experience_band = VALUES(experience_band),
         mentoring_availability = VALUES(mentoring_availability),
         import_source = VALUES(import_source),
         consent_at = VALUES(consent_at),
         initials = VALUES(initials)`,
      [
        person.fullName,
        person.email,
        person.phone,
        person.linkedinUrl,
        person.roleTitle,
        person.city,
        person.course,
        person.graduationYear,
        person.industry,
        person.experienceBand,
        person.availability,
        IMPORT_SOURCE,
        person.consentAt,
        alumniType.id,
        initials(person.fullName),
      ]
    )

    if (before) updated += 1
    else inserted += 1

    const mentorId = before?.id ?? result.insertId

    // Rewritten rather than appended to, so an area removed from a later
    // submission is also removed here.
    await connection.execute(`DELETE FROM mentor_mentorship_areas WHERE mentor_id = ?`, [mentorId])
    for (const area of person.areas) {
      await connection.execute(
        `INSERT INTO mentor_mentorship_areas (mentor_id, area_id) VALUES (?, ?)`,
        [mentorId, areaIdBySlug.get(AREA_SLUGS.get(area))]
      )
      links += 1
    }
  }

  await connection.commit()

  const [[totals]] = await connection.query(`
    SELECT (SELECT COUNT(*) FROM mentors WHERE deleted_at IS NULL)                    AS mentors,
           (SELECT COUNT(*) FROM mentors WHERE import_source = '${IMPORT_SOURCE}')    AS imported,
           (SELECT COUNT(*) FROM mentor_mentorship_areas)                             AS links
  `)

  console.log(`\n  inserted                ${inserted}`)
  console.log(`  updated                 ${updated}`)
  console.log(`  area links written      ${links}`)
  console.log(`\n  mentors table now       ${totals.mentors} (${totals.imported} from this import)`)
  console.log(`  area links now          ${totals.links}`)
  console.log(`\nDone. To undo: DELETE FROM mentors WHERE import_source = '${IMPORT_SOURCE}';\n`)
} catch (error) {
  await connection.rollback().catch(() => {})
  console.error(`\nFAILED — nothing was written: ${error.message}\n`)
  await connection.end()
  process.exit(1)
}

await connection.end()
