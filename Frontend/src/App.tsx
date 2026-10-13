import { BrowserRouter, Route, Routes } from 'react-router'
import { AppLayout } from '@/components/app-layout'
import { OverviewPage } from '@/pages/overview'
import { MealsPage } from '@/pages/meals'
import { WeightPage } from '@/pages/weight'
import { SettingsPage } from '@/pages/settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="meals" element={<MealsPage />} />
          <Route path="weight" element={<WeightPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
