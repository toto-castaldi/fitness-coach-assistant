import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  AIConversation,
  AIMessage,
  AIMessageInsert,
  TrainingPlan,
  CoachAISettings,
} from '@/types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ClientContext {
  firstName: string
  lastName: string
  age: number | null
  gender: 'male' | 'female' | null
  physicalNotes: string | null
  currentGoal: string | null
  recentSessions: Array<{
    date: string
    gymName: string | null
    exercises: Array<{
      name: string
      sets?: number | null
      reps?: number | null
      weight_kg?: number | null
      duration_seconds?: number | null
    }>
  }>
}

interface AIResponse {
  message: string
  plan: TrainingPlan | null
  provider: string
}

export function useAIPlanning() {
  const [conversation, setConversation] = useState<AIConversation | null>(null)
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [currentPlan, setCurrentPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build client context for AI
  const buildClientContext = useCallback(async (clientId: string): Promise<ClientContext | null> => {
    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      setError('Errore nel caricamento del cliente')
      return null
    }

    // Fetch current goal
    const { data: goals } = await supabase
      .from('goal_history')
      .select('goal')
      .eq('client_id', clientId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)

    // Fetch recent sessions (last 5)
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        session_date,
        gym:gyms(name),
        exercises:session_exercises(
          sets, reps, weight_kg, duration_seconds,
          exercise:exercises(name)
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'completed')
      .order('session_date', { ascending: false })
      .limit(5)

    const recentSessions = (sessions || []).map((s: any) => ({
      date: s.session_date,
      gymName: s.gym?.name || null,
      exercises: (s.exercises || []).map((e: any) => ({
        name: e.exercise?.name || 'Esercizio sconosciuto',
        sets: e.sets,
        reps: e.reps,
        weight_kg: e.weight_kg,
        duration_seconds: e.duration_seconds,
      })),
    }))

    // Calculate age
    let age: number | null = client.age_years
    if (!age && client.birth_date) {
      const birthDate = new Date(client.birth_date)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear()
    }

    return {
      firstName: client.first_name,
      lastName: client.last_name,
      age,
      gender: client.gender || null,
      physicalNotes: client.physical_notes,
      currentGoal: goals?.[0]?.goal || client.current_goal || null,
      recentSessions,
    }
  }, [])

  // Start a new conversation for a client
  const startConversation = useCallback(async (clientId: string) => {
    setLoading(true)
    setError(null)
    setMessages([])
    setCurrentPlan(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utente non autenticato')
      }

      // Create conversation in database
      const { data: conv, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          client_id: clientId,
          title: null,
        })
        .select()
        .single()

      if (convError) throw convError

      setConversation(conv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione della conversazione')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load existing conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch conversation
      const { data: conv, error: convError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError) throw convError

      // Fetch messages
      const { data: msgs, error: msgsError } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (msgsError) throw msgsError

      // Fetch any existing plan
      const { data: plans } = await supabase
        .from('ai_generated_plans')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('accepted', false)
        .order('created_at', { ascending: false })
        .limit(1)

      setConversation(conv)
      setMessages(msgs || [])
      if (plans && plans.length > 0) {
        setCurrentPlan(plans[0].plan_json)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento della conversazione')
    } finally {
      setLoading(false)
    }
  }, [])

  // Send a message to the AI
  const sendMessage = useCallback(async (content: string, settings: CoachAISettings | null) => {
    if (!conversation) {
      setError('Nessuna conversazione attiva')
      return
    }

    if (!settings) {
      setError('Impostazioni AI non configurate')
      return
    }

    // Get API key based on provider
    const apiKey = settings.preferred_provider === 'openai'
      ? settings.openai_api_key
      : settings.anthropic_api_key

    if (!apiKey) {
      setError(`API key per ${settings.preferred_provider === 'openai' ? 'OpenAI' : 'Anthropic'} non configurata`)
      return
    }

    setSending(true)
    setError(null)

    try {
      // Save user message to database
      const userMessage: AIMessageInsert = {
        conversation_id: conversation.id,
        role: 'user',
        content,
      }

      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert(userMessage)
        .select()
        .single()

      if (userMsgError) throw userMsgError

      // Add to local state immediately
      setMessages(prev => [...prev, savedUserMsg])

      // Build context for AI
      const clientContext = await buildClientContext(conversation.client_id)
      if (!clientContext) return

      // Fetch available exercises
      const { data: exercises } = await supabase
        .from('exercises')
        .select('name')
        .order('name')

      // Fetch available gyms
      const { data: gyms } = await supabase
        .from('gyms')
        .select('id, name')
        .order('name')

      // Prepare chat history
      const chatHistory: ChatMessage[] = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      chatHistory.push({ role: 'user', content })

      // Call Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessione non valida')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: chatHistory,
            clientContext,
            availableExercises: (exercises || []).map(e => e.name),
            availableGyms: gyms || [],
            aiSettings: {
              provider: settings.preferred_provider,
              model: settings.preferred_model,
              apiKey: apiKey,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nella chiamata AI')
      }

      const aiResponse: AIResponse = await response.json()

      // Save assistant message to database
      const assistantMessage: AIMessageInsert = {
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse.message,
      }

      const { data: savedAssistantMsg, error: assistantMsgError } = await supabase
        .from('ai_messages')
        .insert(assistantMessage)
        .select()
        .single()

      if (assistantMsgError) throw assistantMsgError

      // Add to local state
      setMessages(prev => [...prev, savedAssistantMsg])

      // If AI proposed a plan, save it
      if (aiResponse.plan) {
        const { error: planError } = await supabase
          .from('ai_generated_plans')
          .insert({
            conversation_id: conversation.id,
            plan_json: aiResponse.plan,
            accepted: false,
          })

        if (planError) {
          console.error('Error saving plan:', planError)
        }

        setCurrentPlan(aiResponse.plan)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'invio del messaggio')
    } finally {
      setSending(false)
    }
  }, [conversation, messages, buildClientContext])

  // Accept the current plan and create a session
  const acceptPlan = useCallback(async (gymId?: string): Promise<string | null> => {
    if (!conversation || !currentPlan) {
      setError('Nessun piano da accettare')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Create the session with today's date
      const today = new Date().toISOString().split('T')[0]
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          client_id: conversation.client_id,
          gym_id: gymId || null,
          session_date: today,
          status: 'planned',
          notes: currentPlan.notes || null,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Fetch exercises to match names to IDs
      const { data: exercises } = await supabase
        .from('exercises')
        .select('id, name')

      const exerciseMap = new Map((exercises || []).map(e => [e.name.toLowerCase(), e.id]))

      // Get current user for creating new exercises
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      // Create missing exercises first
      const sessionExercises = []
      for (let index = 0; index < currentPlan.exercises.length; index++) {
        const planEx = currentPlan.exercises[index]
        let exerciseId = planEx.exercise_id || exerciseMap.get(planEx.exercise_name.toLowerCase())

        // If exercise doesn't exist, create it
        if (!exerciseId) {
          const { data: newExercise, error: newExError } = await supabase
            .from('exercises')
            .insert({
              name: planEx.exercise_name,
              description: planEx.notes || null,
              user_id: user.id, // Coach's custom exercise
            })
            .select('id')
            .single()

          if (newExError) {
            console.error('Error creating exercise:', planEx.exercise_name, newExError)
            continue // Skip this exercise if creation fails
          }

          exerciseId = newExercise.id
          // Update map for potential duplicates in the same plan
          exerciseMap.set(planEx.exercise_name.toLowerCase(), exerciseId)
        }

        sessionExercises.push({
          session_id: session.id,
          exercise_id: exerciseId,
          order_index: index,
          sets: planEx.sets,
          reps: planEx.reps,
          weight_kg: planEx.weight_kg,
          duration_seconds: planEx.duration_seconds,
          notes: planEx.notes,
        })
      }

      if (sessionExercises.length > 0) {
        const { error: exercisesError } = await supabase
          .from('session_exercises')
          .insert(sessionExercises)

        if (exercisesError) {
          console.error('Error adding exercises:', exercisesError)
        }
      }

      // Mark plan as accepted
      await supabase
        .from('ai_generated_plans')
        .update({
          accepted: true,
          session_id: session.id,
        })
        .eq('conversation_id', conversation.id)
        .eq('accepted', false)

      // Update conversation title
      const clientContext = await buildClientContext(conversation.client_id)
      if (clientContext) {
        await supabase
          .from('ai_conversations')
          .update({
            title: `Piano per ${clientContext.firstName} - ${currentPlan.session_date}`
          })
          .eq('id', conversation.id)
      }

      setCurrentPlan(null)
      return session.id
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione della sessione')
      return null
    } finally {
      setLoading(false)
    }
  }, [conversation, currentPlan, buildClientContext])

  // Clear the current plan (reject)
  const clearPlan = useCallback(() => {
    setCurrentPlan(null)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    conversation,
    messages,
    currentPlan,
    loading,
    sending,
    error,
    startConversation,
    loadConversation,
    sendMessage,
    acceptPlan,
    clearPlan,
    clearError,
  }
}
