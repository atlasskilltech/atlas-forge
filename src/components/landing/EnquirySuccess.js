'use client'

/**
 * What a sheet shows after a successful send.
 *
 * The reference has no success frame — it draws the two forms and their fields
 * and stops. So this borrows the forms' own vocabulary rather than inventing a
 * new one: the same two-tone display heading, the same body tone, the same
 * button shape, just with the fields gone. Nothing here restates copy the
 * reference does provide.
 */
export default function EnquirySuccess({ titleId, heading, accent, message, onClose }) {
  return (
    <div className="py-4 sm:py-8">
      <h2
        id={titleId}
        className="text-[32px] leading-[0.96] font-bold tracking-[-0.02em] text-forge-ink sm:text-[38px] lg:text-[42px]"
      >
        {heading}
        <br />
        <span className="text-forge-pink">{accent}</span>
      </h2>

      <p className="mt-4 max-w-[560px] text-[13.5px] leading-[21px] text-[#4b4a63]">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="mt-6 inline-flex h-[46px] min-w-[176px] items-center justify-center rounded-[8px] bg-[#3d3a8c] px-7 text-[12px] font-semibold tracking-[0.11em] text-white uppercase transition-colors duration-150 hover:bg-forge-ink"
      >
        Close
      </button>
    </div>
  )
}
