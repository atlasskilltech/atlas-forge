import 'server-only'

const LISTING_FIELDS = `
  l.id, l.type, l.title, l.description, l.compensation, l.collaborator_need,
  l.status, l.posted_at, l.created_at,
  lt.name AS listing_type_name, lt.slug AS listing_type_slug,
  ct.name AS contract_type_name, ct.slug AS contract_type_slug,
  s.id AS startup_id, s.name AS startup_name, s.slug AS startup_slug,
  s.initial AS startup_initial, s.avatar_tone AS startup_tone,
  c.id AS created_by_id, c.full_name AS created_by_name, c.initials AS created_by_initials
`

const LISTING_JOINS = `
    FROM listings l
    LEFT JOIN listing_types lt  ON lt.id = l.listing_type_id
    LEFT JOIN contract_types ct ON ct.id = l.contract_type_id
    LEFT JOIN startups s        ON s.id = l.startup_id
    JOIN users c                ON c.id = l.created_by
`

/**
 * Filters are all optional and bound as `NULL`-guarded pairs, so one statement
 * serves Browse Jobs, My Listings, All Listings and both approval queues.
 */
export const SELECT_LISTINGS = `
  SELECT ${LISTING_FIELDS}
  ${LISTING_JOINS}
   WHERE l.deleted_at IS NULL
     AND (? IS NULL OR l.status = ?)
     AND (? IS NULL OR l.type = ?)
     AND (? IS NULL OR l.startup_id = ?)
     AND (? IS NULL OR l.created_by = ?)
     AND (? IS NULL OR lt.slug = ?)
   ORDER BY l.posted_at DESC, l.id DESC
`

export const SELECT_LISTING_BY_ID = `
  SELECT ${LISTING_FIELDS}
  ${LISTING_JOINS}
   WHERE l.id = ? AND l.deleted_at IS NULL
`

export function selectSkillsForListings(placeholders) {
  return `
    SELECT ls.listing_id, s.id, s.slug, s.name, s.category
      FROM listing_skills ls
      JOIN skills s ON s.id = ls.skill_id
     WHERE ls.listing_id IN ${placeholders}
     ORDER BY s.name
  `
}

/** The queue: pending listings plus whatever each role has already decided. */
export const SELECT_APPROVAL_QUEUE = `
  SELECT ${LISTING_FIELDS},
         fm.decision AS fm_decision, fm.decided_at AS fm_decided_at,
         bm.decision AS bm_decision, bm.decided_at AS bm_decided_at
  ${LISTING_JOINS}
    LEFT JOIN approvals fm ON fm.listing_id = l.id
          AND fm.decided_as_role_id = (SELECT id FROM roles WHERE slug = 'forge-manager')
    LEFT JOIN approvals bm ON bm.listing_id = l.id
          AND bm.decided_as_role_id = (SELECT id FROM roles WHERE slug = 'backend-manager')
   WHERE l.deleted_at IS NULL
     AND (? IS NULL OR l.type = ?)
   ORDER BY FIELD(l.status, 'pending', 'live', 'rejected', 'closed'), l.posted_at DESC
`

export const INSERT_LISTING = `
  INSERT INTO listings
    (type, title, description, startup_id, created_by, listing_type_id,
     contract_type_id, compensation, collaborator_need, status, posted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
`

export const INSERT_LISTING_SKILL = `
  INSERT IGNORE INTO listing_skills (listing_id, skill_id) VALUES (?, ?)
`

export const UPDATE_LISTING_STATUS = `
  UPDATE listings SET status = ? WHERE id = ? AND deleted_at IS NULL
`

/** One role's existing decision on a listing, used to detect an override. */
export const SELECT_DECISION = `
  SELECT a.decision, a.decided_at, a.is_override
    FROM approvals a
    JOIN roles r ON r.id = a.decided_as_role_id
   WHERE a.listing_id = ? AND r.slug = ?
`

export const UPSERT_APPROVAL = `
  INSERT INTO approvals (listing_id, decided_as_role_id, decision, decided_by, reason, is_override)
  VALUES (?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    decision = VALUES(decision), decided_by = VALUES(decided_by),
    reason = VALUES(reason), is_override = VALUES(is_override), decided_at = NOW()
`

export const COUNT_LISTINGS_BY_STATUS = `
  SELECT status, COUNT(*) AS total
    FROM listings
   WHERE deleted_at IS NULL
   GROUP BY status
`
