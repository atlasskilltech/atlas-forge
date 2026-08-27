-- ===========================================================================
-- 005b · Alumni mentor data — 70 mentors and 196 mentorship-area links
--
--   phpMyAdmin → select the database → Import → this file → charset utf8mb4
--
-- Data, not schema. REQUIRES migrations/005_alumni_mentors.sql to have been
-- applied first: without it the very first INSERT fails on an unknown column
-- and nothing is written.
--
-- Generated from reference/Atlas_Forge_Alumni_Mentorship_2026-08-14_06_14_32.csv
-- (71 form submissions from 70 people — one person submitted twice, and
-- their two answers are merged here: the later submission wins every field and
-- their mentorship areas are the union of both).
--
-- Safe to run more than once. Mentors are keyed on `uq_mentors_email`, so a
-- second run updates the same rows rather than adding a second copy of anyone,
-- and the area links are deleted and rewritten rather than accumulated.
--
-- Nothing existing is touched: every row here is a new email address, and no
-- statement updates a mentor that this import did not create. `is_active`,
-- `is_primary` and `mentor_type_id` are deliberately absent from every UPDATE
-- clause — if staff deactivate or re-type one of these people later, re-running
-- this file must not quietly undo that.
--
-- Ids are never hardcoded: the mentor type is resolved by slug and the area
-- links are joined on email and slug, so the auto-increment values in your
-- database need not match the ones anywhere else.
--
-- WRAPPED IN A TRANSACTION. If any statement fails, phpMyAdmin stops and the
-- work so far is rolled back rather than left half-applied.
--
-- To undo everything this file did:
--   DELETE FROM mentors WHERE import_source = 'alumni-form-2026-08';
--   (the area links follow via ON DELETE CASCADE)
-- ===========================================================================

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1. Area links from any previous run of this file
--
-- Scoped to rows this import owns. A mentor entered by hand keeps their areas.
-- ---------------------------------------------------------------------------
DELETE mma
  FROM mentor_mentorship_areas mma
  JOIN mentors m ON m.id = mma.mentor_id
 WHERE m.import_source = 'alumni-form-2026-08';

-- ---------------------------------------------------------------------------
-- 2. The 70 alumni mentors
--
-- `mentor_type_id` is looked up from `mentor_types` by slug. If that subquery
-- returns NULL the INSERT fails on the NOT NULL column rather than storing a
-- mentor with no type — check `SELECT id FROM mentor_types WHERE slug='alumni'`
-- returns a row before running this.
-- ---------------------------------------------------------------------------

