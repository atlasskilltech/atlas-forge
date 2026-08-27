'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Button, Card, Chip, Modal, SectionLabel } from '@/components/ui'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Compliance & Docs/1.png and 2.png
 *
 * One row per category, filled or not. The reference only draws the filled
 * state, so the empty state is built from the same parts rather than a new
 * design: same row height, same typography, same right-hand control column —
 * the filename line becomes a "Not uploaded yet" line, and the Replace and
 * Download pair collapses to a single Upload button.
 *
 * Uploading and replacing are one request. The server supersedes whatever is
 * current in the slot and keeps it as history, so "Replace" is an upload that
 * happens to have something to step aside.
 */
export default function ComplianceDocuments({ rows = [], stats, canManage = true }) {
  const router = useRouter()
  const fileInput = useRef(null)
  const [target, setTarget] = useState(null)
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)
  const [picking, setPicking] = useState(false)
  const [, startTransition] = useTransition()

  /**
   * The header button has no category of its own, so it asks. Row buttons know
   * theirs and go straight to the file picker.
   */
  function chooseCategory() {
    setError(null)
    setPicking(true)
  }

  function pickFileFor(row) {
    setError(null)
    setPicking(false)
    setTarget(row)
    // The input is rendered once and retargeted, so `accept` has to be set
    // before the dialog opens rather than per row.
    if (fileInput.current) {
      fileInput.current.accept = row.accept
      fileInput.current.click()
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !target) return

    const row = target
    setPending(row.categorySlug)
    setError(null)

    const body = new FormData()
    body.append('categorySlug', row.categorySlug)
    body.append('file', file)

    try {
      await api.upload('/api/founder/documents', body)
      startTransition(() => router.refresh())
    } catch (requestError) {
      setError({ categorySlug: row.categorySlug, message: requestError.message })
    } finally {
      setPending(null)
      setTarget(null)
    }
  }

  const missing = rows.filter((row) => !row.document)

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionLabel className="lg:mt-0">
          Document checklist · {rows.length} categories
        </SectionLabel>
        {canManage ? (
          <Button variant="secondary" size="lg" onClick={chooseCategory}>
            Upload document
          </Button>
        ) : null}
      </div>

      {stats ? (
        <p className="mt-2 text-[13px] text-muted">
          {stats.uploaded} of {stats.total} uploaded · {stats.coreUploaded} of{' '}
          {stats.coreTotal} core documents in place
        </p>
      ) : null}

      <Card padding="none" className="mt-3 overflow-hidden lg:mt-[18px]">
        <ul>
          {rows.map((row, index) => (
            <li
              key={row.id}
              className={cn(
                'px-4 py-4 lg:px-6 lg:py-[18px]',
                index > 0 && 'border-t border-line-soft'
              )}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink lg:text-[15px]">{row.name}</p>
                  {row.description ? (
                    <p className="mt-0.5 text-[13px] text-muted">{row.description}</p>
                  ) : null}

                  {row.document ? (
                    <p className="mt-0.5 truncate text-[13px] text-primary-text">
                      {row.document.fileName}
                      {row.document.size ? ` · ${row.document.size}` : ''}
                    </p>
                  ) : (
                    // The empty state. Same line, same position as the filename
                    // in the reference — muted, and saying what is missing
                    // rather than leaving the row looking unfinished.
                    <p className="mt-0.5 text-[13px] text-muted">
                      Not uploaded yet · {row.acceptLabel}
                    </p>
                  )}

                  {error?.categorySlug === row.categorySlug ? (
                    <p role="alert" className="mt-1.5 text-[13px] text-danger">
                      {error.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2.5 lg:shrink-0">
                  <Chip tone={row.isCore ? 'info' : 'skill'} className="uppercase">
                    {row.tier}
                  </Chip>

                  {row.document ? (
                    <>
                      {canManage ? (
                        <Button
                          variant="secondary"
                          size="md"
                          disabled={pending === row.categorySlug}
                          onClick={() => pickFileFor(row)}
                        >
                          {pending === row.categorySlug ? 'Uploading…' : 'Replace'}
                        </Button>
                      ) : null}
                      <Button as="a" href={row.document.downloadHref} size="md" download>
                        Download
                      </Button>
                    </>
                  ) : canManage ? (
                    <Button
                      size="md"
                      disabled={pending === row.categorySlug}
                      onClick={() => pickFileFor(row)}
                    >
                      {pending === row.categorySlug ? 'Uploading…' : 'Upload'}
                    </Button>
                  ) : (
                    <span className="text-[13px] text-muted">Not uploaded</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {/* One input for the whole page, retargeted per row. */}
      <input
        ref={fileInput}
        type="file"
        aria-label="Choose a document to upload"
        onChange={handleFile}
        className="sr-only"
      />

      <Modal
        open={picking}
        onClose={() => setPicking(false)}
        size="lg"
        showClose
        title="Upload document"
        description="Choose which document this is. Uploading to a category that already has a file replaces it, and the previous version is kept."
        className="max-h-[85dvh] overflow-y-auto"
      >
        <ul className="mt-6 space-y-2.5">
          {(missing.length > 0 ? missing : rows).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => pickFileFor(row)}
                className="flex w-full items-center justify-between gap-3 rounded-tile border border-line bg-canvas px-4 py-3 text-left hover:border-primary-500"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-ink">{row.name}</span>
                  <span className="block text-[13px] text-muted">
                    {row.document ? `Replaces ${row.document.fileName}` : row.acceptLabel}
                  </span>
                </span>
                <Chip tone={row.isCore ? 'info' : 'skill'} className="shrink-0 uppercase">
                  {row.tier}
                </Chip>
              </button>
            </li>
          ))}
        </ul>
        {missing.length === 0 ? (
          <p className="mt-4 text-[13px] text-muted">
            Every category has a document. Choosing one replaces what is there.
          </p>
        ) : null}
      </Modal>
    </>
  )
}
