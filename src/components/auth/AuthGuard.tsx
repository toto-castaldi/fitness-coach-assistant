import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginButton } from './LoginButton'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="space-y-2">
            <img src="/logo.svg" alt="FCA Logo" className="mx-auto h-32 w-32" />
            <h1 className="text-2xl font-bold">Fitness Coach Assistant</h1>
          </div>
          <LoginButton />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
