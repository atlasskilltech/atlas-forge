import { cn, initials as toInitials } from '@/lib/utils'

/**
 * Reference: /reference/components/Card/{Student,UserRow-1}.png,
 *            /reference/mast ui/Login/Role Select.png (tinted role monograms).
 *
 * Monogram avatar with a solid or tinted fill. Passing `src` puts an uploaded
 * image in the same tile — same size, same shape, same place in the layout —
 * and everything without one keeps the monogram, which is still what the
 * references draw and what every user and startup without a logo shows.
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
 * @param {string} [props.src]       Uploaded image; replaces the monogram.
 * @param {'solid'|'soft'} [props.variant]
 * @param {'primary'|'success'|'warning'|'danger'|'neutral'|'dark'} [props.tone]
 * @param {'circle'|'square'} [props.shape]
 */
export default function Avatar({
  name = '',
  initials,
  src,
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
        // The tinted fill would show through a logo's transparent corners, so
        // an image tile carries no tone of its own.
        src ? 'overflow-hidden bg-surface' : TONES[variant][tone],
        SIZES[size],
        className
      )}
      {...props}
    >
      {src ? (
        /*
         * A plain <img>, not next/image: the source is a user upload behind a
         * Route Handler rather than a build-time asset, the tile is never
         * larger than 64px so there is nothing to gain from resizing, and it
         * keeps the deployment free of the optimiser's sharp dependency.
         */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          // `contain` so a wide or tall logo is shown whole rather than cropped
          // to the square the monogram occupies.
          className="size-full object-contain"
          loading="lazy"
          decoding="async"
        />
      ) : (
        label
      )}
    </span>
  )
}
