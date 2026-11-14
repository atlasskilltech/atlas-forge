-- ATLAS Forge user & role report. READ-ONLY: SELECT statements only.
-- Run against the production DB (tables use the forge_ prefix).

-- 1. Total users (live = not soft-deleted)
SELECT COUNT(*) AS total_users,
       SUM(deleted_at IS NULL) AS live_users,
       SUM(deleted_at IS NULL AND status = 'active') AS active_users
  FROM forge_users;

-- 2. Users per role (live users, unrevoked grants)
SELECT r.slug AS role, COUNT(DISTINCT ur.user_id) AS users
  FROM forge_roles r
  LEFT JOIN forge_user_roles ur ON ur.role_id = r.id AND ur.revoked_at IS NULL
  LEFT JOIN forge_users u ON u.id = ur.user_id AND u.deleted_at IS NULL
 WHERE u.id IS NOT NULL OR ur.user_id IS NULL
 GROUP BY r.slug, r.sort_order
 ORDER BY r.sort_order;

-- 2b. Role combinations (shows staff who ALSO hold network-member)
SELECT combo, COUNT(*) AS users FROM (
  SELECT u.id, COALESCE(GROUP_CONCAT(r.slug ORDER BY r.sort_order SEPARATOR '+'), '(none)') AS combo
    FROM forge_users u
    LEFT JOIN forge_user_roles ur ON ur.user_id = u.id AND ur.revoked_at IS NULL
    LEFT JOIN forge_roles r ON r.id = ur.role_id
   WHERE u.deleted_at IS NULL
   GROUP BY u.id) t
 GROUP BY combo ORDER BY users DESC;

-- 3. Google vs password. Before migration 014 there is no stored provider:
--    the only signal is the App ID series (AFM- = approved public registration).
SELECT CASE WHEN app_id LIKE 'AFM-%' THEN 'registration (AFM)' ELSE 'portal (ATL/other)' END AS origin,
       COUNT(*) AS users
  FROM forge_users WHERE deleted_at IS NULL GROUP BY origin;
-- After migration 014 (only counts Google logins made after it was applied):
-- SELECT SUM(google_sub IS NOT NULL) AS signed_in_with_google,
--        SUM(google_sub IS NULL)     AS never_used_google
--   FROM forge_users WHERE deleted_at IS NULL;

-- 4a. Duplicate emails (case/space-insensitive)
SELECT LOWER(TRIM(email)) AS email_normalised, COUNT(*) AS accounts,
       GROUP_CONCAT(app_id ORDER BY id) AS app_ids
  FROM forge_users GROUP BY email_normalised HAVING COUNT(*) > 1;

-- 4b. Live users with NO active role
SELECT u.app_id, u.status, u.created_at
  FROM forge_users u
 WHERE u.deleted_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM forge_user_roles ur JOIN forge_roles r ON r.id = ur.role_id
                    WHERE ur.user_id = u.id AND ur.revoked_at IS NULL AND r.is_active = TRUE);

-- 4c. Likely split identities: a member-only account whose NAME matches a
--     portal account under a DIFFERENT email (the person who lands on /member/home).
SELECT m.app_id AS member_app_id, p.app_id AS portal_app_id, m.full_name,
       SUBSTRING_INDEX(m.email, '@', -1) AS member_domain,
       SUBSTRING_INDEX(p.email, '@', -1) AS portal_domain
  FROM forge_users m
  JOIN forge_users p ON LOWER(TRIM(p.full_name)) = LOWER(TRIM(m.full_name)) AND p.id <> m.id
 WHERE m.deleted_at IS NULL AND p.deleted_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM forge_user_roles ur JOIN forge_roles r ON r.id = ur.role_id
                    WHERE ur.user_id = m.id AND ur.revoked_at IS NULL AND r.slug <> 'network-member')
   AND EXISTS (SELECT 1 FROM forge_user_roles ur JOIN forge_roles r ON r.id = ur.role_id
                WHERE ur.user_id = p.id AND ur.revoked_at IS NULL AND r.slug <> 'network-member');
