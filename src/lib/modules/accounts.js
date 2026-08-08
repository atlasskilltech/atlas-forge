/**
 * How an account is described when it holds more than one role.
 *
 * Both manager directories — the Forge Manager's User Accounts and the Backend
 * Manager's All Users — render the same people, so the rule lives here rather
 * than in either module. Left in one of them, the same person could show as a
 * Founder on one screen and a Manager on the other.
 *
 * Precedence is Manager → Founder → Student. A manager who has also founded a
 * startup is administratively a manager: the Managers filter has to show every
 * manager, or it is not a filter, it is a guess.
 *
 * Accounts with no platform role — the mentor records — are their own group
 * rather than being counted as students, which they are not. They appear under
 * "All" and nowhere else, which is the honest answer.
 *
 * Matching is on role *slugs*, never display names: "Founder (Startup)" is
 * copy an administrator can edit, and this decides what the account is.
 */
export function classifyAccount(user) {
  const slugs = user.roleSlugs ?? []
  const names = user.roleNames ?? []

  const managerIndex = slugs.findIndex(
    (slug) => slug.endsWith('-manager') || slug === 'super-admin'
  )
  if (managerIndex >= 0) {
    return { group: 'Managers', role: names[managerIndex] ?? 'Manager', isManager: true }
  }
  if (slugs.includes('founder')) {
    return { group: 'Founders', role: 'Founder Unlocked', isManager: false }
  }
  if (slugs.length === 0) {
    return { group: 'Unassigned', role: 'No role assigned', isManager: false }
  }
  return { group: 'Students', role: 'Student — Standard', isManager: false }
}
