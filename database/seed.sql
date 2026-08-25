-- ===========================================================================
-- ATLAS Forge — DEMO SEED DATA
--
--   npm run db:seed
--
-- The people, startups, listings and history the frontend mock data described,
-- so every screen renders realistic content. DEMO ONLY — never apply to
-- production. Requires reference-data.sql to have been applied first.
--
-- Every row is looked up by natural key (app_id, slug) rather than a literal
-- id, so this file is order-independent and safe to re-run.
--
-- All demo accounts share the password:  Atlas@2026
-- ===========================================================================

USE `atlas-forge-dashboard`;

SET @PWD := 'scrypt$16384$8$1$019a8f0063b670dd5a6e88112f0d5799$f4781a028fef9e4896febf50281eaabf6b8262990b87906413b1d5089ffa9ee372d56f8470412830185cfeeeca00d6d60f2156c430ed5723c19bb5d1c5cf1981';

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT INTO users (app_id, full_name, email, password_hash, initials, avatar_tone, status, last_active_at, bio) VALUES
  ('ATL-2024-0871','Riya Kapoor','riya.kapoor@atlasuniversity.edu.in',      @PWD,'RK','primary','active', NOW(), NULL),
  ('ATL-2023-0342','Arjun Mehta','arjun.mehta@atlasuniversity.edu.in',      @PWD,'AM','success','active', NOW(), NULL),
  ('ATL-2021-0119','Priya Shah','priya.shah@atlasuniversity.edu.in',        @PWD,'PS','danger', 'active', DATE_SUB(NOW(), INTERVAL 1 DAY), NULL),
  ('ATL-2025-0988','Vivaan Nair','vivaan.nair@atlasuniversity.edu.in',      @PWD,'VN','warning','active', DATE_SUB(NOW(), INTERVAL 3 DAY), NULL),
  ('ATL-2023-0541','Kavya Reddy','kavya.reddy@atlasuniversity.edu.in',      @PWD,'KR','neutral','inactive',DATE_SUB(NOW(), INTERVAL 30 DAY), NULL),
  ('ATL-2024-0902','Anjali Rao','anjali.rao@atlasuniversity.edu.in',        @PWD,'AR','primary','active', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
  ('ATL-2023-0777','Dev Malhotra','dev.malhotra@atlasuniversity.edu.in',    @PWD,'DM','primary','active', DATE_SUB(NOW(), INTERVAL 2 DAY), NULL),
  ('ATL-2022-0012','Shantanu Ghuriani','shantanughuriani@gmail.com',        @PWD,'SG','primary','active', NOW(),
   'Founder of NovaMed — building AI-powered preventive health tools.'),
  ('ATL-2020-0001','Mihir Pawar','mihir.pawar@atlasuniversity.edu.in',      @PWD,'MP','warning','active', NOW(),
   'Forge Manager and primary mentor for all incubated projects.'),
  ('ATL-2019-0004','Dr. Meera Joshi','meera.joshi@atlasuniversity.edu.in',  @PWD,'MJ','primary','active', DATE_SUB(NOW(), INTERVAL 5 DAY), NULL),
  ('ATL-2018-0007','Rahul Nair','rahul.nair@alumni.atlasuniversity.edu.in', @PWD,'RN','primary','active', DATE_SUB(NOW(), INTERVAL 6 DAY), NULL),
  ('ATL-2019-0011','Ananya Iyer','ananya.iyer@industry.partner.in',         @PWD,'AI','primary','active', DATE_SUB(NOW(), INTERVAL 7 DAY), NULL),
  ('ATL-2019-0012','Karan Malhotra','karan.malhotra@industry.partner.in',   @PWD,'KM','primary','active', DATE_SUB(NOW(), INTERVAL 8 DAY), NULL),
  ('ATL-2019-0013','Priya Deshmukh','priya.deshmukh@atlasuniversity.edu.in',@PWD,'PD','primary','active', DATE_SUB(NOW(), INTERVAL 9 DAY), NULL),
  ('ATL-2018-0014','Sanjay Verma','sanjay.verma@alumni.atlasuniversity.edu.in',@PWD,'SV','primary','active',DATE_SUB(NOW(), INTERVAL 10 DAY), NULL)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), initials = VALUES(initials),
  avatar_tone = VALUES(avatar_tone), status = VALUES(status);

