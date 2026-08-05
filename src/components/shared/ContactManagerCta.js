'use client'

import { useState } from 'react'
import { Button, ConfirmDialog, FormField, Modal } from '@/components/ui'

/**
 * Reference: dark CTA strip on /reference/mast ui/Student/My Profile.png (60px,
 * #1E2235) plus the /reference/mast ui/Overlay/Contact Forge Manager.png form.
 *
 * Shared by every role that can message the Forge Manager.
 */
export default function ContactManagerCta() {
  const [formOpen, setFormOpen] = useState(false)
  const [sent, setSent] = useState(false)

  function handleSend(event) {
    event.preventDefault()
    setFormOpen(false)
    setSent(true)
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-card bg-navy-900 px-5 py-4 sm:h-[60px] sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <p className="text-sm text-white">
          Need help or have a question? Reach out to Mihir Pawar directly.
        </p>
        <Button onClick={() => setFormOpen(true)} className="shrink-0">
          Contact Forge Manager
        </Button>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        showClose
        title="Contact Forge Manager"
        description="Message Mihir Pawar. He typically replies within a day."
      >
        <form onSubmit={handleSend} className="mt-6 space-y-5">
          <FormField
            label="Subject"
            name="subject"
            placeholder="What is this about?"
            required
            requiredMark={false}
          />
          <FormField
            label="Message"
            name="message"
            as="textarea"
            rows={4}
            placeholder="Share the details — include your startup or App ID if relevant"
            required
            requiredMark={false}
          />
          <Button type="submit" fullWidth className="h-12">
            Send Message
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={sent}
        onClose={() => setSent(false)}
        title="Message Sent!"
        description="Mihir Pawar has received your message and typically replies within a day."
      />
    </>
  )
}
