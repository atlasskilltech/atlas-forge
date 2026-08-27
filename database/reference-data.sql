-- ===========================================================================
-- ATLAS Forge — REFERENCE DATA
--
--   npm run db:reference
--
-- Configuration the application cannot function without: roles, permissions,
-- and every lookup list the UI renders. This is NOT demo content — it must be
-- applied to every environment including production.
--
-- Idempotent: every statement is INSERT ... ON DUPLICATE KEY UPDATE keyed on
-- the natural `slug`, so re-running refreshes labels without duplicating rows
-- or disturbing the ids that seed/production data references.
-- ===========================================================================

USE `atlas-forge-dashboard`;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (slug, name, description, is_view_only, sort_order) VALUES
  ('student',         'Standard Student', 'Browse jobs, projects, mentorship & flag availability', FALSE, 1),
  ('founder',         'Founder (Startup)', 'Manage your startup, post jobs and contact students',  FALSE, 2),
  ('forge-manager',   'Forge Manager',    'Oversee the incubator, approve content and assign mentors', FALSE, 3),
  ('backend-manager', 'Backend Manager',  'Platform settings, user roles and full override access', FALSE, 4),
  ('super-admin',     'Super Admin',      'Read-only visibility across the entire platform',        TRUE,  5)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description),
  is_view_only = VALUES(is_view_only), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (slug, name, module) VALUES
  ('listing.view',            'View listings',              'hiring'),
  ('listing.create',          'Create a listing',           'hiring'),
  ('listing.approve',         'Approve or reject listings', 'hiring'),
  ('listing.override',        'Override approval decisions','hiring'),
  ('application.create',      'Apply to a listing',         'hiring'),
  ('application.view_own',    'View own applications',      'hiring'),
  ('application.view_all',    'View all applications',      'hiring'),
  ('concierge.search',        'Search the student pool',    'concierge'),
  ('concierge.contact',       'Contact a student',          'concierge'),
  ('concierge.view_all_logs', 'View all contact logs',      'concierge'),
  ('availability.manage',     'Manage own availability',    'concierge'),
  ('startup.view',            'View startups',              'projects'),
  ('startup.manage_own',      'Manage own startup listing', 'projects'),
  ('startup.manage_all',      'Manage any startup',         'projects'),
  ('startup.feature',         'Feature a startup',          'projects'),
  ('mentorship.request',      'Request mentorship',         'mentorship'),
  ('mentorship.assign',       'Assign mentors',             'mentorship'),
  ('mentorship.view_all',     'View all sessions',          'mentorship'),
  ('incubation.apply',        'Apply for incubation',       'incubation'),
  ('incubation.review',       'Review incubation applications', 'incubation'),
  ('access.grant',            'Grant Founder access',       'access'),
  ('access.revoke',           'Revoke Founder access',      'access'),
  ('user.view_all',           'View all user accounts',     'admin'),
  ('user.manage',             'Manage user accounts',       'admin'),
  ('platform.settings.view',  'View platform settings',     'platform'),
  ('platform.settings.write', 'Change platform settings',   'platform'),
  ('platform.logs.view',      'View platform logs',         'platform'),
  ('document.manage_own',     'Upload and replace own startup documents', 'compliance'),
  ('document.view_all',       'View and download any startup documents',  'compliance'),
  ('platform.reset',          'Reset platform data',        'platform')
ON DUPLICATE KEY UPDATE name = VALUES(name), module = VALUES(module);

-- ---------------------------------------------------------------------------
-- Role → permission grants
-- Super Admin deliberately receives only *.view / view_all permissions: the
-- role is view-only, and that is enforced here rather than in the UI.
-- ---------------------------------------------------------------------------
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'listing.view','application.create','application.view_own','availability.manage',
  'startup.view','mentorship.request','incubation.apply','listing.create')
WHERE r.slug = 'student'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'listing.view','listing.create','application.view_all','concierge.search',
  'concierge.contact','startup.view','startup.manage_own','mentorship.request',
  'incubation.apply','document.manage_own')
WHERE r.slug = 'founder'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'listing.view','listing.approve','application.view_all','concierge.search',
  'concierge.view_all_logs','startup.view','startup.manage_all','startup.feature',
  'mentorship.assign','mentorship.view_all','incubation.review','access.grant',
  'user.view_all','platform.logs.view','document.view_all')
WHERE r.slug = 'forge-manager'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p
WHERE r.slug = 'backend-manager'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug IN (
  'listing.view','application.view_all','concierge.view_all_logs','startup.view',
  'mentorship.view_all','user.view_all','platform.settings.view','platform.logs.view',
  'document.view_all')
