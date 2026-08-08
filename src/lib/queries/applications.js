import 'server-only'

const APPLICATION_FIELDS = `
  a.id, a.status, a.cover_note, a.applied_at, a.updated_at,
  l.id AS listing_id, l.title AS listing_title, l.type AS listing_type,
  lt.name AS listing_type_name,
  s.id AS startup_id, s.name AS startup_name, s.initial AS startup_initial,
  s.avatar_tone AS startup_tone,
  u.id AS applicant_id, u.full_name AS applicant_name, u.initials AS applicant_initials,
  u.avatar_tone AS applicant_tone, u.app_id AS applicant_app_id
`

const APPLICATION_JOINS = `
    FROM applications a
    JOIN listings l ON l.id = a.listing_id
    JOIN users u    ON u.id = a.applicant_user_id
    LEFT JOIN listing_types lt ON lt.id = l.listing_type_id
    LEFT JOIN startups s       ON s.id = l.startup_id
`

export const SELECT_APPLICATIONS = `
  SELECT ${APPLICATION_FIELDS}
  ${APPLICATION_JOINS}
   WHERE a.deleted_at IS NULL
     AND (? IS NULL OR a.applicant_user_id = ?)
     AND (? IS NULL OR a.listing_id = ?)
     AND (? IS NULL OR l.startup_id = ?)
     AND (? IS NULL OR a.status = ?)
   ORDER BY a.applied_at DESC
`

export const SELECT_APPLICATION_BY_ID = `
  SELECT ${APPLICATION_FIELDS}
  ${APPLICATION_JOINS}
   WHERE a.id = ? AND a.deleted_at IS NULL
`

export const SELECT_APPLICATION_EVENTS = `
  SELECT e.id, e.from_status, e.to_status, e.note, e.created_at,
         u.full_name AS changed_by_name
    FROM application_events e
    LEFT JOIN users u ON u.id = e.changed_by
   WHERE e.application_id = ?
   ORDER BY e.created_at, e.id
`

export const SELECT_APPLICANTS_FOR_LISTING = `
  SELECT a.id, a.status, a.applied_at,
         u.id AS user_id, u.full_name, u.initials, u.avatar_tone, u.app_id,
         sp.programme, sp.year_of_study
    FROM applications a
    JOIN users u ON u.id = a.applicant_user_id
    LEFT JOIN student_profiles sp ON sp.user_id = u.id
   WHERE a.listing_id = ? AND a.deleted_at IS NULL AND u.deleted_at IS NULL
   ORDER BY a.applied_at
`

export const INSERT_APPLICATION = `
  INSERT INTO applications (listing_id, applicant_user_id, status, cover_note)
  VALUES (?, ?, 'applied', ?)
`

export const UPDATE_APPLICATION_STATUS = `
  UPDATE applications SET status = ? WHERE id = ? AND deleted_at IS NULL
`

export const INSERT_APPLICATION_EVENT = `
  INSERT INTO application_events (application_id, from_status, to_status, changed_by, note)
  VALUES (?, ?, ?, ?, ?)
`

export const COUNT_APPLICATIONS_FOR_USER = `
  SELECT COUNT(*) AS total
    FROM applications
   WHERE applicant_user_id = ? AND deleted_at IS NULL
     AND status NOT IN ('withdrawn', 'not_selected')
`
