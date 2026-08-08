'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ActionDialog,
  Button,
  Card,
  ConfirmDialog,
  FormField,
  Modal,
  SectionLabel,
  Toggle,
} from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/BM/Platform Settings.png
 *            /reference/mast phone ui/BM/Platform Settings.png
 *            /reference/mast ui/Overlay/Edit Platform Name.png
 *            /reference/mast ui/Overlay/BM Platform Settings Reset {Confirm,Complete}.png
 *
 * Note: the mobile frame draws each switch as an outline ring rather than the
 * pill switch used on desktop for the same settings. The pill Toggle is used at
 * both sizes — a ring reads as decoration, not a control.
 */
export default function PlatformSettings({ groups: settingsGroups = [], mobile: mobileSettings = [] }) {
  const router = useRouter()

  const initial = Object.fromEntries(
    settingsGroups.flatMap((group) =>
      group.items.filter((item) => item.control === 'toggle').map((item) => [item.id, item.on])
    )
  )

  const [values, setValues] = useState(initial)
  const [platformName, setPlatformName] = useState(
    settingsGroups.flatMap((group) => group.items).find((item) => item.id === 'platform_name')
      ?.value ?? ''
  )
  const [nameOpen, setNameOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  /**
   * A switch writes straight away — the reference gives this screen no Save
   * button. If the request fails the switch returns to where it was rather
   * than showing a state the platform does not hold.
   */
  async function set(id, next) {
    const previous = values[id]
    setValues((prev) => ({ ...prev, [id]: next }))
    try {
      await api.patch('/api/backend/settings', { key: id, value: next })
      startTransition(() => router.refresh())
    } catch {
      setValues((prev) => ({ ...prev, [id]: previous }))
    }
  }

  async function saveName(event) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('platformName') ?? '').trim()
    if (!value) return

    const previous = platformName
    setPlatformName(value)
    setNameOpen(false)
    try {
      await api.patch('/api/backend/settings', { key: 'platform_name', value })
      startTransition(() => router.refresh())
    } catch {
      setPlatformName(previous)
    }
  }

  async function resetPlatform() {
    setBusy(true)
    try {
      await api.post('/api/backend/reset', { confirm: 'RESET' })
      setResetOpen(false)
      setResetDone(true)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* ---- Desktop: grouped settings ----------------------------------- */}
      <div className="hidden lg:block">
        {settingsGroups.map((group) => (
          <section key={group.label} className="mt-5 first:mt-0">
            <SectionLabel>{group.label}</SectionLabel>
            <Card padding="none" className="mt-3">
              <ul>
                {group.items.map((item, index) => (
                  <li
                    key={item.id}
                    className={
                      index < group.items.length - 1
                        ? 'flex items-center gap-4 border-b border-line px-6 py-4'
                        : 'flex items-center gap-4 px-6 py-4'
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {item.id === 'platform_name' ? platformName : item.detail}
                      </p>
                    </div>
                    {item.control === 'toggle' ? (
                      <Toggle
                        checked={values[item.id]}
                        onChange={(next) => set(item.id, next)}
                        label={item.title}
                      />
                    ) : null}
                    {item.control === 'edit' ? (
                      <Button
                        variant="subtle"
                        size="sm"
                        className="border-0 bg-canvas"
                        onClick={() => setNameOpen(true)}
                      >
                        Edit
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}

        <section className="mt-5">
          <SectionLabel>Danger Zone</SectionLabel>
          <Card padding="lg" className="mt-3 flex items-center gap-4 px-6 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-ink">Reset Platform Data</p>
              <p className="mt-0.5 text-[13px] text-muted">
                Clears all non-user data. User accounts and roles are not affected.
              </p>
            </div>
            <Button variant="danger" size="lg" onClick={() => setResetOpen(true)}>
              Reset Platform
            </Button>
          </Card>
        </section>
      </div>

      {/* ---- Mobile: flat setting cards ---------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {mobileSettings.map((item) => (
          <li key={item.id}>
            <Card padding="lg" className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{item.detail}</p>
              </div>
              <Toggle
                checked={values[item.id] ?? item.on}
                onChange={(next) => set(item.id, next)}
                label={item.title}
              />
            </Card>
          </li>
        ))}
      </ul>

      <Modal
        open={nameOpen}
        onClose={() => setNameOpen(false)}
        size="lg"
        title="Edit Platform Name"
        description="Shown across the platform and in all notifications."
        className="lg:max-w-[490px]"
      >
        <form onSubmit={saveName} className="mt-5">
          <FormField
            label=""
            name="platformName"
            defaultValue={platformName}
            aria-label="Platform name"
          />
          <div className="mt-4 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-11 flex-[2]"
              onClick={() => setNameOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 flex-[3]">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ActionDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        tone="danger"
        title="Reset Platform Data?"
        description="This clears all non-user data across the platform — job listings, applications, contact logs, and activity records. User accounts and roles are not affected. This cannot be undone."
        confirmLabel="Yes, Reset Platform"
        confirmDisabled={busy}
        onConfirm={resetPlatform}
      />

      <ConfirmDialog
        open={resetDone}
        onClose={() => setResetDone(false)}
        title="Platform Reset Complete"
        description="All non-user data has been cleared. User accounts and roles are unchanged."
      />
    </>
  )
}
