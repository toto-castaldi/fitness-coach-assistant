import { useRef, useState } from 'react'
import { ExerciseCard } from './ExerciseCard'
import type { SessionWithDetails } from '@/shared/types'
import { cn } from '@/shared/lib/utils'

interface ExerciseCarouselProps {
  session: SessionWithDetails
  onSelectExercise: (index: number) => void
  onUpdateExercise: (field: string, value: number | string | null) => void
}

export function ExerciseCarousel({
  session,
  onSelectExercise,
  onUpdateExercise,
}: ExerciseCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentIndex = session.current_exercise_index
  const exercises = session.exercises || []

  // Swipe handling
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && currentIndex < exercises.length - 1) {
      // Swipe left = next exercise
      onSelectExercise(currentIndex + 1)
    } else if (isRightSwipe && currentIndex > 0) {
      // Swipe right = previous exercise
      onSelectExercise(currentIndex - 1)
    }
  }

  if (exercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Nessun esercizio in questa sessione</p>
      </div>
    )
  }

  // Get the 3 exercises to display: previous, current, next
  const prevExercise = currentIndex > 0 ? exercises[currentIndex - 1] : null
  const currentExercise = exercises[currentIndex]
  const nextExercise = currentIndex < exercises.length - 1 ? exercises[currentIndex + 1] : null

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-1.5 mb-2 shrink-0">
        {exercises.map((_, index) => (
          <button
            key={index}
            onClick={() => onSelectExercise(index)}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-all',
              index === currentIndex
                ? 'bg-amber-400 w-6'
                : index < currentIndex
                ? 'bg-emerald-400'
                : 'bg-white/40'
            )}
          />
        ))}
      </div>

      {/* Cards container - 3 columns grid */}
      <div
        ref={containerRef}
        className="flex-1 grid grid-cols-3 gap-2 px-2 min-h-0 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Previous exercise (left) */}
        <div className="flex justify-end h-full min-h-0">
          {prevExercise ? (
            <ExerciseCard
              exercise={prevExercise}
              isCurrentExercise={false}
              onClick={() => onSelectExercise(currentIndex - 1)}
            />
          ) : (
            <div className="w-[320px]" /> // Empty space
          )}
        </div>

        {/* Current exercise (center) */}
        <div className="flex justify-center h-full min-h-0">
          <ExerciseCard
            exercise={currentExercise}
            isCurrentExercise={true}
            onUpdateSets={(value) => onUpdateExercise('sets', value)}
            onUpdateReps={(value) => onUpdateExercise('reps', value)}
            onUpdateWeight={(value) => onUpdateExercise('weight_kg', value)}
            onUpdateDuration={(value) => onUpdateExercise('duration_seconds', value)}
            onUpdateNotes={(value) => onUpdateExercise('notes', value)}
          />
        </div>

        {/* Next exercise (right) */}
        <div className="flex justify-start h-full min-h-0">
          {nextExercise ? (
            <ExerciseCard
              exercise={nextExercise}
              isCurrentExercise={false}
              onClick={() => onSelectExercise(currentIndex + 1)}
            />
          ) : (
            <div className="w-[320px]" /> // Empty space
          )}
        </div>
      </div>

      {/* Exercise counter */}
      <div className="text-center mt-2 shrink-0">
        <span className="text-xl font-bold text-white">
          {currentIndex + 1}
        </span>
        <span className="text-gray-400 text-sm"> / {exercises.length}</span>
      </div>
    </div>
  )
}
