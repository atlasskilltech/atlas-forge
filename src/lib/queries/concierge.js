import 'server-only'

const CONTACT_FIELDS = `
  c.id, c.context, c.duration_label, c.message, c.status, c.contacted_at,
  f.id AS founder_id, f.full_name AS founder_name, f.initials AS founder_initials,
  st.id AS student_id, st.full_name AS student_name, st.initials AS student_initials,
  st.avatar_tone AS student_tone, st.app_id AS student_app_id,
  cc.full_name AS cc_name,
  s.name AS startup_name, s.slug AS startup_slug
`

const CONTACT_JOINS = `
    FROM concierge_contacts c
    JOIN users f  ON f.id = c.founder_user_id
    JOIN users st ON st.id = c.student_user_id
    LEFT JOIN users cc   ON cc.id = c.cc_user_id
    LEFT JOIN startups s ON s.id = c.startup_id
`

export const SELECT_CONTACTS = `
  SELECT ${CONTACT_FIELDS}
  ${CONTACT_JOINS}
   WHERE c.deleted_at IS NULL
     AND (? IS NULL OR c.founder_user_id = ?)
     AND (? IS NULL OR c.student_user_id = ?)
     AND (? IS NULL OR c.status = ?)
   ORDER BY c.contacted_at DESC
`

export const INSERT_CONTACT = `
  INSERT INTO concierge_contacts
    (founder_user_id, student_user_id, startup_id, context, duration_label, message, cc_user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`

export const UPDATE_CONTACT_STATUS = `
  UPDATE concierge_contacts SET status = ? WHERE id = ? AND deleted_at IS NULL
`

export const COUNT_CONTACT_STATS = `
  SELECT
    COUNT(*)                                                       AS total,
    SUM(contacted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY))           AS this_week,
    SUM(status = 'ongoing')                                        AS ongoing,
    SUM(status = 'done')                                           AS completed
  FROM concierge_contacts
  WHERE deleted_at IS NULL
    AND (? IS NULL OR founder_user_id = ?)
`

export const SELECT_POSTED_NEEDS = `
  SELECT n.id, n.title, n.description, n.status, n.posted_at,
         u.full_name AS founder_name,
         s.name AS startup_name, s.slug AS startup_slug
    FROM posted_needs n
    JOIN users u ON u.id = n.founder_user_id
    LEFT JOIN startups s ON s.id = n.startup_id
   WHERE n.deleted_at IS NULL
     AND (? IS NULL OR n.founder_user_id = ?)
   ORDER BY n.posted_at DESC
`

export const INSERT_POSTED_NEED = `
  INSERT INTO posted_needs (founder_user_id, startup_id, title, description)
  VALUES (?, ?, ?, ?)
`
