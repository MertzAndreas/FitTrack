import { PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'

/**
 * Desktop-only control for collapsing the sidebar to its icon rail.
 * Hidden on mobile, where navigation lives in the bottom bar.
 */
export function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar()
  const isOpen = state === 'expanded'

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleSidebar}
      className="max-md:hidden"
      aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      aria-expanded={isOpen}
      title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <PanelLeft />
    </Button>
  )
}
