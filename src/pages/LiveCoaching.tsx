import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, CheckCircle2, ArrowLeft, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LiveDashboard, SaveIndicator, ResumeDialog } from '@/components/live'
import { useLiveCoaching } from '@/hooks/useLiveCoaching'
import { useExercises } from '@/hooks/useExercises'
import { useAuth } from '@/hooks/useAuth'
import {
  saveLiveCoachingState,
  loadLiveCoachingState,
  clearLiveCoachingState,
  sessionsHaveProgress,
} from '@/lib/liveCoachingStorage'

type Step = 'select-date' | 'live' | 'summary'

export function LiveCoaching() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>('select-date')
  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split('T')[0]
  })
  // IDs of sessions selected for this live coaching session
  const [liveSessionIds, setLiveSessionIds] = useState<string[]>([])
  // Current client index for LiveDashboard
  const [currentClientIndex, setCurrentClientIndex] = useState(0)
  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [savedState, setSavedState] = useState<ReturnType<typeof loadLiveCoachingState>>(null)

  const {
    sessions,
    loading,
    error,
    saveStatus,
    saveError,
    fetchSessionsForDate,
    updateExerciseOnTheFly,
    changeExercise,
    selectExercise,
    completeExercise,
    skipExercise,
    replanSession,
    addExerciseToSession,
  } = useLiveCoaching()

  const { exercises: catalogExercises, refetch: refetchExercises } = useExercises()

  // On mount: check for saved state
  useEffect(() => {
    if (!user?.id) return

    const loaded = loadLiveCoachingState(user.id)
    if (loaded) {
      setSavedState(loaded)
      // Set date to fetch sessions for that date
      setSelectedDate(loaded.selectedDate)
    }
  }, [user?.id])

  // After sessions are fetched, check if we should show resume dialog
  useEffect(() => {
    if (!savedState || loading || !sessions.length) return

    // Filter to get only the sessions that were in the saved state
    const savedSessions = sessions.filter(s => savedState.liveSessionIds.includes(s.id))

    if (savedSessions.length > 0 && sessionsHaveProgress(savedSessions)) {
      setShowResumeDialog(true)
    } else if (savedState.step !== 'select-date') {
      // State exists but no progress - clear it
      clearLiveCoachingState(user!.id)
      setSavedState(null)
    }
  }, [savedState, loading, sessions, user])

  // Save state to localStorage when it changes (only during live session)
  useEffect(() => {
    if (!user?.id) return
    if (step !== 'live') return
    if (liveSessionIds.length === 0) return

    const stateToSave = {
      selectedDate,
      liveSessionIds,
      step,
      currentClientIndex,
      startedAt: savedState?.startedAt || new Date().toISOString(),
    }

    saveLiveCoachingState(user.id, stateToSave)
  }, [user?.id, step, selectedDate, liveSessionIds, currentClientIndex, savedState?.startedAt])

  // Fetch sessions when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchSessionsForDate(selectedDate)
    }
  }, [selectedDate, fetchSessionsForDate])

  // Handle resume from saved state
  const handleResume = useCallback(() => {
    if (!savedState) return

    setLiveSessionIds(savedState.liveSessionIds)
    setCurrentClientIndex(savedState.currentClientIndex)
    setStep('live')
    setShowResumeDialog(false)
  }, [savedState])

  // Handle restart (clear saved state and replan sessions)
  const handleRestart = useCallback(async () => {
    if (!user?.id || !savedState) return

    // Get sessions to reset
    const savedSessions = sessions.filter(s => savedState.liveSessionIds.includes(s.id))

    // Reset all sessions
    for (const session of savedSessions) {
      await replanSession(session.id)
    }

    // Clear saved state
    clearLiveCoachingState(user.id)
    setSavedState(null)
    setShowResumeDialog(false)

    // Start fresh
    setLiveSessionIds(savedSessions.map(s => s.id))
    setCurrentClientIndex(0)
    setStep('live')
  }, [user?.id, savedState, sessions, replanSession])

  const handleStartSession = async () => {
    if (plannedSessions.length > 0) {
      // Save the IDs of planned sessions for this live coaching session
      setLiveSessionIds(plannedSessions.map(s => s.id))
      // Reset all planned sessions to start from beginning
      for (const session of plannedSessions) {
        if (session.current_exercise_index > 0) {
          await replanSession(session.id)
        }
      }
      setCurrentClientIndex(0)
      setStep('live')
    }
  }

  const handleBackToSessions = () => {
    navigate('/sessions')
  }

  const handleExitLive = () => {
    // Keep saved state for resume later
    setStep('select-date')
  }

  const handleFinishLive = useCallback(() => {
    // Clear saved state when session is completed
    if (user?.id) {
      clearLiveCoachingState(user.id)
    }
    setStep('summary')
  }, [user?.id])

  // Handle client index change from LiveDashboard
  const handleClientIndexChange = useCallback((index: number) => {
    setCurrentClientIndex(index)
  }, [])

  const completedSessions = sessions.filter((s) => s.status === 'completed')
  const plannedSessions = sessions.filter((s) => s.status === 'planned')
  const allComplete = plannedSessions.length === 0 && completedSessions.length > 0

  // Calculate progress stats for resume dialog
  const getProgressStats = () => {
    if (!savedState) return { clientCount: 0, completedExercises: 0 }
    const savedSessions = sessions.filter(s => savedState.liveSessionIds.includes(s.id))
    const completedExercises = savedSessions.reduce((count, session) => {
      return count + (session.exercises?.filter(ex => ex.completed || ex.skipped).length || 0)
    }, 0)
    return { clientCount: savedSessions.length, completedExercises }
  }

  const progressStats = getProgressStats()

  // Step 1: Select Date
  if (step === 'select-date') {
    return (
      <div className="space-y-6">
        {/* Resume Dialog */}
        <ResumeDialog
          open={showResumeDialog}
          clientCount={progressStats.clientCount}
          completedExercises={progressStats.completedExercises}
          onResume={handleResume}
          onRestart={handleRestart}
        />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Live Coaching</h1>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Seleziona Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data Allenamento</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-lg"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {plannedSessions.length} sessioni pianificate
                    {completedSessions.length > 0 &&
                      `, ${completedSessions.length} completate`}
                  </span>
                </div>

                {/* Client list - show planned first, then completed */}
                <div className="space-y-2">
                  {[...plannedSessions, ...completedSessions].map((session, index) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {session.client?.first_name} {session.client?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.exercises?.length || 0} esercizi
                          {session.gym && ` @ ${session.gym.name}`}
                        </p>
                      </div>
                      {session.status === 'completed' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => replanSession(session.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {index + 1}° cliente
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {plannedSessions.length > 0 && (
                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleStartSession}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Inizia Lezione ({plannedSessions.length} clienti)
                  </Button>
                )}

                {allComplete && (
                  <div className="text-center py-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-medium">Tutte le sessioni completate!</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessuna sessione per questa data.</p>
                <p className="text-sm">Seleziona un'altra data o pianifica nuove sessioni.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 2: Live Dashboard
  if (step === 'live') {
    // Show only sessions that were selected for this live coaching session
    const liveSessions = sessions.filter(s => liveSessionIds.includes(s.id))

    // If ALL sessions are completed, go to summary
    const allCompleted = liveSessions.length > 0 && liveSessions.every((s) => s.status === 'completed')
    if (allCompleted) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => handleFinishLive(), 0)
      return null
    }

    // If no sessions at all, go back to select
    if (liveSessions.length === 0) {
      setStep('select-date')
      return null
    }

    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col -mx-4 -mt-4">
        {/* Header with save indicator */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <Button variant="ghost" size="sm" onClick={handleExitLive}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Esci
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-semibold">
              {new Date(selectedDate).toLocaleDateString('it-IT', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </h1>
            <SaveIndicator status={saveStatus} error={saveError} />
          </div>
          <div className="w-16" /> {/* Spacer for alignment */}
        </div>

        {/* Dashboard */}
        <div className="flex-1 overflow-hidden">
          <LiveDashboard
            key={selectedDate}
            sessions={liveSessions}
            catalogExercises={catalogExercises}
            initialClientIndex={currentClientIndex}
            onClientIndexChange={handleClientIndexChange}
            onRefreshExercises={refetchExercises}
            onUpdateExercise={updateExerciseOnTheFly}
            onChangeExercise={changeExercise}
            onCompleteExercise={completeExercise}
            onSkipExercise={skipExercise}
            onSelectExercise={selectExercise}
            onAddExercise={addExerciseToSession}
          />
        </div>
      </div>
    )
  }

  // Step 3: Summary
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setStep('select-date')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Riepilogo Lezione</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Sessioni Completate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {completedSessions.length > 0 ? (
            completedSessions.map((session) => {
              const completedExercises = session.exercises?.filter((e) => e.completed).length || 0
              const totalExercises = session.exercises?.length || 0

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {session.client?.first_name} {session.client?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {completedExercises}/{totalExercises} esercizi completati
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              )
            })
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nessuna sessione completata.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => setStep('select-date')}>
          Nuova Lezione
        </Button>
        <Button className="flex-1" onClick={handleBackToSessions}>
          Torna alle Sessioni
        </Button>
      </div>
    </div>
  )
}
