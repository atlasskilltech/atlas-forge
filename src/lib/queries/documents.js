import 'server-only'

/**
 * Compliance & Documents SQL.
 *
 * The checklist is a LEFT JOIN from the category list to the startup's current
 * documents, not an inner join from what was uploaded: a category with nothing
 * in it still has to render a row, and the empty rows are the point of a
 * checklist.
 */

const DOCUMENT_FIELDS = `
  d.id, d.startup_id, d.category_id, d.stored_name, d.original_name,
  d.mime_type, d.byte_size, d.checksum, d.is_current, d.replaced_at, d.created_at,
  u.full_name AS uploaded_by_name
`

/**
 * The fourteen categories with whichever document is current for one startup.
 *
 * `is_current = TRUE AND deleted_at IS NULL` sits in the JOIN condition rather
 * than the WHERE clause on purpose: in a WHERE clause it would turn the outer
 * join back into an inner one and the empty categories would vanish.
 */
export const SELECT_STARTUP_CHECKLIST = `
  SELECT c.id AS category_id, c.slug AS category_slug, c.name AS category_name,
         c.description AS category_description, c.tier, c.accepted_types, c.sort_order,
         ${DOCUMENT_FIELDS}
    FROM document_categories c
    LEFT JOIN startup_documents d
      ON d.category_id = c.id AND d.startup_id = ?
     AND d.is_current = TRUE AND d.deleted_at IS NULL
    LEFT JOIN users u ON u.id = d.uploaded_by
   WHERE c.is_active = TRUE
   ORDER BY c.sort_order
`

/** Every current document for one startup — what "Download all" packs. */
export const SELECT_CURRENT_DOCUMENTS = `
  SELECT ${DOCUMENT_FIELDS}, c.slug AS category_slug, c.name AS category_name, c.sort_order
    FROM startup_documents d
    JOIN document_categories c ON c.id = d.category_id
    LEFT JOIN users u ON u.id = d.uploaded_by
   WHERE d.startup_id = ? AND d.is_current = TRUE AND d.deleted_at IS NULL
   ORDER BY c.sort_order
`

/**
 * One document by id, with the startup it belongs to.
 *
 * The startup id comes back so the download route can authorise against the
 * row itself rather than against anything the caller sent.
 */
export const SELECT_DOCUMENT_BY_ID = `
  SELECT ${DOCUMENT_FIELDS}, c.slug AS category_slug, c.name AS category_name,
         s.slug AS startup_slug, s.name AS startup_name, s.owner_user_id
    FROM startup_documents d
    JOIN document_categories c ON c.id = d.category_id
    JOIN startups s           ON s.id = d.startup_id
    LEFT JOIN users u         ON u.id = d.uploaded_by
   WHERE d.id = ? AND d.deleted_at IS NULL
`

/** Version history for one slot, newest first. Powers the audit trail. */
export const SELECT_DOCUMENT_HISTORY = `
  SELECT ${DOCUMENT_FIELDS}
    FROM startup_documents d
    LEFT JOIN users u ON u.id = d.uploaded_by
   WHERE d.startup_id = ? AND d.category_id = ? AND d.deleted_at IS NULL
   ORDER BY d.created_at DESC
`

export const INSERT_DOCUMENT = `
  INSERT INTO startup_documents
    (startup_id, category_id, stored_name, original_name, mime_type,
     byte_size, checksum, uploaded_by, is_current)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
`

/**
 * Steps the current document in a slot aside. Runs immediately before the
 * insert, inside the same transaction — that pairing is what keeps one
 * document current per slot, since MySQL cannot express a unique index over
 * "current rows only".
 */
export const SUPERSEDE_CURRENT_DOCUMENT = `
  UPDATE startup_documents
     SET is_current = FALSE, replaced_at = CURRENT_TIMESTAMP
   WHERE startup_id = ? AND category_id = ? AND is_current = TRUE AND deleted_at IS NULL
`

/** How complete each startup's vault is — the staff overview. */
export const SELECT_COMPLIANCE_SUMMARY = `
  SELECT s.id, s.slug, s.name, s.initial, s.avatar_tone, s.logo_url, s.status,
         (SELECT COUNT(*) FROM startup_documents d
           WHERE d.startup_id = s.id AND d.is_current = TRUE AND d.deleted_at IS NULL)
           AS uploaded_total,
         (SELECT COUNT(*) FROM startup_documents d
            JOIN document_categories c ON c.id = d.category_id
           WHERE d.startup_id = s.id AND d.is_current = TRUE AND d.deleted_at IS NULL
             AND c.tier = 'core')
           AS uploaded_core,
         (SELECT MAX(d.created_at) FROM startup_documents d
           WHERE d.startup_id = s.id AND d.deleted_at IS NULL)
           AS last_upload_at
    FROM startups s
   WHERE s.deleted_at IS NULL
   ORDER BY s.name
`