-- ---------------------------------------------------------------------------
-- Role assignments. Shantanu holds TWO roles — the Shared Profile screen shows
-- "Backend Manager" and "Founder — NovaMed" on one account.
-- ---------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id, is_primary, granted_by)
SELECT u.id, r.id, x.is_primary, (SELECT id FROM users WHERE app_id = 'ATL-2020-0001')
FROM (
  SELECT 'ATL-2024-0871' app_id, 'student' role, TRUE  is_primary UNION ALL
  SELECT 'ATL-2023-0342', 'student',        FALSE UNION ALL
  SELECT 'ATL-2023-0342', 'founder',        TRUE  UNION ALL
  SELECT 'ATL-2021-0119', 'student',        TRUE  UNION ALL
  SELECT 'ATL-2025-0988', 'student',        TRUE  UNION ALL
  SELECT 'ATL-2023-0541', 'student',        TRUE  UNION ALL
  SELECT 'ATL-2024-0902', 'student',        TRUE  UNION ALL
  SELECT 'ATL-2023-0777', 'student',        TRUE  UNION ALL
  SELECT 'ATL-2022-0012', 'founder',        TRUE  UNION ALL
  SELECT 'ATL-2022-0012', 'backend-manager',FALSE UNION ALL
  SELECT 'ATL-2020-0001', 'forge-manager',  TRUE  UNION ALL
  SELECT 'ATL-2019-0004', 'super-admin',    TRUE
) x
JOIN users u ON u.app_id = x.app_id
JOIN roles r ON r.slug   = x.role
ON DUPLICATE KEY UPDATE is_primary = VALUES(is_primary);

-- ---------------------------------------------------------------------------
-- Student profiles
-- ---------------------------------------------------------------------------
INSERT INTO student_profiles (user_id, programme, year_of_study, hours_per_week, work_types, availability_timing, is_available)
SELECT u.id, x.programme, x.yr, x.hours, x.work_types, x.timing, x.available
FROM (
  SELECT 'ATL-2024-0871' app_id,'BDes Product Design' programme,3 yr,10 hours,'Design · Research' work_types,'Weekdays · Evenings' timing,TRUE available UNION ALL
  SELECT 'ATL-2023-0342','BTech Computer Science',2,15,'Development · Architecture','Flexible',TRUE UNION ALL
  SELECT 'ATL-2021-0119','BBA Marketing',4,8,'Marketing · GTM','Weekends',FALSE UNION ALL
  SELECT 'ATL-2025-0988','BTech Data Science',1,12,'ML · Analytics','Flexible',TRUE UNION ALL
  SELECT 'ATL-2023-0541','BDes Communication Design',3,0,'Design','Unavailable',FALSE UNION ALL
  SELECT 'ATL-2024-0902','BDes Product Design',2,10,'Design','Weekday evenings',TRUE UNION ALL
  SELECT 'ATL-2023-0777','BTech Computer Science',3,12,'Development','Weekends',TRUE
) x JOIN users u ON u.app_id = x.app_id
ON DUPLICATE KEY UPDATE programme = VALUES(programme), year_of_study = VALUES(year_of_study),
  hours_per_week = VALUES(hours_per_week), work_types = VALUES(work_types),
  availability_timing = VALUES(availability_timing), is_available = VALUES(is_available);

INSERT INTO student_skills (user_id, skill_id)
SELECT u.id, s.id FROM (
  SELECT 'ATL-2024-0871' app_id,'ui-ux-design' skill UNION ALL
  SELECT 'ATL-2024-0871','figma'         UNION ALL
  SELECT 'ATL-2024-0871','branding'      UNION ALL
  SELECT 'ATL-2024-0871','user-research' UNION ALL
  SELECT 'ATL-2024-0871','prototyping'   UNION ALL
  SELECT 'ATL-2023-0342','react'         UNION ALL
  SELECT 'ATL-2023-0342','nodejs'        UNION ALL
  SELECT 'ATL-2023-0342','typescript'    UNION ALL
  SELECT 'ATL-2021-0119','marketing'     UNION ALL
  SELECT 'ATL-2021-0119','gtm'           UNION ALL
  SELECT 'ATL-2021-0119','content'       UNION ALL
  SELECT 'ATL-2025-0988','python'        UNION ALL
  SELECT 'ATL-2025-0988','ml'            UNION ALL
  SELECT 'ATL-2025-0988','analytics'     UNION ALL
  SELECT 'ATL-2024-0902','ui-ux'         UNION ALL
  SELECT 'ATL-2024-0902','figma'         UNION ALL
  SELECT 'ATL-2023-0777','react'         UNION ALL
  SELECT 'ATL-2023-0777','sql'
) x JOIN users u ON u.app_id = x.app_id JOIN skills s ON s.slug = x.skill
ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);

-- ---------------------------------------------------------------------------
-- Mentors
-- ---------------------------------------------------------------------------
INSERT INTO mentors (user_id, full_name, mentor_type_id, initials, avatar_tone, is_primary)
SELECT u.id, x.full_name, mt.id, x.initials, x.tone, x.is_primary
FROM (
  SELECT 'ATL-2020-0001' app_id,'Mihir Pawar' full_name,'faculty' mtype,'MP' initials,'warning' tone,TRUE is_primary UNION ALL
  SELECT 'ATL-2018-0007','Rahul Nair','alumni','RN','primary',FALSE UNION ALL
  SELECT 'ATL-2019-0004','Dr. Meera Joshi','faculty','MJ','primary',FALSE UNION ALL
  SELECT 'ATL-2019-0011','Ananya Iyer','industry','AI','primary',FALSE UNION ALL
  SELECT 'ATL-2019-0012','Karan Malhotra','industry','KM','primary',FALSE UNION ALL
  SELECT 'ATL-2019-0013','Priya Deshmukh','faculty','PD','primary',FALSE UNION ALL
  SELECT 'ATL-2018-0014','Sanjay Verma','alumni','SV','primary',FALSE
) x
JOIN users u ON u.app_id = x.app_id
JOIN mentor_types mt ON mt.slug = x.mtype
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), mentor_type_id = VALUES(mentor_type_id),
  initials = VALUES(initials), avatar_tone = VALUES(avatar_tone), is_primary = VALUES(is_primary);

