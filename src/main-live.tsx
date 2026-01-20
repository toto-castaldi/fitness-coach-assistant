import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppLive from './AppLive.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppLive />
  </StrictMode>,
)
