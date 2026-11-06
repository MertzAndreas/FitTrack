import { Link, useLocation } from 'react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { tabs } from '@/nav'
import { ModeToggle } from './mode-toggle'

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3 text-lg font-semibold group-data-[collapsible=icon]:hidden">
        FitTrack
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton
                    render={<Link to={to} />}
                    tooltip={label}
                    isActive={to === '/' ? pathname === '/' : pathname.startsWith(to)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ModeToggle />
        <SidebarTrigger />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
