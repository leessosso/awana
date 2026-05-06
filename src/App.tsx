import { Outlet, useLocation } from 'react-router-dom'

import './styles/global.css'

import { Navigation } from './components/layout/Navigation'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from './components/ui'
import AuthGuard from './components/auth/AuthGuard'
import { useAuthStore } from './store/authStore'

// 인증이 필요하지 않은 경로들
const PUBLIC_ROUTES = ['/login', '/signup']

function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname)

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col">
        {isAuthenticated && !isPublicRoute && <Navigation />}
        <main className="container mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-[1280px] flex-1 pb-4">
          {isPublicRoute ? (
            <Outlet />
          ) : (
            <AuthGuard>
              <Outlet />
            </AuthGuard>
          )}
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App