INSERT INTO mentor_skills (mentor_id, skill_id)
SELECT m.id, s.id FROM (
  SELECT 'Rahul Nair' mentor,'gtm-strategy' skill UNION ALL
  SELECT 'Rahul Nair','fundraising'               UNION ALL
  SELECT 'Dr. Meera Joshi','ux-research'          UNION ALL
  SELECT 'Dr. Meera Joshi','product-strategy'     UNION ALL
  SELECT 'Ananya Iyer','backend-architecture'     UNION ALL
  SELECT 'Ananya Iyer','cloud-infra'              UNION ALL
  SELECT 'Karan Malhotra','ui-design'             UNION ALL
  SELECT 'Karan Malhotra','branding'              UNION ALL
  SELECT 'Priya Deshmukh','legal-compliance'      UNION ALL
  SELECT 'Priya Deshmukh','ip-strategy'           UNION ALL
  SELECT 'Sanjay Verma','growth'                  UNION ALL
  SELECT 'Sanjay Verma','analytics'
) x JOIN mentors m ON m.full_name = x.mentor JOIN skills s ON s.slug = x.skill
ON DUPLICATE KEY UPDATE mentor_id = VALUES(mentor_id);

-- ---------------------------------------------------------------------------
-- Startups
-- ---------------------------------------------------------------------------
INSERT INTO startups (slug, name, tagline, problem_statement, industry_id, stage_id,
                      owner_user_id, mentor_id, is_hiring, open_roles, is_featured, status, initial, avatar_tone)
SELECT x.slug, x.name, x.tagline, x.problem, i.id, st.id, u.id, m.id,
       x.is_hiring, x.open_roles, x.featured, x.status, x.initial, x.tone
FROM (
  SELECT 'novamed' slug,'NovaMed' name,
         'AI-powered health monitoring app for preventive care. Focused on chronic disease management.' tagline,
         'Chronic disease goes undetected until it is expensive to treat.' problem,
         'healthtech' ind,'early-traction' stage,'ATL-2022-0012' owner,'Mihir Pawar' mentor,
         TRUE is_hiring,3 open_roles,TRUE featured,'active' status,'N' initial,'primary' tone UNION ALL
  SELECT 'edutrack','EduTrack',
         'Adaptive learning platform connecting students with personalised content paths.',
         'One-size-fits-all curricula leave most students behind.',
         'edtech','prototype','ATL-2023-0342','Mihir Pawar',TRUE,2,FALSE,'active','E','success' UNION ALL
  SELECT 'greengrid','GreenGrid',
         'Peer-to-peer renewable energy trading platform for residential solar users.',
         'Rooftop solar owners cannot sell surplus energy to neighbours.',
         'cleantech','idea','ATL-2021-0119',NULL,FALSE,0,FALSE,'pending','G','success' UNION ALL
  SELECT 'finflow','FinFlow',
         'Personal finance automation for first-time earners.',
         'Students entering the workforce have no financial guardrails.',
         'fintech','idea','ATL-2025-0988',NULL,FALSE,0,FALSE,'under_review','F','warning'
) x
JOIN industries i ON i.slug = x.ind
JOIN stages st    ON st.slug = x.stage
JOIN users u      ON u.app_id = x.owner
LEFT JOIN mentors m ON m.full_name = x.mentor
ON DUPLICATE KEY UPDATE name = VALUES(name), tagline = VALUES(tagline),
  industry_id = VALUES(industry_id), stage_id = VALUES(stage_id), mentor_id = VALUES(mentor_id),
  is_hiring = VALUES(is_hiring), open_roles = VALUES(open_roles),
  is_featured = VALUES(is_featured), status = VALUES(status);

INSERT INTO startup_members (startup_id, user_id, role_title, joined_at)
SELECT s.id, u.id, x.role_title, x.joined
FROM (
  SELECT 'novamed' slug,'ATL-2022-0012' app_id,'Founder & CEO' role_title,'2025-08-01' joined UNION ALL
  SELECT 'novamed','ATL-2023-0342','CTO','2025-09-15' UNION ALL
  SELECT 'novamed','ATL-2021-0119','Head of Design','2025-11-02' UNION ALL
  SELECT 'edutrack','ATL-2023-0342','Founder','2025-10-01' UNION ALL
  SELECT 'edutrack','ATL-2023-0777','Engineer','2026-01-12' UNION ALL
  SELECT 'greengrid','ATL-2021-0119','Founder','2026-02-01' UNION ALL
  SELECT 'finflow','ATL-2025-0988','Founder','2026-05-20'
) x JOIN startups s ON s.slug = x.slug JOIN users u ON u.app_id = x.app_id
ON DUPLICATE KEY UPDATE role_title = VALUES(role_title);

