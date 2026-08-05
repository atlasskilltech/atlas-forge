import { Banner } from '@/components/ui'
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
 * @param {boolean} [props.viewOnlyBanner] Defaults to the role's view-only flag.
 * @param {boolean} [props.padded]        Set false for screens that manage their own padding.
 */
export default function AppShell({
  role,
  children,
  mobileTitle,
  backHref,
  viewOnlyBanner,
  padded = true,
  className,
}) {
  const roleConfig = getRole(role)
  const showBanner = viewOnlyBanner ?? Boolean(roleConfig?.viewOnly)

  return (
    <div className="min-h-dvh bg-canvas">
      <Navbar role={role} />
      <Sidebar role={role} />
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
          {showBanner ? (
            <Banner icon="👁" className="mb-4 lg:mb-5">
              You are in view-only mode. No actions can be taken from this account.
            </Banner>
          ) : null}
          {children}
        </div>
      </main>

      <BottomNav role={role} />
    </div>
  )
}
