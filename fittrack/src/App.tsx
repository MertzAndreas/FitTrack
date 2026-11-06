import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { BottomNav } from '@/components/bottom-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ThemeProvider } from './components/theme-provider'

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
        </SidebarInset>
        <BottomNav className="md:hidden" />
      </SidebarProvider>
    </ThemeProvider>
  )
}
