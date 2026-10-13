import { NavLink, useLocation } from 'react-router'
import { cn } from 'cn'
import { navItems } from '@/lib/nav'

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {navItems.map((item) => {
          const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)

          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2 text-[0.65rem] font-medium tracking-wide uppercase transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  isActive && 'text-primary'
                )}
              >
                <item.icon className="size-5" />
                <span>{item.title}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
