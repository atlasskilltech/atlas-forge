'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * "Still have questions? Let's break it down."
 *
 * Reference: /reference/landing-page/Forge Landing - 5.png, FAQS block.
 *
 * NOTE ON COPY. The reference draws all eleven rows collapsed, so it supplies
 * the questions and the ⊕ affordance but no answers. A ⊕ that opens nothing is
 * not a design worth reproducing, so each answer below is assembled ONLY from
 * statements the same page already makes — the 4–6 month duration from the
 * pink band, the facilities from the Infrastructure panels, the process from
 * "How to Join Forge", Concierge from its own block. No new claim is made
 * about the programme here.
 */
const FAQS = [
  {
    question: 'What is ATLAS Forge?',
    answer:
      'ATLAS Forge is a design-led incubation programme and product incubation centre at ATLAS SkillTech University in Mumbai. It equips early-stage founders with the tools, mentors, facilities and community needed to move from an idea to a product people genuinely love.',
  },
  {
    question: 'What support does ATLAS Forge provides?',
    answer:
      'Founders get access to mentors, resources and a 10,000 sq ft facility across two floors, plus design, business, engineering and law expertise from the university’s four schools — ISDI, ISME, uGDX and LAW. Forge also coordinates sourcing, expert advice, product testing and production partners.',
  },
  {
    question: 'Is the incubation programme free?',
    answer:
      'Selected founders join the incubation programme itself. Atlas Concierge — the design and consultancy service delivered by students and quality-checked by faculty — is a separate paid service for outside clients.',
  },
  {
    question: 'Does ATLAS Forge take equity?',
    answer:
      'Equity is not part of the application. Anything of that nature is discussed directly with the ATLAS Forge team before onboarding, and nothing is agreed without a conversation first.',
  },
  {
    question: 'Do you provide funding or help founders raise funds?',
    answer:
      'Forge connects founders with investors, industry experts and opportunities that can take a venture forward, and helps prepare the proof, partners and funding path needed to take a product to market.',
  },
  {
    question: 'What facilities and infrastructure can I access?',
    answer:
      'The 3D Printing Farm (30+ printers), the Creative Studio (90 sewing machines, 80+ dress forms, two creator studios), the Maker Space (50+ workstations, AR/VR immersive lab and fab lab) and the Clay Studio & Textiles Innovation Lab — 10,000 sq ft across two floors in BKC, Mumbai.',
  },
  {
    question: 'Do I need a finished product to apply?',
    answer:
      'No. The journey starts at Define — the problem, the user and one clear reason to build — and moves through Prototype, Produce, Validate, Launch and Grow. Just show us what you are building.',
  },
  {
    question: 'What does the incubation journey look like?',
    answer:
      'Six stages: Define the problem, Prototype a working model you can see and hold, Produce something reliable and repeatable, Validate by setting up the company and meeting legal requirements, Launch with brand, packaging and a market plan, and Grow using proof, partners and funding.',
  },
  {
    question: 'How long does the programme take?',
    answer:
      'Four to six months on average, from initial concept to a market-ready product.',
  },
  {
    question: 'Can ATLAS Forge help me manufacture my product?',
    answer:
      'Yes. Forge covers design for production, procurement partners for materials and components, testing and certification with Maharashtra agencies, and specialist advisers for materials, processes and industry needs — with one team guiding the move to market.',
  },
  {
    question: 'How do I apply, and what happens after I apply?',
    answer:
      'Apply through the ATLAS Forge Incubation Application. The team reviews applications and generally responds with a decision or next step within one week. Selected applicants may be invited for a conversation, review or pitch before final onboarding.',
  },
]

export default function FaqSection() {
  // One at a time — the reference shows a single-column stack of closed rows,
  // and keeping one open means the list never grows taller than the screen.
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section className="bg-forge-bg py-20 lg:py-28" aria-labelledby="faq-heading">
      <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-20 lg:px-10">
        <div>
          <p className="text-[11px] leading-none font-medium tracking-[0.28em] text-forge-purple uppercase">
            FAQs
          </p>
          <h2
            id="faq-heading"
            className="mt-7 text-[34px] leading-[1.14] font-bold tracking-[-0.02em] text-forge-ink lg:text-[40px]"
          >
            Still have questions?
            <br />
            Let&rsquo;s break it down.
          </h2>
        </div>

        <ul className="flex flex-col gap-3">
          {FAQS.map((faq, index) => {
            const open = openIndex === index
            return (
              <li
                key={faq.question}
                className="rounded-[10px] bg-white px-6 py-5 shadow-[0_2px_14px_-6px_rgb(26_20_80/0.16)] lg:px-8"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : index)}
                    aria-expanded={open}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-6 text-left"
                  >
                    <span className="text-[16px] leading-[22px] font-bold text-forge-ink lg:text-[17px]">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'shrink-0 text-forge-ink transition-transform duration-200',
                        open && 'rotate-45'
                      )}
                    >
                      <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor">
                        <circle cx="10" cy="10" r="8.4" strokeWidth="1.1" />
                        <path d="M10 6.2v7.6M6.2 10h7.6" strokeWidth="1.1" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>

                {/* The hairline under each question is part of the closed state
                    in the reference, so it stays whether or not the row is open. */}
                <div className="mt-4 border-t border-[#dcdbe8]" />

                <div id={`faq-answer-${index}`} hidden={!open}>
                  <p className="pt-4 text-[14px] leading-[22px] text-[#4b4a63]">{faq.answer}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
