import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Check, X, Loader2, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/shared/lib/supabase'

interface AuthorizationDetails {
  client_name?: string
  client_uri?: string
  scope?: string
  redirect_uri?: string
}

export function OAuthConsent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null)

  const authorizationId = searchParams.get('authorization_id')

  useEffect(() => {
    if (!authorizationId) {
      setError('Parametro authorization_id mancante')
      setLoading(false)
      return
    }

    // In a real implementation, we would fetch authorization details
    // For now, we'll use the information from the URL params
    const clientName = searchParams.get('client_name') || 'Claude Web'
    const scope = searchParams.get('scope') || 'openid email profile'

    setAuthDetails({
      client_name: clientName,
      scope: scope,
      redirect_uri: searchParams.get('redirect_uri') || undefined,
    })
    setLoading(false)
  }, [authorizationId, searchParams])

  const handleApprove = async () => {
    if (!authorizationId) return

    setSubmitting(true)
    setError(null)

    try {
      // Supabase OAuth 2.1 approval
      // The actual method may vary based on Supabase SDK version
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/oauth/authorize?authorization_id=${authorizationId}&decision=approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error_description || data.message || 'Errore durante l\'approvazione')
      }

      // The response should contain a redirect URL
      const data = await response.json()
      if (data.redirect_uri) {
        window.location.href = data.redirect_uri
      } else {
        // Fallback - close window or redirect to home
        window.close()
        navigate('/')
      }
    } catch (err) {
      console.error('OAuth approval error:', err)
      setError(err instanceof Error ? err.message : 'Errore durante l\'approvazione')
      setSubmitting(false)
    }
  }

  const handleDeny = async () => {
    if (!authorizationId) return

    setSubmitting(true)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/oauth/authorize?authorization_id=${authorizationId}&decision=deny`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      )

      // Even on deny, redirect back to client
      const data = await response.json()
      if (data.redirect_uri) {
        window.location.href = data.redirect_uri
      } else {
        window.close()
        navigate('/')
      }
    } catch {
      // On error, just close/redirect
      window.close()
      navigate('/')
    }
  }

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Require authentication
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/logo.svg" alt="Helix Logo" className="mx-auto h-16 w-16 mb-4" />
            <CardTitle>Accesso Richiesto</CardTitle>
            <CardDescription>
              Effettua il login per autorizzare l'applicazione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            >
              Accedi con Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error
  if (error && !authDetails) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>Errore</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
              Torna alla Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Consent screen
  const scopes = authDetails?.scope?.split(' ') || []

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/logo.svg" alt="Helix Logo" className="mx-auto h-16 w-16 mb-4" />
          <CardTitle>Autorizza Accesso</CardTitle>
          <CardDescription>
            <span className="font-semibold text-foreground">{authDetails?.client_name}</span>
            {' '}vuole accedere al tuo account Helix
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* User info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-muted-foreground">Connesso come</p>
            <p className="font-medium">{user.email}</p>
          </div>

          {/* Permissions requested */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permessi richiesti
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Leggere i tuoi clienti e le sessioni
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Creare e modificare sessioni di allenamento
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Accedere al catalogo esercizi
              </li>
              {scopes.includes('email') && (
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Leggere il tuo indirizzo email
                </li>
              )}
            </ul>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Nega
              </>
            )}
          </Button>
          <Button
            className="flex-1"
            onClick={handleApprove}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Autorizza
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground text-center max-w-md">
        Autorizzando, permetti a {authDetails?.client_name} di accedere ai tuoi dati Helix.
        Puoi revocare l'accesso in qualsiasi momento dalle impostazioni.
      </p>
    </div>
  )
}
