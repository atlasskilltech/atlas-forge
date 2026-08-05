import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge conditional class names while letting later Tailwind utilities win.
 * Every component funnels its `className` prop through this so consumers can
 * always override internal styling without specificity hacks.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Build the two-letter monogram used by avatars across the platform
 * (e.g. "Riya Kapoor" -> "RK", "NovaMed" -> "NO").
 */
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
