import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Clients } from '@/pages/Clients'
import { ClientDetail } from '@/pages/ClientDetail'
import { Sessions } from '@/pages/Sessions'
import { Exercises } from '@/pages/Exercises'
import { ExerciseDetail } from '@/pages/ExerciseDetail'
import { AIPlanner } from '@/pages/AIPlanner'

function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/exercise/:id" element={<ExerciseDetail />} />
            <Route path="/ai-planner" element={<AIPlanner />} />
          </Route>
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  )
}

export default App
