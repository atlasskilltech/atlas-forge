import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Progress/CircularStage.png (140x140)
 *
 * Thick-stroke SVG donut with a centred caption. Drawn with SVG rather than
 * a CSS conic-gradient so the arc stays crisp at every density and the value
 * remains announceable to assistive tech.
 */
export default function ProgressRing({
  value = 0,
  label,
  caption,
  size = 140,
  thickness = 18,
  tone = 'var(--color-primary-500)',
  className,
  ...props
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progress'}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={thickness}
        />
        {clamped > 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
          />
        ) : null}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {label ? (
          <span className="text-[13px] font-semibold text-ink">{label}</span>
        ) : null}
        {caption ? (
          <span className="mt-0.5 text-[11px] text-muted">{caption}</span>
        ) : null}
      </div>
    </div>
  )
}