-- ---------------------------------------------------------------------------
-- Listings  (jobs and collab posts share this table)
-- ---------------------------------------------------------------------------
INSERT INTO listings (type, title, description, startup_id, created_by, listing_type_id,
                      contract_type_id, compensation, status, posted_at)
SELECT x.type, x.title, x.descr, s.id, u.id, lt.id, ct.id, x.comp, x.status,
       DATE_SUB(NOW(), INTERVAL x.days_ago DAY)
FROM (
  SELECT 'job' type,'UI/UX Designer' title,
         'We''re looking for a talented product designer to lead the mobile app redesign for our health monitoring platform. You''ll own the full design process from research to final handoff.' descr,
         'novamed' startup,'ATL-2022-0012' creator,'full-time' ltype,'paid-freelance' ctype,
         'Paid · ₹15,000/month' comp,'live' status,0 days_ago UNION ALL
  SELECT 'job','Frontend Developer',
         'Build the adaptive learning experience used by thousands of students each week.',
         'edutrack','ATL-2023-0342','part-time','paid-freelance','Paid · ₹12,000/month','pending',1 UNION ALL
  SELECT 'job','Marketing Lead',
         'Own go-to-market for the NovaMed launch — positioning, content and early growth experiments.',
         'novamed','ATL-2022-0012','contract','equity','Equity · 0.5%','live',18 UNION ALL
  SELECT 'job','Data Analyst',
         'Analyse learner progression data and surface insight for the product team.',
         'edutrack','ATL-2023-0342','part-time','paid-freelance','Paid · ₹10,000/month','pending',22 UNION ALL
  SELECT 'job','Backend Developer',
         'Own the NovaMed ingestion pipeline and device integrations.',
         'novamed','ATL-2022-0012','full-time','paid-freelance','Paid · ₹18,000/month','rejected',25 UNION ALL
  SELECT 'collab','Brand Collab',
         'Help shape the GreenGrid brand identity ahead of the pilot launch. Portfolio-friendly collaboration.',
         'greengrid','ATL-2021-0119','collab','no-pay','Unpaid Collab','live',19
) x
JOIN startups s ON s.slug = x.startup
JOIN users u    ON u.app_id = x.creator
JOIN listing_types lt  ON lt.slug = x.ltype
JOIN contract_types ct ON ct.slug = x.ctype
WHERE NOT EXISTS (SELECT 1 FROM listings l WHERE l.title = x.title AND l.startup_id = s.id);

-- Student collab post — no startup behind it.
INSERT INTO listings (type, title, description, startup_id, created_by, listing_type_id,
                      contract_type_id, collaborator_need, status, posted_at)
SELECT 'collab','Looking for a UI Designer for my food-tech app',
       'Early-stage side project exploring campus canteen ordering. Looking for someone to own the interface.',
       NULL, u.id, lt.id, ct.id, 'Designer', 'pending', DATE_SUB(NOW(), INTERVAL 4 DAY)
FROM users u JOIN listing_types lt ON lt.slug='collab' JOIN contract_types ct ON ct.slug='no-pay'
WHERE u.app_id = 'ATL-2024-0871'
  AND NOT EXISTS (SELECT 1 FROM listings l WHERE l.title = 'Looking for a UI Designer for my food-tech app');

INSERT INTO listing_skills (listing_id, skill_id)
SELECT l.id, s.id FROM (
  SELECT 'UI/UX Designer' title,'design' skill UNION ALL
  SELECT 'UI/UX Designer','mobile'            UNION ALL
  SELECT 'UI/UX Designer','figma'             UNION ALL
  SELECT 'UI/UX Designer','ux-research'       UNION ALL
  SELECT 'Frontend Developer','react'         UNION ALL
  SELECT 'Frontend Developer','typescript'    UNION ALL
  SELECT 'Marketing Lead','gtm'               UNION ALL
  SELECT 'Marketing Lead','content'           UNION ALL
  SELECT 'Data Analyst','sql'                 UNION ALL
  SELECT 'Data Analyst','python'              UNION ALL
  SELECT 'Backend Developer','nodejs'         UNION ALL
  SELECT 'Brand Collab','branding'
) x JOIN listings l ON l.title = x.title JOIN skills s ON s.slug = x.skill
ON DUPLICATE KEY UPDATE listing_id = VALUES(listing_id);

