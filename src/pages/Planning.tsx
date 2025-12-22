import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientSelector } from '@/components/planning/ClientSelector'
import { AIChatInterface } from '@/components/planning/AIChatInterface'
import { useClients } from '@/hooks/useClients'
import { useGyms } from '@/hooks/useGyms'
import { useAIPlanning } from '@/hooks/useAIPlanning'
import type { Client } from '@/types'

export function Planning() {
  const { clientId } = useParams<{ clientId?: string }>()
  const navigate = useNavigate()

  const { clients, loading: clientsLoading } = useClients()
  const { gyms } = useGyms()
  const {
    conversation,
    messages,
    currentPlan,
    loading,
    sending,
    error,
    startConversation,
    sendMessage,
    acceptPlan,
    clearPlan,
    clearError,
  } = useAIPlanning()

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // If clientId is provided in URL, start conversation automatically
  useEffect(() => {
    if (clientId && clients.length > 0 && !selectedClient) {
      const client = clients.find(c => c.id === clientId)
      if (client) {
        handleClientSelect(client)
      }
    }
  }, [clientId, clients])

  const handleClientSelect = async (client: Client) => {
    setSelectedClient(client)
    await startConversation(client.id)
    // Update URL to include clientId
    if (!clientId) {
      navigate(`/planning/${client.id}`, { replace: true })
    }
  }

  const handleBack = () => {
    if (selectedClient) {
      setSelectedClient(null)
      navigate('/planning', { replace: true })
    } else {
      navigate('/sessions')
    }
  }

  const handleAcceptPlan = async (gymId?: string) => {
    const sessionId = await acceptPlan(gymId)
    if (sessionId) {
      navigate(`/sessions/${sessionId}`)
    }
  }

  // Show error message
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  // Loading state
  if (clientsLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Chat interface when client is selected
  if (selectedClient && conversation) {
    return (
      <div className="fixed inset-0 top-[57px] bottom-[64px] bg-background">
        {error && (
          <div className="absolute top-0 left-0 right-0 z-20 rounded-md bg-destructive/10 p-3 text-sm text-destructive m-4">
            {error}
          </div>
        )}
        <AIChatInterface
          client={selectedClient}
          messages={messages}
          currentPlan={currentPlan}
          gyms={gyms}
          sending={sending}
          onSendMessage={sendMessage}
          onAcceptPlan={handleAcceptPlan}
          onRejectPlan={clearPlan}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Client selection
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Pianifica con AI
          </h1>
          <p className="text-sm text-muted-foreground">
            Seleziona un cliente per iniziare
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <ClientSelector
        clients={clients}
        onSelect={handleClientSelect}
        loading={clientsLoading}
      />
    </div>
  )
}
