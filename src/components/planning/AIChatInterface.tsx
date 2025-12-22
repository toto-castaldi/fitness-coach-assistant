import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, User, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AIMessageBubble } from './AIMessageBubble'
import { PlanPreview } from './PlanPreview'
import { AISettingsPanel } from './AISettingsPanel'
import { useAISettings } from '@/hooks/useAISettings'
import { AI_MODELS } from '@/types'
import type { AIMessage, TrainingPlan, Client, Gym, CoachAISettings, AIProvider } from '@/types'

interface AIChatInterfaceProps {
  client: Client
  messages: AIMessage[]
  currentPlan: TrainingPlan | null
  gyms: Gym[]
  sending: boolean
  onSendMessage: (content: string, settings: CoachAISettings | null) => void
  onAcceptPlan: (gymId?: string) => void
  onRejectPlan: () => void
  onBack: () => void
}

export function AIChatInterface({
  client,
  messages,
  currentPlan,
  gyms,
  sending,
  onSendMessage,
  onAcceptPlan,
  onRejectPlan,
  onBack,
}: AIChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('openai')
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [initialized, setInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { settings, loading: settingsLoading, hasValidApiKey, saveSettings } = useAISettings()

  // Initialize provider/model from saved settings
  useEffect(() => {
    if (settings && !initialized) {
      setSelectedProvider(settings.preferred_provider)
      setSelectedModel(settings.preferred_model)
      setInitialized(true)
    }
  }, [settings, initialized])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentPlan])

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Filter models by selected provider
  const availableModels = AI_MODELS.filter(m => m.provider === selectedProvider)

  // When provider changes, select first model of that provider and save
  const handleProviderChange = (provider: AIProvider) => {
    setSelectedProvider(provider)
    const firstModel = AI_MODELS.find(m => m.provider === provider)
    if (firstModel) {
      setSelectedModel(firstModel.id)
      // Save both provider and model
      saveSettings({ preferred_provider: provider, preferred_model: firstModel.id })
    }
  }

  // When model changes, save the preference
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
    saveSettings({ preferred_model: modelId })
  }

  // Build settings object with local provider/model selection
  const buildCurrentSettings = (): CoachAISettings | null => {
    if (!settings) return null
    return {
      ...settings,
      preferred_provider: selectedProvider,
      preferred_model: selectedModel,
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    onSendMessage(input.trim(), buildCurrentSettings())
    setInput('')
  }

  const hasApiKey = hasValidApiKey(selectedProvider)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleContinueChat = () => {
    // Focus the textarea to continue chatting
    textareaRef.current?.focus()
  }

  // Calculate age
  const age = client.birth_date
    ? new Date().getFullYear() - new Date(client.birth_date).getFullYear()
    : client.age_years

  return (
    <div className="flex flex-col h-full relative">
      {/* Settings Panel */}
      {showSettings && (
        <AISettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {/* Header */}
      <div className="flex flex-col border-b bg-background sticky top-0 z-10">
        {/* Top row: back, client info, settings */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold truncate text-sm">
                {client.first_name} {client.last_name}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {age && `${age} anni`}
                {age && client.current_goal && ' • '}
                {client.current_goal}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom row: Provider and Model selectors */}
        <div className="flex items-center gap-2 px-4 pb-3">
          {/* Provider Selector */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedProvider === 'openai'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
              onClick={() => handleProviderChange('openai')}
            >
              OpenAI
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l ${
                selectedProvider === 'anthropic'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
              onClick={() => handleProviderChange('anthropic')}
            >
              Anthropic
            </button>
          </div>

          {/* Model Selector */}
          <div className="flex rounded-md border overflow-hidden">
            {availableModels.map((m, idx) => (
              <button
                key={m.id}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  idx > 0 ? 'border-l' : ''
                } ${
                  selectedModel === m.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted'
                }`}
                onClick={() => handleModelChange(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* API Key Warning */}
      {!settingsLoading && !hasApiKey && (
        <div className="mx-4 mt-4 rounded-md bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-medium">API Key mancante</p>
          <p className="text-xs mt-1">
            Configura la tua API key per {selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} nelle{' '}
            <button
              className="underline font-medium"
              onClick={() => setShowSettings(true)}
            >
              impostazioni
            </button>
            .
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">
              Inizia a chattare per pianificare una sessione di allenamento.
            </p>
            <p className="text-xs mt-2">
              Esempio: "Crea una sessione per domani focalizzata su gambe e glutei"
            </p>
          </div>
        )}

        {messages
          .filter(m => m.role !== 'system')
          .map((message) => (
            <AIMessageBubble key={message.id} message={message} />
          ))}

        {/* Sending indicator */}
        {sending && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">L'AI sta pensando...</span>
          </div>
        )}

        {/* Plan Preview */}
        {currentPlan && (
          <PlanPreview
            plan={currentPlan}
            gyms={gyms}
            onAccept={onAcceptPlan}
            onReject={onRejectPlan}
            onContinueChat={handleContinueChat}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t bg-background sticky bottom-0"
      >
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={sending}
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sending || !hasApiKey}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