-- ---------------------------------------------------------------------------
-- Approvals  (Forge Manager decision, then Backend Manager override where set)
-- ---------------------------------------------------------------------------
INSERT INTO approvals (listing_id, decided_as_role_id, decision, decided_by, reason, is_override, decided_at)
SELECT l.id, r.id, x.decision, u.id, x.reason, x.is_override, DATE_SUB(NOW(), INTERVAL x.days_ago DAY)
FROM (
  SELECT 'UI/UX Designer' title,'forge-manager' role,'approved' decision,'ATL-2020-0001' decider,NULL reason,FALSE is_override,1 days_ago UNION ALL
  SELECT 'Marketing Lead','forge-manager','approved','ATL-2020-0001',NULL,FALSE,17 UNION ALL
  SELECT 'Brand Collab','forge-manager','approved','ATL-2020-0001',NULL,FALSE,18 UNION ALL
  SELECT 'Backend Developer','forge-manager','rejected','ATL-2020-0001','Unrelated to incubation',FALSE,24
) x
JOIN listings l ON l.title = x.title
JOIN roles r    ON r.slug  = x.role
JOIN users u    ON u.app_id = x.decider
ON DUPLICATE KEY UPDATE decision = VALUES(decision), reason = VALUES(reason);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
INSERT INTO applications (listing_id, applicant_user_id, status, applied_at)
SELECT l.id, u.id, x.status, DATE_SUB(NOW(), INTERVAL x.days_ago DAY)
FROM (
  SELECT 'UI/UX Designer' title,'ATL-2024-0871' app_id,'under_review' status,0 days_ago UNION ALL
  SELECT 'UI/UX Designer','ATL-2024-0902','interview',1 UNION ALL
  SELECT 'UI/UX Designer','ATL-2023-0777','applied',2 UNION ALL
  SELECT 'Brand Collab','ATL-2024-0871','shortlisted',18 UNION ALL
  SELECT 'Frontend Developer','ATL-2024-0871','not_selected',26 UNION ALL
  SELECT 'Marketing Lead','ATL-2021-0119','applied',10
) x JOIN listings l ON l.title = x.title JOIN users u ON u.app_id = x.app_id
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO application_events (application_id, from_status, to_status, changed_by, created_at)
SELECT a.id, NULL, 'applied', a.applicant_user_id, a.applied_at
FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM application_events e WHERE e.application_id = a.id);

INSERT INTO application_events (application_id, from_status, to_status, changed_by, created_at)
SELECT a.id, 'applied', a.status, l.created_by, DATE_ADD(a.applied_at, INTERVAL 1 DAY)
FROM applications a JOIN listings l ON l.id = a.listing_id
WHERE a.status <> 'applied'
  AND NOT EXISTS (SELECT 1 FROM application_events e
                   WHERE e.application_id = a.id AND e.to_status = a.status);

-- ---------------------------------------------------------------------------
-- Concierge
-- ---------------------------------------------------------------------------
INSERT INTO concierge_contacts (founder_user_id, student_user_id, startup_id, context,
                                duration_label, cc_user_id, status, contacted_at)
SELECT f.id, s.id, st.id, x.context, x.duration, cc.id, x.status,
       DATE_SUB(NOW(), INTERVAL x.days_ago DAY)
FROM (
  SELECT 'ATL-2022-0012' founder,'ATL-2024-0871' student,'novamed' startup,'Brand identity project' context,'4 week engagement' duration,'pending' status,0 days_ago UNION ALL
  SELECT 'ATL-2023-0342','ATL-2025-0988','edutrack','React dev collab','6 weeks','ongoing',1 UNION ALL
  SELECT 'ATL-2022-0012','ATL-2021-0119','novamed','GTM strategy','2 weeks','done',18 UNION ALL
  SELECT 'ATL-2023-0342','ATL-2024-0871','edutrack','UX collab','3 weeks','ongoing',21 UNION ALL
  SELECT 'ATL-2022-0012','ATL-2025-0988','novamed','ML research','4 weeks','done',26
) x
JOIN users f  ON f.app_id = x.founder
JOIN users s  ON s.app_id = x.student
JOIN users cc ON cc.app_id = 'ATL-2020-0001'
LEFT JOIN startups st ON st.slug = x.startup
WHERE NOT EXISTS (
  SELECT 1 FROM concierge_contacts c
   WHERE c.founder_user_id = f.id AND c.student_user_id = s.id AND c.context = x.context);

INSERT INTO posted_needs (founder_user_id, startup_id, title, description, status, posted_at)
SELECT u.id, s.id, x.title, x.descr, x.status, DATE_SUB(NOW(), INTERVAL x.days_ago DAY)
FROM (
  SELECT 'ATL-2022-0012' founder,'novamed' startup,'UI Designer for patient onboarding' title,'Need a designer for the onboarding flow.' descr,'open' status,0 days_ago UNION ALL
  SELECT 'ATL-2023-0342','edutrack','React developer for adaptive learning module','Front-end work on the adaptive module.','open',18 UNION ALL
  SELECT 'ATL-2021-0119','greengrid','Brand identity collaborator','Identity work ahead of the pilot.','filled',24
) x JOIN users u ON u.app_id = x.founder JOIN startups s ON s.slug = x.startup
WHERE NOT EXISTS (SELECT 1 FROM posted_needs p WHERE p.title = x.title);

-- ---------------------------------------------------------------------------
-- Mentorship
-- ---------------------------------------------------------------------------
INSERT INTO mentorship_requests (requester_user_id, startup_id, topic, context,
                                 preferred_mentor_type_id, preferred_timing, status)
