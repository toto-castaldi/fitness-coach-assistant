import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLiveCoaching } from '@/shared/hooks/useLiveCoaching'
import { useExercises } from '@/hooks/useExercises'
import { ClientStripBar } from '@/live/components/ClientStripBar'
import { ActionPanel } from '@/live/components/ActionPanel'
import { ExerciseCarousel } from '@/live/components/ExerciseCarousel'
import { SaveIndicator } from '@/live/components/SaveIndicator'
import { ConfirmDialog } from '@/live/components/ConfirmDialog'
import { ExercisePickerLive } from '@/live/components/ExercisePickerLive'
import { LumioCardModalLive } from '@/live/components/LumioCardModalLive'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import type { ExerciseWithDetails, LumioLocalCardWithRepository } from '@/shared/types'

export function TabletLive() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    sessions,
    loading,
    saveStatus,
    fetchSessionsForDate,
    updateExerciseOnTheFly,
    completeExercise,
    skipExercise,
    selectExercise,
    deleteExerciseFromSession,
    addExerciseToSession,
    changeExercise,
  } = useLiveCoaching()

  const { exercises, refetch: refetchExercises } = useExercises()

  const [selectedClientIndex, setSelectedClientIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pickerMode, setPickerMode] = useState<'add' | 'change' | null>(null)
  const [showLumioCard, setShowLumioCard] = useState(false)
  const date = (location.state as { date?: string })?.date

  useEffect(() => {
    if (date) {
      fetchSessionsForDate(date)
    } else {
      navigate('/')
    }
  }, [date, fetchSessionsForDate, navigate])

  // Show all sessions - completed ones remain visible and editable
  const selectedSession = sessions[selectedClientIndex]

  // Adjust selectedClientIndex if it becomes invalid
  useEffect(() => {
    if (sessions.length > 0 && selectedClientIndex >= sessions.length) {
      setSelectedClientIndex(sessions.length - 1)
    }
  }, [sessions.length, selectedClientIndex])

  const handleBack = () => {
    navigate('/')
  }

  const handleClientSelect = (index: number) => {
    setSelectedClientIndex(index)
  }

  const handleExerciseSelect = async (exerciseIndex: number) => {
    if (selectedSession) {
      await selectExercise(selectedSession.id, exerciseIndex)
    }
  }

  const handleComplete = async () => {
    if (selectedSession) {
      const currentExercise = selectedSession.exercises?.[selectedSession.current_exercise_index]
      if (currentExercise) {
        await completeExercise(selectedSession.id, currentExercise.id)
      }
    }
  }

  const handleSkip = async () => {
    if (selectedSession) {
      const currentExercise = selectedSession.exercises?.[selectedSession.current_exercise_index]
      if (currentExercise) {
        await skipExercise(selectedSession.id, currentExercise.id)
      }
    }
  }

  const handleCenter = async () => {
    if (selectedSession) {
      const exercises = selectedSession.exercises || []
      // Find first non-completed and non-skipped exercise
      const firstIncompleteIndex = exercises.findIndex(
        (ex) => !ex.completed && !ex.skipped
      )
      if (firstIncompleteIndex !== -1) {
        await selectExercise(selectedSession.id, firstIncompleteIndex)
      }
    }
  }

  const handleUpdateExercise = async (field: string, value: number | string | null) => {
    if (selectedSession) {
      const currentExercise = selectedSession.exercises?.[selectedSession.current_exercise_index]
      if (currentExercise) {
        await updateExerciseOnTheFly(selectedSession.id, currentExercise.id, {
          [field]: value,
        })
      }
    }
  }

  const handleDeleteClick = () => {
    if (selectedSession && selectedSession.exercises && selectedSession.exercises.length > 1) {
      setShowDeleteConfirm(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (selectedSession) {
      const currentExercise = selectedSession.exercises?.[selectedSession.current_exercise_index]
      if (currentExercise) {
        await deleteExerciseFromSession(selectedSession.id, currentExercise.id)
      }
    }
    setShowDeleteConfirm(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
  }

  const handleAddClick = () => {
    refetchExercises()
    setPickerMode('add')
  }

  const handleChangeClick = () => {
    refetchExercises()
    setPickerMode('change')
  }

  const handleExerciseSelectFromPicker = async (exercise: ExerciseWithDetails) => {
    if (!selectedSession) return

    if (pickerMode === 'add') {
      await addExerciseToSession(selectedSession.id, exercise)
    } else if (pickerMode === 'change') {
      const currentExercise = selectedSession.exercises?.[selectedSession.current_exercise_index]
      if (currentExercise) {
        await changeExercise(selectedSession.id, currentExercise.id, exercise)
      }
    }
    setPickerMode(null)
  }

  const handleExercisePickerClose = () => {
    setPickerMode(null)
  }

  // Get current exercise data for delete confirmation and Lumio card
  const currentExercise = selectedSession?.exercises?.[selectedSession.current_exercise_index]
  const currentExerciseName = currentExercise?.exercise?.name || 'questo esercizio'
  const currentLumioCard = currentExercise?.exercise?.lumio_card as LumioLocalCardWithRepository | null
  const hasLumioCard = !!currentLumioCard

  const handleInfoClick = () => {
    if (hasLumioCard) {
      setShowLumioCard(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header with client strip */}
      <header className="flex items-center px-4 py-2 border-b border-gray-800 bg-gray-950">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <ClientStripBar
          sessions={sessions}
          selectedIndex={selectedClientIndex}
          onSelectClient={handleClientSelect}
        />
        <SaveIndicator status={saveStatus} className="ml-4" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex p-4 gap-4">
        {/* Action Panel */}
        <ActionPanel
          onComplete={handleComplete}
          onSkip={handleSkip}
          onCenter={handleCenter}
          onDelete={handleDeleteClick}
          onChange={handleChangeClick}
          onInfo={handleInfoClick}
          onAdd={handleAddClick}
          disabled={!selectedSession}
          hasLumioCard={hasLumioCard}
        />

        {/* Exercise Carousel */}
        <div className="flex-1">
          {selectedSession && (
            <ExerciseCarousel
              session={selectedSession}
              onSelectExercise={handleExerciseSelect}
              onUpdateExercise={handleUpdateExercise}
            />
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Elimina esercizio"
        message={`Sei sicuro di voler eliminare "${currentExerciseName}" dalla sessione?`}
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Exercise Picker Modal */}
      <ExercisePickerLive
        open={pickerMode !== null}
        title={pickerMode === 'change' ? 'Cambia Esercizio' : 'Seleziona Esercizio'}
        exercises={exercises}
        onSelect={handleExerciseSelectFromPicker}
        onClose={handleExercisePickerClose}
      />

      {/* Lumio Card Modal */}
      <LumioCardModalLive
        open={showLumioCard}
        exerciseName={currentExerciseName}
        lumioCard={currentLumioCard}
        onClose={() => setShowLumioCard(false)}
      />
    </div>
  )
}
