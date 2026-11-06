import { LayoutDashboard, Scale, Settings, TrendingUp } from 'lucide-react'

export const tabs = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/weight', label: 'Weight', icon: Scale },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const