-- 1. Aakanksha Mistry
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aakanksha Mistry', 'aakanksha.mistry98@gmail.com', '9769977228', NULL,
   'Proprietor at Perspective Inc', 'Mumbai', 'Interior design',
   2020, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-27 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 2. Aamena K
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aamena K', 'aamenakotwala03@gmail.com', '8828819292', 'https://www.linkedin.com/in/aamena-kotwala-0ab0ab253?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Marketing Executive', 'Mumbai', 'Fashion design',
   2025, 'Other', '0-2 years', 'maybe',
   'alumni-form-2026-08', '2026-08-01 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 3. Aashi Lath
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aashi Lath', 'aashilath123@gmail.com', '8976337727', NULL,
   'UX designer in TATA AIA Life Insurance', 'Mumbai', 'Communication design',
   2020, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AL', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 4. Aashka Dave
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aashka Dave', 'aashkadave1309@gmail.com', '9867372027', NULL,
   'Associate Designer, The Circle India', 'Mumbai', 'B.Des in Communication Design',
   2025, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AD', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 5. Adeeti Shukla
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Adeeti Shukla', 'adeetishukla08@gmail.com', '9284038480', 'https://www.linkedin.com/in/adeeti-s-250098203?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'UI UX Specialist at LTM', 'Mumbai', 'Communication Design',
   2025, 'Technology', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 6. Aditi Jaisinghani
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aditi Jaisinghani', 'aditi.jaisgh@gmail.com', '8819037000', NULL,
   'Founder', 'Indore', 'Fashion Communication & Styling',
   2020, 'Manufacturing', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AJ', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 7. Aditya Pai
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aditya Pai', 'aditya@drinkmisfits.com', '9930455530', 'https://in.linkedin.com/in/aditya-pai-5a69661b3',
   'Founder at Misfits', 'Mumbai', 'Product design',
   2022, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-03 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AP', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 8. Aishwarya Mukim
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aishwarya Mukim', 'aishwaryamukim@gmail.com', '9594000051', 'https://www.linkedin.com/in/aishwarya-mukim',
   'Pursuing as pastry chef', 'Mumbai', 'Fashion design',
   2023, 'Other', NULL, 'yes',
   'alumni-form-2026-08', '2026-07-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 9. Akruti Bagla
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Akruti Bagla', 'baglaakruti1@gmail.com', '8879543074', 'https://www.linkedin.com/in/designerakrutibagla/?skipRedirect=true',
   'Lead UX Designer at Lemon Yellow', 'Mumbai', 'Communication Design',
   2020, 'Technology', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AB', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 10. Amrutha Mahesh
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Amrutha Mahesh', 'amrutha.m1999@gmail.com', '9819309555', 'https://www.linkedin.com/in/amrutha-mahesh-b236821b7?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Founder, Gutsee', 'Mumbai', 'Fashion communication & styling',
   2021, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 11. Anantika Sethi
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Anantika Sethi', 'anantika1603@gmail.com', '4255436132', 'https://www.linkedin.com/in/anantikasethi?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'UX designer at Google', 'San Francisco', 'Communication design',
   2021, 'Technology', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 12. Anik Jain
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Anik Jain', 'anikjaindesign@gmail.com', '7506150141', 'https://www.linkedin.com/in/anikjaindesign?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Founder & Creative Director of DZINR', 'Mumbai', 'Visual communication design',
   2024, 'Consulting', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-02 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AJ', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 13. Anjali Kothari
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Anjali Kothari', 'anjalikothari2012@gmail.com', '9610316939', 'https://www.linkedin.com/in/anjali-mukesh-kothari-a15681192?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Self Employed and teaching students and employees art of Public Speaking', 'Mumbai', 'Fashion Communication and Styling',
   2020, 'Education', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 14. Anjali Maheshwari
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Anjali Maheshwari', 'anjali.m.work@gmail.com', '8003522228', 'https://www.linkedin.com/in/anjali-maheshwari-789b241ab?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Communication Design Freelancer', 'Jaipur', 'Communication Design',
   2023, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-11 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 15. Anushka Kadam
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Anushka Kadam', 'kadamanu02@gmail.com', '9766714386', NULL,
   'Founder of vanilla studio', 'Pune', 'Fashion Design',
   2025, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 16. Anvaya Namjoshi
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Anvaya Namjoshi', 'anvaya.namjoshi22@gmail.com', '9029934440', 'https://www.linkedin.com/in/anvayanamjoshi/',
   'Senior Manager- The Minimalist', 'Mumbai', 'Fashion Communication & Styling',
   2023, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-07-05 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AN', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 17. Aparna A
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Aparna A', 'aparn0216@gmail.com', '9594726511', 'https://www.linkedin.com/in/aparna-agarwal/',
   'Amazon, Human Rights & Sustainability', '`Mumbai', 'FCS',
   2021, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-08-05 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AA', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 18. Ayush Apte
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Ayush Apte', 'ayushapte1312@gmail.com', '9607937150', 'https://www.linkedin.com/in/ayushapte',
   'User experience designer @ playground strategy & Design', 'Pune', 'Product design',
   2025, 'Consulting', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AA', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 19. Ayush Vijoy
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Ayush Vijoy', 'ayushzzz1224@gmail.com', '0849087200', 'https://www.linkedin.com/in/ayush-vijoy/',
   'Product Designer at NxtQube', 'Nashik', 'Product Design',
   2025, 'Technology', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'AV', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 20. Crystal Princw
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Crystal Princw', 'crystalprincedesign@gmail.com', '9820886066', 'https://www.linkedin.com/in/crystalprince?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'UX Designer at LTIMindtree (worked for 2 years)', 'Sydney', 'Master of Interaction Design (2026-2028) from University Of Technology Sydney',
   2024, 'Consulting', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-07-05 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'CP', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 21. Delaina Fernandes
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Delaina Fernandes', 'delaina2000@gmail.com', '3458460820', 'https://www.linkedin.com/in/delaina-fernandes/',
   'Industrial Designer at Antonio Lanzillo Design studio', 'Milan,Italy', 'Product Design',
   2022, 'Other', '3-5 years', 'maybe',
   'alumni-form-2026-08', '2026-07-04 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'DF', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 22. Disha Shah
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Disha Shah', 'dishashah66@gmail.com', '8777641231', NULL,
   'Freelancer, Vanya Studio', 'Kolkata', 'Strategic Design and Management',
   2021, 'Consulting', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-07-01 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'DS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 23. Drashti Shah
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Drashti Shah', 'drashtishah342@gmail.com', '9820595438', 'https://www.linkedin.com/in/drashti-shah-306252164?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'reD Architects - Junior Interior Designer', 'Mumbai', 'Interior Design',
   2021, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-08 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'DS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 24. Harshavi Jain
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Harshavi Jain', 'harshavi1321@gmail.com', '9967103645', 'https://www.linkedin.com/in/harshavi-jain-736b5a146',
   'Founder at Lesscare', 'mumbai', 'Fashion communication',
   2022, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'HJ', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 25. Hemani Bhalotia
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Hemani Bhalotia', 'bhalotiahemani@gmail.com', '9830922086', 'https://www.linkedin.com/in/hemani-bhalotia-ab1299158/',
   'Founder, Enclothe', 'Kolkata', 'FD',
   2021, 'Manufacturing', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'HB', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 26. Hetvi Bhavin Shah
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Hetvi Bhavin Shah', 'hetvishah1398@gmail.com', '8898500985', NULL,
   'Principal Designer | Forms And Spaces', 'Mumbai', 'Interior Design',
   2020, 'Consulting', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'HS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 27. Jainam Chheda
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Jainam Chheda', 'jainamchheda8@gmail.com', '9920570581', NULL,
   'Business Development', 'Mumbai', 'Interior Designing',
   2022, 'Other', '3-5 years', 'maybe',
   'alumni-form-2026-08', '2026-06-27 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'JC', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 28. Kasvi Shangari
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Kasvi Shangari', 'kasvishangari13@gmail.com', '9878886000', NULL,
   'Head of department, Spice PR', 'Mumbai', 'Fashion communication & styling',
   2021, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-30 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 29. Keisha Bajaj
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Keisha Bajaj', 'keishabajaj.kb@gmail.com', '9619543467', 'https://in.linkedin.com/in/keisha-bajaj-6142861a3',
   'Proprietor', 'Mumbai', 'Fashion Communication & Styling',
   2023, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-17 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KB', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 30. Khushi Karve
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Khushi Karve', 'khushi.t.karve@gmail.com', '8693093028', 'https://www.linkedin.com/in/khushi-karve',
   'brand planner at chlorophyll', 'Mumbai', 'SDM',
   2024, 'Consulting', '0-2 years', 'maybe',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 31. Khushi Khurana
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Khushi Khurana', 'khushikaur41099@gmail.com', '9022997458', 'https://www.linkedin.com/in/khushi-khurana-6b38611a6?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Merchandising/manufacturing', 'mumbai', 'Fashion design',
   2023, 'Other', '0-2 years', 'maybe',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 32. Khushi Mittal
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Khushi Mittal', 'khushikmittal@gmail.com', '6284442705', NULL,
   'Family business', 'Ludhiana', 'Strategic Design Management',
   2025, 'Manufacturing', '0-2 years', 'maybe',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 33. khushi shah
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('khushi shah', 'shahkhushi2001@gmail.com', '9833344610', NULL,
   'Founder @ Step by PS', 'Mumbai', 'SDM',
   2023, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 34. Khushi Walani
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Khushi Walani', 'khushi.walani@gmail.com', '7379521383', NULL,
   'Communication Designer at APRE Art House', 'Mumbai', 'B.Des (Communication Design)',
   2025, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-07-02 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'KW', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 35. Megha Dagliya
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Megha Dagliya', 'meghadagliya67@gmail.com', '8094649211', NULL,
   'Self employed at M/S Dagliya Brothers', 'Nathdwara', 'Fashion Designing',
   2021, 'Manufacturing', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'MD', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 36. Mihir Mehta
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Mihir Mehta', 'mihir.mehta03@gmail.com', '8668346037', NULL,
   'UI UX Designer Deloitte USI', 'Pune', 'Product Design',
   2025, 'Consulting', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-30 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'MM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 37. Mihir pawar
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Mihir pawar', 'mihir57pawar@gmail.com', '9619590937', NULL,
   'atlas Test', 'Mumbai', 'BDes',
   2024, 'Technology', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-24 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'MP', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 38. Mukul Gehaney
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Mukul Gehaney', 'mukulgehaney@gmail.com', '8976645025', NULL,
   'Product manager - ArtisanCraft', 'Mumbai', 'Product design',
   2021, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'MG', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 39. Nancy Deepak Bhai Amin
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Nancy Deepak Bhai Amin', 'amin.nancy16@gmail.com', '7044646216', 'https://linkedin.com/in/nancy-amin-907315173',
   'CEO', 'Kolkata', 'Fashion Communication and Styling',
   2022, 'Manufacturing', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-06 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'NA', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 40. Nidhi Santwani
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Nidhi Santwani', 'nidhi.santwani@gmail.com', '9687100674', 'https://www.linkedin.com/in/nidhi-santwani-a2281920a/',
   'Joined as co-founder at Sanard Shipping Solutions', 'Gandhidham', 'Entrepreneur',
   2024, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-02 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'NS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 41. Niharika Arora
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Niharika Arora', 'niharika.gemeloart@gmail.com', '8452035237', 'https://www.linkedin.com/in/niharikaarora16?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Going for masters abroad', 'Mumbai', 'Communication Design',
   2023, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'NA', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 42. Niyati Agarwal
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Niyati Agarwal', 'agarwal.niyati99@gmail.com', '9604693868', NULL,
   'Freelancer', 'Mumbai', 'Fashion design',
   2021, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'NA', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 43. Prakriti Jain
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Prakriti Jain', 'prakritijain060601@gmail.com', '7876023620', 'https://www.linkedin.com/in/prakritijain06/',
   'Co-Founder, The Heritage Trail Cafe Shimla', 'Shimla', 'Communication Design',
   2023, 'Other', '3-5 years', 'maybe',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'PJ', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 44. PranayRaj Singh
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('PranayRaj Singh', 'pranay24isdi@gmail.com', '9999654041', 'https://www.linkedin.com/in/pranayraj-singh-08-prs/',
   'Founder- PRSDESIGNS', 'New Delhi', 'B.Voc Interior Design',
   2024, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'PS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 45. Priyanka Shewani
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Priyanka Shewani', 'priyankashewani.ps@gmail.com', '8384879851', NULL,
   'Founder House of TAVANJO', 'Vadodara Gujarat', 'Fashion Communication and Styling',
   2023, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-17 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'PS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 46. Rajvi Parikh
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rajvi Parikh', 'parikhrajvi3@gmail.com', '9663025446', NULL,
   'Founder at Ptato design', 'Pune', 'Product Design',
   2021, 'Consulting', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RP', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 47. Ramya Satish
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Ramya Satish', 'figurati.art@gmail.com', '9619451118', NULL,
   'Independent Artist', 'Barcelona // Mumbai', 'Sculpture',
   2019, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 48. Rashmita Sancheti
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rashmita Sancheti', 'sanchetiria@gmail.con', '8050001888', NULL,
   'Associate Product Manager - InMobi', 'Bengaluru', 'Fashion Design',
   2022, 'Technology', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-26 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 49. Rhea Gore
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rhea Gore', 'rheadgore@gmail.com', '9326224540', 'https://www.linkedin.com/in/rhea-gore-025032001?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Art Director at Leo Burnett', 'Mumbai', 'Communication design',
   2023, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-30 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RG', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 50. Rhea Makhija
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rhea Makhija', 'rheamakhija29@gmail.com', '8976375666', 'https://www.linkedin.com/in/rhea-makhija',
   'Product design @ IBM', 'Bangalore', 'Product design',
   2021, 'Technology', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 51. Rishika Singh
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rishika Singh', 'rishikarsinghh@gmail.com', '9004836769', NULL,
   'Art Director and Founder at Studio Superlative', 'Mumbai', 'Communication Design',
   2023, 'Consulting', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-08 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 52. Riya Agarwal
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Riya Agarwal', 'riyagarwal.98@gmail.com', '9820295069', NULL,
   'Co-Founder at Elemente', 'Mumbai', 'Fashion Design',
   2020, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-08-02 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RA', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 53. Riya Roy
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Riya Roy', 'riya@yellowad.in', '9920062775', 'https://www.linkedin.com/in/riya-roy-2a648816b?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Associate director at yellow', 'Mumbai', 'Interior design',
   2018, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RR', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 54. Rukaiya Vohra
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rukaiya Vohra', 'rvohraf@gmail.com', '9122107492', NULL,
   'User Experience Intern', 'Savannah', 'Product Design',
   2024, 'Technology', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-27 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RV', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 55. Rutuja Malve
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Rutuja Malve', 'rutujamalve874@gmail.com', '9623411059', 'https://www.linkedin.com/in/rutuja-malve-aba83b235/',
   'glad U Came PR executive', 'Mumbai', 'FcS',
   2025, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'RM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 56. Sachi Chordia
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Sachi Chordia', 'chordiasachi@gmail.com', '9688244422', NULL,
   'Fashion merchandiser at Marsil, currently free lancing', 'Chennai', 'Fashion Designing',
   2023, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-02 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SC', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 57. Saniya Oswal
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Saniya Oswal', 'saniyaoswal18@gmail.com', '7066424845', 'https://www.linkedin.com/feed/ , https://www.behance.net/saniyaoswal',
   'Creative Producer - By The Gram', 'Mumbai', 'FCS',
   2025, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SO', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 58. Sanyukta Mathure
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Sanyukta Mathure', 'sanyumathure@gmail.com', '9969553403', 'https://www.linkedin.com/in/sanyukta-mathure/',
   'Senior Researcher, Jigsaw Brand Consultants', 'Mumbai', 'Communication Design',
   2022, 'Consulting', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-30 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 59. Saumya Maloo
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Saumya Maloo', 'saumyamaloo@gmail.com', '0526896573', NULL,
   'Strategic projects - Founder’s Office', 'Dubai', 'Strategic Design Management',
   2021, 'Finance', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-07-24 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 60. Shihij Kaw
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Shihij Kaw', 'shihij.kaw@gmail.com', '9967830169', 'https://www.linkedin.com/in/shihij-kaw-20163b1b4',
   'Assistant interior stylist/ designer', 'Mumbai', 'FCS',
   2023, 'Other', '0-2 years', 'maybe',
   'alumni-form-2026-08', '2026-07-14 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 61. Shruthi Venkatesh
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Shruthi Venkatesh', 'contact@shruthivenkatesh.com', '8754576374', 'https://www.linkedin.com/in/shruthiven',
   'Freelance / Founder - Unplug', 'Bengaluru', 'Communication Design',
   2022, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-07-13 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SV', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 62. Shruti Misra
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Shruti Misra', 'shrutimisra555@gmail.com', '7738042945', 'https://www.linkedin.com/in/shruti-misra-67447520b?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'TATA Trent (Ex)', 'Mumbai', 'Fashion Communication and Styling',
   2024, 'Other', '0-2 years', 'yes',
   'alumni-form-2026-08', '2026-07-01 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SM', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 63. Shruti Sharma
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Shruti Sharma', 'shrutis.sharma95@gmail.com', '7506151412', 'https://www.linkedin.com/in/shruti-sharma-584009165',
   'co - founder', 'mumbai', 'product design',
   2019, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-07-08 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 64. Shubh Hamirwasia
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Shubh Hamirwasia', 'shubbu1105@live.in', '9819966696', NULL,
   'Freelance', 'Mumbai', 'Communication Design',
   2022, 'Healthcare', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-30 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SH', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 65. Shubham Gahlot
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Shubham Gahlot', 'nanni.gahlot124ng@gmail.com', '7700905006', 'https://www.linkedin.com/in/shubhamgahlot124?utm_source=share_via&utm_content=profile&utm_medium=member_android',
   'Senior Industrial Designer / Auriquant Design', 'Mumbai', 'Product design',
   2021, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SG', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 66. Snehal Shelar
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Snehal Shelar', 'snehalshelar2002@gmail.com', '9370550541', 'https://www.linkedin.com/in/snehal-shelar?utm_source=share_via&utm_content=profile&utm_medium=member_android',
   'Interior designer at Hipcouch', 'Mumbai', 'Interior design',
   2020, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-06-29 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 67. Sushruta Basak
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Sushruta Basak', 'sushruta.basak@gmail.com', '9892623960', 'https://www.linkedin.com/in/sushruta-basak',
   'Founder', 'Mumbai', 'Communication Design',
   2022, 'Technology', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'SB', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 68. Tanvi Walanj
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Tanvi Walanj', 'tanviwalanj@gmail.com', '9739784384', 'https://www.linkedin.com/in/tanvi-walanj/',
   'Graphic Designer, Ellucian', 'Washington DC, United States', 'Communication Design',
   2020, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-08-07 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'TW', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 69. Trishala Kachhara
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Trishala Kachhara', 'trishala@itsstudio11.com', '9920746557', 'https://www.linkedin.com/in/trishala-kachhara-577367166?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
   'Founder of Studio 11', 'Paris', 'Communication Design',
   2018, 'Other', '6-10 years', 'yes',
   'alumni-form-2026-08', '2026-06-25 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'TK', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- 70. Vadanya Shrotriya
INSERT INTO mentors
  (full_name, email, phone, linkedin_url, role_title, city, course,
   graduation_year, industry, experience_band, mentoring_availability,
   import_source, consent_at, mentor_type_id, initials, avatar_tone)
VALUES
  ('Vadanya Shrotriya', 'vadanyaa@yahoo.co.in', '7389006666', NULL,
   'Account growth manger at ps&co, visiting faculty at isdi, entrepreneur', 'Mumbai', 'Communication Design',
   2020, 'Other', '3-5 years', 'yes',
   'alumni-form-2026-08', '2026-07-23 00:00:00',
   (SELECT id FROM mentor_types WHERE slug = 'alumni'), 'VS', 'primary')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name), phone = VALUES(phone), linkedin_url = VALUES(linkedin_url),
  role_title = VALUES(role_title), city = VALUES(city), course = VALUES(course),
  graduation_year = VALUES(graduation_year), industry = VALUES(industry),
  experience_band = VALUES(experience_band), mentoring_availability = VALUES(mentoring_availability),
  import_source = VALUES(import_source), consent_at = VALUES(consent_at),
  initials = VALUES(initials);

-- ---------------------------------------------------------------------------
-- 3. The 196 mentorship-area links
--
-- Joined on email and slug so no id is guessed. NOTE: if `mentorship_areas` is
-- empty or missing a slug, these statements insert nothing and report no error
-- — which is why the count check at the bottom of this file matters.
-- ---------------------------------------------------------------------------

-- Aakanksha Mistry
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aakanksha.mistry98@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aakanksha.mistry98@gmail.com' AND a.slug = 'career-development';

-- Aamena K
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aamenakotwala03@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aamenakotwala03@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aamenakotwala03@gmail.com' AND a.slug = 'marketing-growth';

-- Aashi Lath
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aashilath123@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aashilath123@gmail.com' AND a.slug = 'design-creative';

-- Aashka Dave
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aashkadave1309@gmail.com' AND a.slug = 'design-creative';

-- Adeeti Shukla
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'adeetishukla08@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'adeetishukla08@gmail.com' AND a.slug = 'finance-fundraising';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'adeetishukla08@gmail.com' AND a.slug = 'sector-specific';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'adeetishukla08@gmail.com' AND a.slug = 'career-development';

-- Aditi Jaisinghani
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aditi.jaisgh@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aditi.jaisgh@gmail.com' AND a.slug = 'design-creative';

-- Aditya Pai
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aditya@drinkmisfits.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aditya@drinkmisfits.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aditya@drinkmisfits.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aditya@drinkmisfits.com' AND a.slug = 'marketing-growth';

-- Aishwarya Mukim
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'aishwaryamukim@gmail.com' AND a.slug = 'design-creative';

-- Akruti Bagla
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'baglaakruti1@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'baglaakruti1@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'baglaakruti1@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'baglaakruti1@gmail.com' AND a.slug = 'marketing-growth';

-- Amrutha Mahesh
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amrutha.m1999@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amrutha.m1999@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amrutha.m1999@gmail.com' AND a.slug = 'marketing-growth';

-- Anantika Sethi
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anantika1603@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anantika1603@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anantika1603@gmail.com' AND a.slug = 'career-development';

-- Anik Jain
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anikjaindesign@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anikjaindesign@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anikjaindesign@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anikjaindesign@gmail.com' AND a.slug = 'career-development';

-- Anjali Kothari
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anjalikothari2012@gmail.com' AND a.slug = 'hr-culture';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anjalikothari2012@gmail.com' AND a.slug = 'sector-specific';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anjalikothari2012@gmail.com' AND a.slug = 'career-development';

-- Anjali Maheshwari
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anjali.m.work@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anjali.m.work@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anjali.m.work@gmail.com' AND a.slug = 'career-development';

-- Anushka Kadam
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'kadamanu02@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'kadamanu02@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'kadamanu02@gmail.com' AND a.slug = 'career-development';

-- Anvaya Namjoshi
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'anvaya.namjoshi22@gmail.com' AND a.slug = 'marketing-growth';

-- Aparna A — listed no mentorship areas

-- Ayush Apte
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushapte1312@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushapte1312@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushapte1312@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushapte1312@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushapte1312@gmail.com' AND a.slug = 'career-development';

-- Ayush Vijoy
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushzzz1224@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'ayushzzz1224@gmail.com' AND a.slug = 'design-creative';

-- Crystal Princw
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'crystalprincedesign@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'crystalprincedesign@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'crystalprincedesign@gmail.com' AND a.slug = 'career-development';

-- Delaina Fernandes
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'delaina2000@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'delaina2000@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'delaina2000@gmail.com' AND a.slug = 'design-creative';

-- Disha Shah
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'dishashah66@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'dishashah66@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'dishashah66@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'dishashah66@gmail.com' AND a.slug = 'sector-specific';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'dishashah66@gmail.com' AND a.slug = 'career-development';

-- Drashti Shah
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'drashtishah342@gmail.com' AND a.slug = 'design-creative';

-- Harshavi Jain
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'harshavi1321@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'harshavi1321@gmail.com' AND a.slug = 'sales-bizdev';

-- Hemani Bhalotia
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'bhalotiahemani@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'bhalotiahemani@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'bhalotiahemani@gmail.com' AND a.slug = 'sales-bizdev';

-- Hetvi Bhavin Shah
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'hetvishah1398@gmail.com' AND a.slug = 'design-creative';

-- Jainam Chheda
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'jainamchheda8@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'jainamchheda8@gmail.com' AND a.slug = 'marketing-growth';

-- Kasvi Shangari — listed no mentorship areas

-- Keisha Bajaj
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'keishabajaj.kb@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'keishabajaj.kb@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'keishabajaj.kb@gmail.com' AND a.slug = 'sales-bizdev';

-- Khushi Karve
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'khushi.t.karve@gmail.com' AND a.slug = 'career-development';

-- Khushi Khurana
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'khushikaur41099@gmail.com' AND a.slug = 'design-creative';

-- Khushi Mittal
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'khushikmittal@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'khushikmittal@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'khushikmittal@gmail.com' AND a.slug = 'sales-bizdev';

-- khushi shah
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shahkhushi2001@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shahkhushi2001@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shahkhushi2001@gmail.com' AND a.slug = 'sales-bizdev';

-- Khushi Walani
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'khushi.walani@gmail.com' AND a.slug = 'design-creative';

-- Megha Dagliya
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'meghadagliya67@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'meghadagliya67@gmail.com' AND a.slug = 'career-development';

-- Mihir Mehta
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mihir.mehta03@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mihir.mehta03@gmail.com' AND a.slug = 'finance-fundraising';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mihir.mehta03@gmail.com' AND a.slug = 'operations-supply-chain';

-- Mihir pawar
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mihir57pawar@gmail.com' AND a.slug = 'marketing-growth';

-- Mukul Gehaney
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mukulgehaney@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mukulgehaney@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mukulgehaney@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'mukulgehaney@gmail.com' AND a.slug = 'career-development';

-- Nancy Deepak Bhai Amin
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amin.nancy16@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amin.nancy16@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amin.nancy16@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amin.nancy16@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amin.nancy16@gmail.com' AND a.slug = 'operations-supply-chain';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'amin.nancy16@gmail.com' AND a.slug = 'career-development';

-- Nidhi Santwani
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'operations-supply-chain';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'hr-culture';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nidhi.santwani@gmail.com' AND a.slug = 'career-development';

-- Niharika Arora
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'niharika.gemeloart@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'niharika.gemeloart@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'niharika.gemeloart@gmail.com' AND a.slug = 'career-development';

-- Niyati Agarwal — listed no mentorship areas

-- Prakriti Jain
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'prakritijain060601@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'prakritijain060601@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'prakritijain060601@gmail.com' AND a.slug = 'career-development';

-- PranayRaj Singh
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'hr-culture';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'pranay24isdi@gmail.com' AND a.slug = 'career-development';

-- Priyanka Shewani
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'priyankashewani.ps@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'priyankashewani.ps@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'priyankashewani.ps@gmail.com' AND a.slug = 'marketing-growth';

-- Rajvi Parikh
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'parikhrajvi3@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'parikhrajvi3@gmail.com' AND a.slug = 'design-creative';

-- Ramya Satish
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'figurati.art@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'figurati.art@gmail.com' AND a.slug = 'career-development';

-- Rashmita Sancheti
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanchetiria@gmail.con' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanchetiria@gmail.con' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanchetiria@gmail.con' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanchetiria@gmail.con' AND a.slug = 'sector-specific';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanchetiria@gmail.con' AND a.slug = 'career-development';

-- Rhea Gore
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheadgore@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheadgore@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheadgore@gmail.com' AND a.slug = 'career-development';

-- Rhea Makhija
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheamakhija29@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheamakhija29@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheamakhija29@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rheamakhija29@gmail.com' AND a.slug = 'career-development';

-- Rishika Singh
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rishikarsinghh@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rishikarsinghh@gmail.com' AND a.slug = 'design-creative';

-- Riya Agarwal
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'riyagarwal.98@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'riyagarwal.98@gmail.com' AND a.slug = 'career-development';

-- Riya Roy
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'riya@yellowad.in' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'riya@yellowad.in' AND a.slug = 'marketing-growth';

-- Rukaiya Vohra
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rvohraf@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rvohraf@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rvohraf@gmail.com' AND a.slug = 'design-creative';

-- Rutuja Malve
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'rutujamalve874@gmail.com' AND a.slug = 'design-creative';

-- Sachi Chordia
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'chordiasachi@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'chordiasachi@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'chordiasachi@gmail.com' AND a.slug = 'career-development';

-- Saniya Oswal
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saniyaoswal18@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saniyaoswal18@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saniyaoswal18@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saniyaoswal18@gmail.com' AND a.slug = 'hr-culture';

-- Sanyukta Mathure
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanyumathure@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sanyumathure@gmail.com' AND a.slug = 'career-development';

-- Saumya Maloo
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'finance-fundraising';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'operations-supply-chain';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'saumyamaloo@gmail.com' AND a.slug = 'sector-specific';

-- Shihij Kaw
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shihij.kaw@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shihij.kaw@gmail.com' AND a.slug = 'hr-culture';

-- Shruthi Venkatesh
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'contact@shruthivenkatesh.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'contact@shruthivenkatesh.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'contact@shruthivenkatesh.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'contact@shruthivenkatesh.com' AND a.slug = 'sales-bizdev';

-- Shruti Misra
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shrutimisra555@gmail.com' AND a.slug = 'career-development';

-- Shruti Sharma
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shrutis.sharma95@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shrutis.sharma95@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shrutis.sharma95@gmail.com' AND a.slug = 'career-development';

-- Shubh Hamirwasia
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shubbu1105@live.in' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'shubbu1105@live.in' AND a.slug = 'marketing-growth';

-- Shubham Gahlot
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nanni.gahlot124ng@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nanni.gahlot124ng@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nanni.gahlot124ng@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'nanni.gahlot124ng@gmail.com' AND a.slug = 'career-development';

-- Snehal Shelar
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'snehalshelar2002@gmail.com' AND a.slug = 'design-creative';

-- Sushruta Basak
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'finance-fundraising';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'sales-bizdev';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'sushruta.basak@gmail.com' AND a.slug = 'career-development';

-- Tanvi Walanj
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'tanviwalanj@gmail.com' AND a.slug = 'product-technology';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'tanviwalanj@gmail.com' AND a.slug = 'design-creative';

-- Trishala Kachhara
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'trishala@itsstudio11.com' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'trishala@itsstudio11.com' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'trishala@itsstudio11.com' AND a.slug = 'sales-bizdev';

-- Vadanya Shrotriya
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'vadanyaa@yahoo.co.in' AND a.slug = 'business-strategy';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'vadanyaa@yahoo.co.in' AND a.slug = 'design-creative';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'vadanyaa@yahoo.co.in' AND a.slug = 'marketing-growth';
INSERT IGNORE INTO mentor_mentorship_areas (mentor_id, area_id)
SELECT m.id, a.id FROM mentors m JOIN mentorship_areas a
 WHERE m.email = 'vadanyaa@yahoo.co.in' AND a.slug = 'career-development';

COMMIT;

-- ===========================================================================
-- Verify — run these afterwards and check every number
--
--   SELECT COUNT(*) FROM mentors;                                        -- previous count + 70
--   SELECT COUNT(*) FROM mentors WHERE import_source = 'alumni-form-2026-08';  -- 70
--   SELECT COUNT(*) FROM mentors WHERE import_source IS NULL;            -- unchanged
--   SELECT COUNT(*) FROM mentor_mentorship_areas;                        -- 196
--
--   -- what a founder sees (the 62 who answered "Yes", plus any alumni
--   -- mentor entered by hand):
--   SELECT COUNT(*) FROM mentors m JOIN mentor_types mt ON mt.id = m.mentor_type_id
--    WHERE m.deleted_at IS NULL AND m.is_active = TRUE AND mt.slug = 'alumni'
--      AND (m.mentoring_availability IS NULL OR m.mentoring_availability = 'yes');
--
--   -- nobody arrived without a type or with a duplicate email:
--   SELECT COUNT(*) FROM mentors WHERE mentor_type_id IS NULL;           -- 0
--   SELECT email, COUNT(*) FROM mentors WHERE email IS NOT NULL
--    GROUP BY email HAVING COUNT(*) > 1;                                 -- no rows
-- ===========================================================================
