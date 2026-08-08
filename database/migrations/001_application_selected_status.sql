-- ===========================================================================
-- 001 · Add the `selected` terminal state to applications
--
--   npm run db:migrate 001_application_selected_status.sql
--
-- The hiring pipeline is Applied → Under Review → Shortlisted → Interview →
-- Selected / Not Selected. The original enum could record every step except
-- the one that matters most: that the student got the role.
--
-- `selected` is APPENDED rather than inserted before `not_selected`, even
-- though that would read better. MySQL stores ENUM values by ordinal, and
-- reordering an enum on a populated table risks remapping existing rows to the
-- wrong label. Nothing sorts by this column, so the storage order is free to be
-- ugly and safe rather than tidy and risky.
--
-- Idempotent: re-running is a no-op because the target definition already
-- matches. Safe on a populated table — no existing value changes.
-- ===========================================================================

-- `application_events.from_status` / `to_status` are deliberately VARCHAR(32),
-- not enums: an append-only history must be able to record a status that has
-- since been removed from the pipeline. They need no change here.

ALTER TABLE applications
  MODIFY COLUMN status
    ENUM('applied','under_review','shortlisted','interview','not_selected','withdrawn','selected')
    NOT NULL DEFAULT 'applied';