SELECT u.id, s.id, x.topic, x.context, mt.id, x.timing, x.status
FROM (
  SELECT 'ATL-2024-0871' app_id,'novamed' startup,'UX guidance for onboarding flow' topic,'Improving onboarding UX for our patient app' context,'faculty' mtype,'Weekday evenings' timing,'requested' status UNION ALL
  SELECT 'ATL-2023-0342','edutrack','Backend architecture review','Scaling the adaptive engine','industry','Thu 3–5 PM','requested' UNION ALL
  SELECT 'ATL-2022-0012','novamed','Product-market fit strategy','Preparing for the Q3 launch','faculty','Weekday afternoons','assigned'
) x
JOIN users u ON u.app_id = x.app_id
LEFT JOIN startups s ON s.slug = x.startup
LEFT JOIN mentor_types mt ON mt.slug = x.mtype
WHERE NOT EXISTS (SELECT 1 FROM mentorship_requests mr WHERE mr.topic = x.topic AND mr.requester_user_id = u.id);

INSERT INTO mentorship_sessions (mentor_id, mentee_user_id, startup_id, topic, scheduled_at,
                                 assigned_by, status)
SELECT m.id, u.id, s.id, x.topic, x.sched, a.id, x.status
FROM (
  SELECT 'Mihir Pawar' mentor,'ATL-2022-0012' mentee,'novamed' startup,'Product-market fit strategy for NovaMed Q3 launch' topic,DATE_ADD(NOW(), INTERVAL 7 DAY) sched,'upcoming' status UNION ALL
  SELECT 'Mihir Pawar','ATL-2022-0012','novamed','Reviewed pitch deck. Feedback on financial projections.',DATE_SUB(NOW(), INTERVAL 12 DAY),'completed' UNION ALL
  SELECT 'Mihir Pawar','ATL-2024-0871','novamed','Product-market fit strategy for NovaMed Q3',DATE_ADD(NOW(), INTERVAL 5 DAY),'upcoming' UNION ALL
  SELECT 'Mihir Pawar','ATL-2023-0342','edutrack','Backend architecture review',DATE_SUB(NOW(), INTERVAL 20 DAY),'completed' UNION ALL
  SELECT 'Dr. Meera Joshi','ATL-2024-0871',NULL,'UX Research methods',NULL,'requested' UNION ALL
  SELECT 'Rahul Nair','ATL-2021-0119',NULL,'GTM strategy workshop',DATE_SUB(NOW(), INTERVAL 26 DAY),'completed'
) x
JOIN mentors m ON m.full_name = x.mentor
JOIN users u   ON u.app_id = x.mentee
JOIN users a   ON a.app_id = 'ATL-2020-0001'
LEFT JOIN startups s ON s.slug = x.startup
WHERE NOT EXISTS (
  SELECT 1 FROM mentorship_sessions ms WHERE ms.topic = x.topic AND ms.mentee_user_id = u.id);

-- Link each assigned request to the session that fulfilled it. Without this a
-- request can never read as matched: the Forge Manager's Assign Mentors screen
-- asks "has *this request* been given a mentor", and a session with no
-- request_id can only answer for the student as a whole.
--
-- Only requests already marked `assigned` are linked. The two still marked
-- `requested` are genuinely open — matching them to a session that happens to
-- share a topic would contradict their own status.
UPDATE mentorship_sessions ms
  JOIN mentorship_requests mr
    ON mr.requester_user_id = ms.mentee_user_id
   AND mr.status = 'assigned'
   AND ms.topic LIKE CONCAT(mr.topic, '%')
   SET ms.request_id = mr.id
 WHERE ms.request_id IS NULL;

-- ---------------------------------------------------------------------------
-- Incubation
-- ---------------------------------------------------------------------------
INSERT INTO incubation_applications (applicant_user_id, startup_id, idea_name, problem_statement,
                                     stage_id, status, completion_pct, submitted_at, reviewed_by, reviewed_at)
SELECT u.id, s.id, x.idea, x.problem, st.id, x.status, x.pct,
       CASE WHEN x.status = 'draft' THEN NULL ELSE DATE_SUB(NOW(), INTERVAL x.days_ago DAY) END,
       CASE WHEN x.status IN ('approved','under_review') THEN rv.id ELSE NULL END,
       CASE WHEN x.status IN ('approved','under_review') THEN DATE_SUB(NOW(), INTERVAL x.days_ago - 1 DAY) ELSE NULL END
FROM (
  SELECT 'ATL-2022-0012' app_id,'novamed' startup,'NovaMed — AI health monitoring' idea,'Chronic disease goes undetected until it is expensive to treat.' problem,'early-traction' stage,'approved' status,100 pct,60 days_ago UNION ALL
  SELECT 'ATL-2023-0342','edutrack','EduTrack — adaptive learning','One-size-fits-all curricula leave most students behind.','prototype','under_review',75,30 UNION ALL
  SELECT 'ATL-2021-0119','greengrid','GreenGrid — P2P solar trading','Rooftop solar owners cannot sell surplus energy.','idea','pending',60,2 UNION ALL
  SELECT 'ATL-2025-0988','finflow','FinFlow — finance automation','Students entering the workforce have no financial guardrails.','idea','draft',60,0
) x
JOIN users u   ON u.app_id = x.app_id
JOIN users rv  ON rv.app_id = 'ATL-2020-0001'
LEFT JOIN startups s ON s.slug = x.startup
LEFT JOIN stages st  ON st.slug = x.stage
WHERE NOT EXISTS (SELECT 1 FROM incubation_applications ia WHERE ia.idea_name = x.idea);

