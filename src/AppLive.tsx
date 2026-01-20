import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/shared/hooks/useAuth'
import { TabletLogin } from '@/live/pages/TabletLogin'
import { TabletDateSelect } from '@/live/pages/TabletDateSelect'
import { TabletLive } from '@/live/pages/TabletLive'
import { PWAUpdatePrompt } from '@/components/pwa/PWAUpdatePrompt'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { Toaster } from 'sonner'

function TabletAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <TabletLogin />
  }

  return <>{children}</>
}

function AppLive() {
  return (
    <>
      <OfflineIndicator />
      <BrowserRouter>
        <TabletAuthGuard>
          <Routes>
            <Route path="/" element={<TabletDateSelect />} />
            <Route path="/live" element={<TabletLive />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TabletAuthGuard>
      </BrowserRouter>
      <InstallPrompt />
      <PWAUpdatePrompt />
      <Toaster position="top-center" duration={2000} />
    </>
  )
}

export default AppLive
