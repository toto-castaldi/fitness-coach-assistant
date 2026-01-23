import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Layout } from '@/components/Layout'
import { Clients } from '@/pages/Clients'
import { ClientDetail } from '@/pages/ClientDetail'
import { Gyms } from '@/pages/Gyms'
import { Exercises } from '@/pages/Exercises'
import { ExerciseDetail } from '@/pages/ExerciseDetail'
import { Sessions } from '@/pages/Sessions'
import { SessionDetail } from '@/pages/SessionDetail'
import { LiveCoaching } from '@/pages/LiveCoaching'
import { Settings } from '@/pages/Settings'
import { Repositories } from '@/pages/Repositories'
import { OAuthConsent } from '@/pages/OAuthConsent'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { PWAUpdatePrompt } from '@/components/pwa/PWAUpdatePrompt'
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <OfflineIndicator />
      <BrowserRouter>
        <Routes>
          {/* OAuth consent page - outside AuthGuard to handle its own auth */}
          <Route path="/oauth/consent" element={<OAuthConsent />} />

          {/* Main app - protected by AuthGuard */}
          <Route element={<AuthGuard><Layout /></AuthGuard>}>
            <Route path="/" element={<Exercises />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/gyms" element={<Gyms />} />
            <Route path="/exercise/:id" element={<ExerciseDetail />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
            <Route path="/live" element={<LiveCoaching />} />
            <Route path="/repositories" element={<Repositories />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <InstallPrompt />
      <PWAUpdatePrompt />
      <Toaster position="top-center" duration={2000} />
    </>
  )
}

export default App
