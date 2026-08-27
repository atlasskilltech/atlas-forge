import 'server-only'

/**
 * Service barrel. Route handlers, Server Actions and pages import from here so
 * no caller ever reaches past the service layer into a repository or raw SQL.
 */
export * as authService from './auth.service'
export * as rateLimitService from './rate-limit.service'
export * as lookupsService from './lookups.service'
export * as studentsService from './students.service'
export * as startupsService from './startups.service'
export * as listingsService from './listings.service'
export * as applicationsService from './applications.service'
export * as conciergeService from './concierge.service'
export * as mentorshipService from './mentorship.service'
export * as incubationService from './incubation.service'
export * as documentsService from './documents.service'
export * as platformService from './platform.service'
