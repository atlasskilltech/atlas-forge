import { cn, initials as toInitials } from '@/lib/utils'

/**
 * Reference: /reference/components/Card/{Student,UserRow-1}.png,
 *            /reference/mast ui/Login/Role Select.png (tinted role monograms).
 *
 * Monogram avatar with a solid or tinted fill. Images are intentionally not
 * supported yet — every reference uses initials.
 */

const TONES = {
  solid: {
    primary: 'bg-primary-500 text-white',
    success: 'bg-success-fill text-white',
    warning: 'bg-warning-fill text-white',
    danger: 'bg-danger-fill text-white',
    neutral: 'bg-muted-fill text-white',
    dark: 'bg-navy-900 text-white',
  },
  soft: {
    primary: 'bg-primary-100 text-primary-text',
    success: 'bg-success-fill/12 text-success',
    warning: 'bg-warning-fill/12 text-warning',
    danger: 'bg-danger-fill/10 text-danger',
    neutral: 'bg-neutral-fill/10 text-neutral',
    dark: 'bg-navy-900/10 text-navy-900',
  },
}

const SIZES = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-[11px]',
  md: 'size-10 text-[13px]',
  lg: 'size-11 text-sm',
  xl: 'size-12 text-base',
}

/**
 * @param {object} props
 * @param {string} [props.name]      Full name, converted to a two-letter monogram.
 * @param {string} [props.initials]  Explicit monogram, overrides `name`.
 * @param {'solid'|'soft'} [props.variant]
 * @param {'primary'|'success'|'warning'|'danger'|'neutral'|'dark'} [props.tone]
 * @param {'circle'|'square'} [props.shape]
 */
export default function Avatar({
  name = '',
  initials,
  variant = 'solid',
  tone = 'primary',
  shape = 'circle',
  size = 'md',
  className,
  ...props
}) {
  const label = initials ?? toInitials(name)

  return (
    <span
      // Decorative when a readable name sits next to it in the same row.
      role="img"
      aria-label={name ? `${name} avatar` : undefined}
      aria-hidden={name ? undefined : 'true'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold uppercase select-none',
        shape === 'circle' ? 'rounded-full' : 'rounded-tile',
        TONES[variant][tone],
        SIZES[size],
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}