WHERE r.slug = 'super-admin'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- ---------------------------------------------------------------------------
-- Industries
-- ---------------------------------------------------------------------------
INSERT INTO industries (slug, name, sort_order) VALUES
  ('healthtech', 'HealthTech', 1),
  ('edtech',     'EdTech',     2),
  ('cleantech',  'CleanTech',  3),
  ('fintech',    'FinTech',    4),
  ('other',      'Other',      5)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Stages  (desktop uses Idea/Prototype/Early Traction; mobile shows Seed/Pre-seed)
-- ---------------------------------------------------------------------------
INSERT INTO stages (slug, name, sort_order) VALUES
  ('idea',           'Idea',           1),
  ('prototype',      'Prototype',      2),
  ('early-traction', 'Early Traction', 3),
  ('pre-seed',       'Pre-seed',       4),
  ('seed',           'Seed',           5)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Listing types
-- ---------------------------------------------------------------------------
INSERT INTO listing_types (slug, name, sort_order) VALUES
  ('full-time',  'Full-time',      1),
  ('part-time',  'Part-time',      2),
  ('contract',   'Contract',       3),
  ('internship', 'Internship',     4),
  ('collab',     'Collab / No Pay',5)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Contract types
-- ---------------------------------------------------------------------------
INSERT INTO contract_types (slug, name, sort_order) VALUES
  ('no-pay',        'Collaboration / No Pay', 1),
  ('paid-freelance','Paid Freelance',         2),
  ('equity',        'Equity / Revenue Share', 3),
  ('part-time-paid','Part-time paid',         4),
  -- Offered on Post a Job. See migrations/003_job_contract_types.sql.
  ('paid-academic-credit', 'Paid Work / Academic Credit',              5),
  ('equity-cofounder',     'Equity / Revenue Share / Co-founder Role', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Compliance & Documents checklist
--
-- The fourteen categories from /reference/mast ui/Compliance & Docs.
-- See migrations/006_compliance_documents.sql.
-- ---------------------------------------------------------------------------
INSERT INTO document_categories (slug, name, description, tier, accepted_types, sort_order) VALUES
  ('pitch-deck',                'Pitch Deck',                                       NULL, 'core',        'pdf',      1),
  ('incubation-agreement',      'Incubation Agreement',                             NULL, 'core',        'pdf',      2),
  ('dpiit-recognition',         'DPIIT Recognition Certificate',
     'Department for Promotion of Industry and Internal Trade',                           'core',        'pdf',      3),
  ('certificate-incorporation', 'Certificate of Incorporation',                     NULL, 'core',        'pdf',      4),
  ('gst-registration',          'GST Registration Certificate',                     NULL, 'core',        'pdf',      5),
  ('business-pan',              'Business PAN Card',                                NULL, 'core',        'pdf',      6),
  ('founders-agreement',        'Founders'' Agreement',                             NULL, 'recommended', 'pdf',      7),
  ('moa-aoa',                   'Memorandum & Articles of Association (MoA & AoA)', NULL, 'recommended', 'pdf',      8),
  ('shareholders-agreement',    'Shareholders'' Agreement',                         NULL, 'recommended', 'pdf',      9),
  ('ip-trademark',              'IP & Trademark Documents',                         NULL, 'recommended', 'pdf,zip', 10),
  ('funding-agreements',        'Funding Agreements / Term Sheets',                 NULL, 'recommended', 'pdf',     11),
  ('udyam-msme',                'Udyam / MSME Registration',                        NULL, 'recommended', 'pdf',     12),
  ('business-licences',         'Business Licences & Regulatory Approvals',         NULL, 'recommended', 'pdf,zip', 13),
  ('bank-proof',                'Bank Proof / Cancelled Cheque',                    NULL, 'recommended', 'pdf',     14)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description), tier = VALUES(tier),
  accepted_types = VALUES(accepted_types), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Mentorship areas
--
-- The ten options the alumni mentorship form offered, ordered by how many
-- alumni chose each. See migrations/005_alumni_mentors.sql.
-- ---------------------------------------------------------------------------
INSERT INTO mentorship_areas (slug, name, sort_order) VALUES
  ('design-creative',         'Design & Creative',             1),
  ('business-strategy',       'Business & Strategy',           2),
  ('career-development',      'Career & Personal Development', 3),
  ('marketing-growth',        'Marketing & Growth',            4),
  ('product-technology',      'Product & Technology',          5),
  ('sales-bizdev',            'Sales & Business Development',  6),
  ('hr-culture',              'HR & Culture',                  7),
  ('finance-fundraising',     'Finance & Fundraising',         8),
  ('operations-supply-chain', 'Operations & Supply Chain',     9),
  ('sector-specific',         'Sector-specific',              10)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Mentor types
