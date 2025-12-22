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
import { Settings } from '@/pages/Settings'

function App() {
  return (
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
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  )
}

export default App
