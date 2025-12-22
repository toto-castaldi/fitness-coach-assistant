import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CoachAISettings, CoachAISettingsUpdate, AIProvider } from '@/types'

export function useAISettings() {
  const [settings, setSettings] = useState<CoachAISettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('coach_ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        throw fetchError
      }

      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle impostazioni')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (updates: CoachAISettingsUpdate): Promise<boolean> => {
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utente non autenticato')
      }

      if (settings) {
        // Update existing settings
        const { data, error: updateError } = await supabase
          .from('coach_ai_settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single()

        if (updateError) throw updateError
        setSettings(data)
      } else {
        // Insert new settings
        const { data, error: insertError } = await supabase
          .from('coach_ai_settings')
          .insert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single()

        if (insertError) throw insertError
        setSettings(data)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio delle impostazioni')
      return false
    }
  }, [settings])

  const updateProvider = useCallback(async (provider: AIProvider): Promise<boolean> => {
    return saveSettings({ preferred_provider: provider })
  }, [saveSettings])

  const updateModel = useCallback(async (model: string): Promise<boolean> => {
    return saveSettings({ preferred_model: model })
  }, [saveSettings])

  const hasValidApiKey = useCallback((provider: AIProvider): boolean => {
    if (!settings) return false
    if (provider === 'openai') {
      return !!settings.openai_api_key && settings.openai_api_key.length > 0
    }
    return !!settings.anthropic_api_key && settings.anthropic_api_key.length > 0
  }, [settings])

  const getApiKey = useCallback((provider: AIProvider): string | null => {
    if (!settings) return null
    if (provider === 'openai') {
      return settings.openai_api_key
    }
    return settings.anthropic_api_key
  }, [settings])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    settings,
    loading,
    error,
    saveSettings,
    updateProvider,
    updateModel,
    hasValidApiKey,
    getApiKey,
    clearError,
    refetch: fetchSettings,
  }
}