-- ---------------------------------------------------------------------------
INSERT INTO mentor_types (slug, name, sort_order) VALUES
  ('faculty',  'Faculty Mentor',  1),
  ('alumni',   'Alumni Mentor',   2),
  ('industry', 'Industry Mentor', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Readiness checklist  (drives the Startup Readiness ring)
-- ---------------------------------------------------------------------------
INSERT INTO readiness_items (slug, name, hint, sort_order) VALUES
  ('pitch-deck', 'Pitch Deck or Concept Note',
   'Deck link, or a brief concept note if you don''t have one yet', 1),
  ('demo',       'Product Demo / Link',
   'Live demo, prototype, or tester Figma link', 2),
  ('assets',     'Product Assets',
   'Designs, repo, or any supporting material', 3),
  ('personnel',  'Key Personnel',
   'Who is on the founding team and what they own', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name), hint = VALUES(hint), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- Skills  (shared by students, listings and mentors)
-- ---------------------------------------------------------------------------
INSERT INTO skills (slug, name, category) VALUES
  ('ui-ux',            'UI/UX',                'Design'),
  ('ui-ux-design',     'UI/UX Design',         'Design'),
  ('ui-design',        'UI Design',            'Design'),
  ('figma',            'Figma',                'Design'),
  ('branding',         'Branding',             'Design'),
  ('identity',         'Identity',             'Design'),
  ('design',           'Design',               'Design'),
  ('mobile',           'Mobile',               'Design'),
  ('prototyping',      'Prototyping',          'Design'),
  ('user-research',    'User Research',        'Design'),
  ('ux-research',      'UX Research',          'Design'),
  ('react',            'React',                'Tech'),
  ('typescript',       'TypeScript',           'Tech'),
  ('nodejs',           'Node.js',              'Tech'),
  ('python',           'Python',               'Tech'),
  ('ml',               'ML',                   'Tech'),
  ('sql',              'SQL',                  'Tech'),
  ('testing',          'Testing',              'Tech'),
  ('backend-architecture','Backend Architecture','Tech'),
  ('cloud-infra',      'Cloud Infra',          'Tech'),
  ('gtm',              'GTM',                  'Business'),
  ('gtm-strategy',     'GTM Strategy',         'Business'),
  ('content',          'Content',              'Business'),
  ('marketing',        'Marketing',            'Business'),
  ('analytics',        'Analytics',            'Business'),
  ('growth',           'Growth',               'Business'),
  ('fundraising',      'Fundraising',          'Business'),
  ('product-strategy', 'Product Strategy',     'Business'),
  ('legal-compliance', 'Legal & Compliance',   'Business'),
  ('ip-strategy',      'IP Strategy',          'Business')
ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category);

-- ---------------------------------------------------------------------------
-- Platform settings  (the Backend Manager settings screen)
-- setting_value is only seeded on first insert — re-running never overwrites a
-- value an administrator has changed.
-- ---------------------------------------------------------------------------
INSERT INTO platform_settings (setting_key, setting_value, value_type, group_key, label, description) VALUES
  ('platform_name',        'ATLAS Forge',                 'string',  'general',
   'Platform Name',                    'Shown across the platform and in all notifications.'),
  ('university_name',      'ATLAS SkillTech University',  'string',  'general',
   'University',                       'The institution this platform belongs to.'),
  ('v1_mode',              'true',                        'boolean', 'general',
   'V1 Mode (Internal Only)',          'Restricts the platform to internal users.'),
  ('student_self_registration','false',                   'boolean', 'access',
   'Student Self-Registration',        'Disabled — App ID required.'),
  ('founder_auto_approval','false',                       'boolean', 'access',
   'Founder Access Auto-Approval',     'Disabled — Manual by Forge Manager.'),
  ('external_access_v2',   'false',                       'boolean', 'access',
   'External Access (V2)',             'Opens the platform beyond the university.'),
  ('job_listings_require_approval','true',                'boolean', 'moderation',
   'Job Listings require approval',    'Listings go to the Forge Manager before going live.'),
  ('collab_posts_require_approval','true',                'boolean', 'moderation',
   'Collab Posts require approval',    'Collab posts go to the Forge Manager before going live.'),
  ('contact_log_auto_cc',  'true',                        'boolean', 'moderation',
   'Contact Log auto-CC',              'Forge Manager is CC''d on every Service outreach.')
ON DUPLICATE KEY UPDATE
  label = VALUES(label), description = VALUES(description),
  value_type = VALUES(value_type), group_key = VALUES(group_key);
