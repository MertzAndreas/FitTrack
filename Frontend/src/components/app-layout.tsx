import { Outlet } from 'react-router'
import PWABadge from '@/PWABadge'
import { AppSidebar } from '@/components/app-sidebar'
import { BottomNav } from '@/components/bottom-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="hidden items-center gap-2 border-b border-border p-2 md:flex">
          <div className="px-2 text-lg font-heading">FitTrack</div>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 pb-20 md:pb-4">
          <Outlet />
        </main>
        <BottomNav />
      </SidebarInset>
      <PWABadge />
    </SidebarProvider>
  )
}
