import { Dumbbell, Settings, TrendingUp, UtensilsCrossed } from 'lucide-react'

export type NavItem = {
  title: string
  to: string
  icon: typeof Dumbbell
}

export const navItems: NavItem[] = [
  { title: 'Overview', to: '/', icon: Dumbbell },
  { title: 'Meals', to: '/meals', icon: UtensilsCrossed },
  { title: 'Weight', to: '/weight', icon: TrendingUp },
  { title: 'Settings', to: '/settings', icon: Settings },
]
