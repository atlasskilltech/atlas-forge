/**
 * Shared landing-page constants.
 *
 * This module is deliberately free of `server-only` and of any import that
 * reaches the database: the form component in the browser and the validator on
 * the server both read the option list from here, so the two can never drift
 * into a state where the page offers a value the API rejects.
 */

/**
 * The "Service Required" options, in the order the reference dropdown lists
 * them. Reference: /reference/landing-page/Service required drop down.png
 *
 * `value` is what `service_requests.service_required` stores; `label` is what
 * the page renders. Storing the slug means reworded copy never invalidates
 * rows already in the table.
 */
export const SERVICE_OPTIONS = Object.freeze([
  { value: 'branding-ui-ux', label: 'Branding and UI/UX' },
  { value: 'research-projects', label: 'Research projects' },
  { value: '3d-printing', label: '3D printing services' },
  { value: 'animation-motion-graphics', label: 'Animation and motion graphics' },
  { value: 'complete-branding', label: 'Complete branding solutions' },
  { value: 'product-design-engineering', label: 'Product design and engineering' },
  { value: 'rapid-prototyping', label: 'Rapid prototyping' },
  { value: 'manufacturing-sourcing', label: 'Manufacturing and sourcing' },
  { value: 'ip-compliance', label: 'IP and compliance' },
  { value: 'other', label: 'Other services' },
])

export const SERVICE_VALUES = SERVICE_OPTIONS.map((option) => option.value)

/** Where both forms say the enquiry will be sent. Shown in the modal copy. */
export const ENQUIRY_EMAIL = 'contact@atlasforge.in'
