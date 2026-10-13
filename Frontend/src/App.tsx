import PWABadge from './PWABadge.tsx'
import { ThemeToggle } from '@/components/theme-toggle'

function App() {
  return (
    <>
      <header className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-heading">FitTrack</h1>
        <ThemeToggle />
      </header>
      <PWABadge />
    </>
  )
}

export default App
