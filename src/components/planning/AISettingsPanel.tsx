import { useState, useEffect } from 'react'
import { Settings, Eye, EyeOff, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAISettings } from '@/hooks/useAISettings'
import type { CoachAISettingsUpdate } from '@/types'

interface AISettingsPanelProps {
  onClose: () => void
}

export function AISettingsPanel({ onClose }: AISettingsPanelProps) {
  const { settings, loading, error, saveSettings, clearError } = useAISettings()

  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [saving, setSaving] = useState(false)

  // Initialize form with existing settings
  useEffect(() => {
    if (settings) {
      setOpenaiKey(settings.openai_api_key || '')
      setAnthropicKey(settings.anthropic_api_key || '')
    }
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    clearError()

    const updates: CoachAISettingsUpdate = {
      openai_api_key: openaiKey || null,
      anthropic_api_key: anthropicKey || null,
    }

    const success = await saveSettings(updates)
    setSaving(false)

    if (success) {
      onClose()
    }
  }

  if (loading) {
    return (
      <Card className="absolute inset-4 z-50 bg-background overflow-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="absolute inset-4 z-50 bg-background overflow-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Keys
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* OpenAI API Key */}
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <div className="relative">
            <Input
              id="openai-key"
              type={showOpenaiKey ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowOpenaiKey(!showOpenaiKey)}
            >
              {showOpenaiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ottieni la tua API key da{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        {/* Anthropic API Key */}
        <div className="space-y-2">
          <Label htmlFor="anthropic-key">Anthropic API Key</Label>
          <div className="relative">
            <Input
              id="anthropic-key"
              type={showAnthropicKey ? 'text' : 'password'}
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setShowAnthropicKey(!showAnthropicKey)}
            >
              {showAnthropicKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ottieni la tua API key da{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Salva
          </Button>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Annulla
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