INSERT INTO application_readiness (application_id, readiness_item_id, value)
SELECT ia.id, ri.id, x.value
FROM (
  SELECT 'NovaMed — AI health monitoring' idea,'pitch-deck' item,'https://novamed.example/deck' value UNION ALL
  SELECT 'NovaMed — AI health monitoring','demo','https://novamed.example/demo' UNION ALL
  SELECT 'NovaMed — AI health monitoring','assets','https://figma.com/novamed' UNION ALL
  SELECT 'NovaMed — AI health monitoring','personnel','Shantanu Ghuriani — CEO, Arjun Mehta — CTO' UNION ALL
  SELECT 'EduTrack — adaptive learning','pitch-deck','https://edutrack.example/deck' UNION ALL
  SELECT 'EduTrack — adaptive learning','demo','https://edutrack.example/demo' UNION ALL
  SELECT 'EduTrack — adaptive learning','personnel','Arjun Mehta — Founder' UNION ALL
  SELECT 'GreenGrid — P2P solar trading','pitch-deck','https://greengrid.example/concept' UNION ALL
  SELECT 'GreenGrid — P2P solar trading','personnel','Priya Shah — Founder' UNION ALL
  SELECT 'FinFlow — finance automation','pitch-deck','Concept note in progress'
) x
JOIN incubation_applications ia ON ia.idea_name = x.idea
JOIN readiness_items ri ON ri.slug = x.item
ON DUPLICATE KEY UPDATE value = VALUES(value);

INSERT INTO founder_access_grants (user_id, startup_id, granted_by, granted_at)
SELECT u.id, s.id, g.id, x.granted
FROM (
  SELECT 'ATL-2022-0012' app_id,'novamed' startup,'2026-01-12 09:12:00' granted UNION ALL
  SELECT 'ATL-2023-0342','edutrack','2026-03-05 11:00:00'
) x
JOIN users u ON u.app_id = x.app_id
JOIN users g ON g.app_id = 'ATL-2020-0001'
JOIN startups s ON s.slug = x.startup
WHERE NOT EXISTS (
  SELECT 1 FROM founder_access_grants fg WHERE fg.user_id = u.id AND fg.startup_id = s.id);

-- ---------------------------------------------------------------------------
-- Contracts
-- ---------------------------------------------------------------------------
INSERT INTO contracts (startup_id, founder_user_id, student_user_id, title, status, started_at, ended_at)
SELECT s.id, f.id, st.id, x.title, x.status, x.start_d, x.end_d
FROM (
  SELECT 'novamed' startup,'ATL-2022-0012' founder,'ATL-2024-0871' student,'Brand identity engagement' title,'active' status,'2026-07-01' start_d,NULL end_d UNION ALL
  SELECT 'edutrack','ATL-2023-0342','ATL-2025-0988','React development collab','active','2026-06-15',NULL UNION ALL
  SELECT 'novamed','ATL-2022-0012','ATL-2021-0119','GTM strategy sprint','completed','2026-06-01','2026-06-15'
) x
JOIN startups s ON s.slug = x.startup
JOIN users f    ON f.app_id = x.founder
JOIN users st   ON st.app_id = x.student
WHERE NOT EXISTS (SELECT 1 FROM contracts c WHERE c.title = x.title AND c.founder_user_id = f.id);

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------
INSERT INTO activity_logs (actor_user_id, action, module, entity_type, status, created_at)
SELECT u.id, x.action, x.module, x.entity, x.status, DATE_SUB(NOW(), INTERVAL x.mins MINUTE)
FROM (
  SELECT 'ATL-2022-0012' app_id,'Contacted Riya Kapoor via Service' action,'Service' module,'concierge_contact' entity,'logged' status,30 mins UNION ALL
  SELECT 'ATL-2020-0001','Granted Founder access: Shantanu Ghuriani','Access','founder_access_grant','success',180 UNION ALL
  SELECT 'ATL-2020-0001','Rejected Job Listing: ''Off-topic role''','Hiring','listing','action',200 UNION ALL
  SELECT 'ATL-2021-0119','Submitted incubation application: GreenGrid','Incubation','incubation_application','pending',1500 UNION ALL
  SELECT 'ATL-2020-0001','Approved Job Listing: UI/UX Designer','Hiring','listing','success',1600 UNION ALL
  SELECT 'ATL-2024-0871','Applied for UI/UX Designer at NovaMed','Hiring','application','pending',45 UNION ALL
  SELECT 'ATL-2024-0871','Flagged availability: 10 hrs/week','Service','student_profile','success',1200 UNION ALL
  SELECT 'ATL-2024-0871','Requested mentorship session','Mentorship','mentorship_request','pending',3000 UNION ALL
  SELECT 'ATL-2022-0012','Contacted Priya Shah via Service','Service','concierge_contact','logged',4000 UNION ALL
  SELECT 'ATL-2022-0012','Posted Job: Frontend Developer','Hiring','listing','pending',5000
) x JOIN users u ON u.app_id = x.app_id
WHERE NOT EXISTS (SELECT 1 FROM activity_logs al WHERE al.action = x.action);

