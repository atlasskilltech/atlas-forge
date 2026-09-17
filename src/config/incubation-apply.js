/**
 * The public "Apply for incubation" form on `/`.
 *
 * Imported by both the modal (browser) and the outsider-incubation service
 * (server), so the fields the page draws, the ones it marks required and the
 * ones the server insists on can never drift apart.
 *
 * `slug` is the `readiness_items.slug` each answer is copied to when a Forge
 * Manager approves the application; `field` is the form/API field name, and
 * the table column is its snake_case form. Labels and hints here are only the
 * fallback — the stored `readiness_items` copy wins when the row exists.
 *
 * This list is deliberately the outsider form's own. The Founder form keeps
 * reading every active readiness item, and none of these `required` flags
 * apply to it.
 */
export const INCUBATION_READINESS_FIELDS = Object.freeze([
  {
    field: 'pitchDeck',
    slug: 'pitch-deck',
    label: 'Pitch Deck or Concept Note',
    hint: "Deck link, or a brief concept note if you don't have one yet",
    required: true,
  },
  {
    field: 'productDemo',
    slug: 'demo',
    label: 'Product Demo / Link',
    hint: 'Live demo, prototype, or tester Figma link',
    required: false,
  },
  {
    field: 'productAssets',
    slug: 'assets',
    label: 'Product Assets',
    hint: 'Designs, repo, or any supporting material',
    required: false,
  },
  {
    field: 'keyPersonnel',
    slug: 'personnel',
    label: 'Key Personnel',
    hint: 'Who is on the founding team and what they own',
    required: true,
  },
])

/** Matches `application_readiness.value`, where approval copies each answer. */
export const INCUBATION_READINESS_MAX = 500

/** Column widths of `outsider_incubation_applications`. */
export const INCUBATION_APPLY_LIMITS = Object.freeze({
  fullName: 160,
  email: 190,
  phone: 32,
  startupName: 160,
  tagline: 255,
  problemStatement: 5000,
})
