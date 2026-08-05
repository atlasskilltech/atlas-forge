import Image from 'next/image'
import { brand, siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

/**
 * The three brand marks, with their true intrinsic dimensions.
 *
 * Passing the real pixel size and sizing only via CSS (`h-* w-auto`) keeps the
 * declared aspect ratio identical to the file's — a mismatch makes next/image
 * warn that one dimension was modified without the other.
 */
const MARKS = {
  forge: { src: brand.forgeLogo, width: 277, height: 77, alt: siteConfig.name },
  university: {
    src: brand.universityLogo,
    width: 135,
    height: 77,
    alt: siteConfig.university,
  },
  universityWhite: {
    src: brand.universityLogoWhite,
    width: 133,
    height: 77,
    alt: siteConfig.university,
  },
}

/**
 * @param {object} props
 * @param {'forge'|'university'|'universityWhite'} props.mark
 * @param {string} props.className  Height utility plus `w-auto`.
 */
export default function BrandLogo({ mark, className, priority = false, ...props }) {
  const config = MARKS[mark]

  return (
    <Image
      src={config.src}
      alt={config.alt}
      width={config.width}
      height={config.height}
      priority={priority}
      className={cn('w-auto', className)}
      {...props}
    />
  )
}