-- Point each audit row at the entity it describes. An entry that names an
-- entity_type but leaves entity_id NULL is only half a record: the founder's
-- activity feed matches on those ids to show what happened to their startup,
-- so without them it can only ever show the founder's own actions.
UPDATE activity_logs a JOIN listings l ON l.title = 'UI/UX Designer'
   SET a.entity_id = l.id
 WHERE a.action = 'Approved Job Listing: UI/UX Designer' AND a.entity_id IS NULL;

UPDATE activity_logs a JOIN listings l ON l.title = 'Backend Developer'
   SET a.entity_id = l.id
 WHERE a.action LIKE 'Rejected Job Listing%' AND a.entity_id IS NULL;

UPDATE activity_logs a JOIN listings l ON l.title = 'Frontend Developer'
   SET a.entity_id = l.id
 WHERE a.action = 'Posted Job: Frontend Developer' AND a.entity_id IS NULL;

UPDATE activity_logs a
  JOIN applications ap ON ap.applicant_user_id = a.actor_user_id
  JOIN listings l ON l.id = ap.listing_id AND l.title = 'UI/UX Designer'
   SET a.entity_id = ap.id
 WHERE a.action = 'Applied for UI/UX Designer at NovaMed' AND a.entity_id IS NULL;

UPDATE activity_logs a
  JOIN concierge_contacts c ON c.founder_user_id = a.actor_user_id
  JOIN users s ON s.id = c.student_user_id
   SET a.entity_id = c.id
 WHERE a.entity_type = 'concierge_contact'
   AND a.action = CONCAT('Contacted ', s.full_name, ' via Service')
   AND a.entity_id IS NULL;

UPDATE activity_logs a
  JOIN mentorship_requests r ON r.requester_user_id = a.actor_user_id
   SET a.entity_id = r.id
 WHERE a.action = 'Requested mentorship session' AND a.entity_id IS NULL;

UPDATE activity_logs a
  JOIN incubation_applications ia ON ia.applicant_user_id = a.actor_user_id
   SET a.entity_id = ia.id
 WHERE a.action LIKE 'Submitted incubation application%' AND a.entity_id IS NULL;

UPDATE activity_logs a
  JOIN founder_access_grants g ON g.user_id = a.actor_user_id OR g.granted_by = a.actor_user_id
   SET a.entity_id = g.id
 WHERE a.action LIKE 'Granted Founder access%' AND a.entity_id IS NULL;

-- The availability entry describes the student's own profile row.
UPDATE activity_logs a
   SET a.entity_id = a.actor_user_id
 WHERE a.entity_type = 'student_profile' AND a.entity_id IS NULL;

-- ---------------------------------------------------------------------------
-- Notifications  (the sidebar count badges)
-- ---------------------------------------------------------------------------
INSERT INTO notifications (user_id, type, title, body, link_url, created_at)
SELECT u.id, x.type, x.title, x.body, x.link, DATE_SUB(NOW(), INTERVAL x.hours HOUR)
FROM (
  SELECT 'ATL-2024-0871' app_id,'application' type,'Your application is under review' title,'NovaMed is reviewing your UI/UX Designer application.' body,'/student/applications' link,2 hours UNION ALL
  SELECT 'ATL-2024-0871','mentorship','Mentorship request received','Mihir Pawar will match you with a mentor.','/student/mentorship',26 UNION ALL
  SELECT 'ATL-2022-0012','application','Riya Kapoor applied','UI/UX Designer at NovaMed','/founder/applicants',2 UNION ALL
  SELECT 'ATL-2022-0012','listing','Listing approved','UI/UX Designer is now live.','/founder/listings',26 UNION ALL
  SELECT 'ATL-2020-0001','approval','7 listings awaiting approval','Review the job approval queue.','/forge/approval-queue',1 UNION ALL
  SELECT 'ATL-2020-0001','mentorship','2 mentor requests pending','Assign mentors to waiting students.','/forge/assign-mentors',3
) x JOIN users u ON u.app_id = x.app_id
WHERE NOT EXISTS (SELECT 1 FROM notifications n WHERE n.title = x.title AND n.user_id = u.id);

-- ---------------------------------------------------------------------------
-- Messages  (Contact Forge Manager)
-- ---------------------------------------------------------------------------
INSERT INTO messages (sender_user_id, recipient_user_id, subject, body, sent_at)
SELECT s.id, r.id, x.subject, x.body, DATE_SUB(NOW(), INTERVAL x.days DAY)
FROM (
  SELECT 'ATL-2024-0871' sender,'Question about incubation eligibility' subject,'Can second-year students apply as a team?' body,3 days UNION ALL
  SELECT 'ATL-2022-0012','Request to feature NovaMed','We have hit early traction — can we be featured?',6
) x
JOIN users s ON s.app_id = x.sender
JOIN users r ON r.app_id = 'ATL-2020-0001'
WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.subject = x.subject);
