import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Sidebar/{ForgeManager,BackendManager}.png
 *
 * Small violet count pill used for pending-work indicators in navigation.
 */
export default function Badge({ count, max = 99, className, ...props }) {
  const value = Number(count)
  if (!value || value <= 0) return null

  return (
    <span
      className={cn(
        'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5',
        'bg-primary-500 text-[10px] font-bold text-white tabular-nums',
        className
      )}
      {...props}
    >
      {value > max ? `${max}+` : value}
    </span>
  )
}
