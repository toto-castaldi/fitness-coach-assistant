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
import { Planning } from '@/pages/Planning'
import { LiveCoaching } from '@/pages/LiveCoaching'
import { Settings } from '@/pages/Settings'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { PWAUpdatePrompt } from '@/components/pwa/PWAUpdatePrompt'
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <OfflineIndicator />
      <BrowserRouter>
        <AuthGuard>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Exercises />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/gyms" element={<Gyms />} />
              <Route path="/exercise/:id" element={<ExerciseDetail />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/planning/:clientId" element={<Planning />} />
              <Route path="/live" element={<LiveCoaching />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </AuthGuard>
      </BrowserRouter>
      <InstallPrompt />
      <PWAUpdatePrompt />
      <Toaster position="top-center" duration={2000} />
    </>
  )
}

export default App
