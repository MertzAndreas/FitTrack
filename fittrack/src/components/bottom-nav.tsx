import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { tabs } from '@/nav'

export function BottomNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex border-t bg-background pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )
          }
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
