import Link from 'next/link'
import { Banner } from '@/components/ui'
import { SWITCH_ROLE_PATH } from '@/config/navigation'
import { getIdentity } from '@/lib/auth/guard'
import { getRole } from '@/config/roles'
import { cn } from '@/lib/utils'
import BottomNav from './BottomNav'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

/**
 * The single responsive frame every authenticated screen renders inside.
 *
 *   < lg   mobile chrome  — 56px top bar + 83px bottom nav, 16px gutters
 *   >= lg  desktop chrome — 60px navbar + 220px sidebar, 32px gutters
 *
 * Content padding is measured from the references: desktop content starts
 * 32px from the sidebar and 28px below the navbar; mobile starts 16px in and
 * 24px below the top bar.
 *
 * @param {object}  props
 * @param {string}  props.role
 * @param {string}  [props.mobileTitle]   Renders the back-arrow top bar on mobile.
 * @param {string}  [props.backHref]
 * @param {object}  [props.user]          Signed-in identity for the navbar avatar.
 * @param {boolean} [props.viewOnlyBanner] Defaults to the role's view-only flag.
 * @param {boolean} [props.padded]        Set false for screens that manage their own padding.
 */
export default async function AppShell({
  role,
  children,
  mobileTitle,
  backHref,
  user,
  viewOnlyBanner,
  padded = true,
  className,
}) {
  const roleConfig = getRole(role)
  const showBanner = viewOnlyBanner ?? Boolean(roleConfig?.viewOnly)
  // A Backend Manager who has switched to another role keeps a "Switch Role"
  // entry in that role's menu, to change again or return. Nobody else ever
  // gets it (it needs the REAL role, from the database, to be Backend
  // Manager). `getIdentity` is memoised per request, so this is free.
  const identity = await getIdentity().catch(() => null)
  const switched = Boolean(identity?.actingAs)
  const extraGroups = switched
    ? [{ label: 'Backend Manager', items: [{ label: 'Switch Role', href: SWITCH_ROLE_PATH }] }]
    : []

  return (
    <div className="min-h-dvh bg-canvas">
      <Navbar role={role} user={user} />
      <Sidebar role={role} extraGroups={extraGroups} />
      <TopBar role={role} title={mobileTitle} backHref={backHref} />

      <main
        id="main-content"
        className={cn(
          'pt-topbar lg:pl-sidebar lg:pt-navbar',
          // Clear the 83px bottom nav plus the device's home-indicator inset.
          'pb-[calc(83px+env(safe-area-inset-bottom,0px))] lg:pb-0',
          className
        )}
      >
        <div className={cn(padded && 'px-4 pt-6 pb-8 lg:px-8 lg:pt-7')}>
          {switched ? (
            // Mobile has no sidebar: the same entry, as a small link.
            <div className="mb-4 flex justify-end lg:hidden">
              <Link
                href={SWITCH_ROLE_PATH}
                className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-bold text-primary-text"
              >
                Switch Role
              </Link>
            </div>
          ) : null}
          {showBanner ? (
            <Banner icon="👁" className="mb-4 lg:mb-5">
              {/* The mobile frames shorten this copy. */}
              <span className="lg:hidden">View-only — no actions available</span>
              <span className="hidden lg:inline">
                You are in view-only mode. No actions can be taken from this account.
              </span>
            </Banner>
          ) : null}
          {children}
        </div>
      </main>

      <BottomNav role={role} />
    </div>
  )
}
