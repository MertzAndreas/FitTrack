// main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import { ApiError } from './lib/api'
import App from './App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Weight from './pages/Weight.tsx'
import Trends from './pages/Trends.tsx'
import Settings from './pages/Settings.tsx'
import { Toaster } from './components/ui/toast.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'weight', element: <Weight /> },
      { path: 'trends', element: <Trends /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status < 500) && failureCount < 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
