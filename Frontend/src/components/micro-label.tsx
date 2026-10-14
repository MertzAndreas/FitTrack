import { cn } from 'cn'
import type { ElementType, ReactNode } from 'react'

type MicroLabelProps = {
  /** The element to render; defaults to a span. */
  as?: ElementType
  /** Size/weight variant, matching the sites it replaced. */
  size?: 'xs' | 'sm' | 'base' | 'hint'
  className?: string
  children: ReactNode
}

/**
 * The small, uppercase, muted "eyebrow" label used above fields and section
 * headings. The size variants exist because the original call sites genuinely
 * differed; keep them rather than silently normalising the visual weight.
 */
const sizes = {
  xs: 'text-[0.6rem] font-semibold',
  sm: 'text-[0.65rem] font-semibold',
  base: 'text-xs font-semibold',
  hint: 'text-[0.65rem]',
} as const

export function MicroLabel({
  as: Tag = 'span',
  size = 'sm',
  className,
  children,
}: MicroLabelProps) {
  return (
    <Tag
      className={cn(
        'tracking-widest text-muted-foreground uppercase',
        sizes[size],
        className,
      )}
    >
      {children}
    </Tag>
  )
}
