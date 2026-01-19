import { useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { useFilteredExercises } from '@/hooks/useFilteredExercises'
import type { ExerciseWithDetails } from '@/types'

interface ExercisePickerProps {
  exercises: ExerciseWithDetails[]
  onSelect: (exercise: ExerciseWithDetails) => void
  onClose: () => void
  onRefresh?: () => void
  title?: string
}

export function ExercisePicker({ exercises, onSelect, onClose, onRefresh, title = 'Seleziona Esercizio' }: ExercisePickerProps) {
  // Refresh exercises when picker opens
  useEffect(() => {
    onRefresh?.()
  }, [])

  const {
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    clearTags,
    allTags,
    filteredExercises,
    showNoTags,
    toggleNoTags,
    showNoInfo,
    toggleNoInfo,
  } = useFilteredExercises(exercises)

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">{title}</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4 border-b">
        <ExerciseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
          showNoTags={showNoTags}
          onToggleNoTags={toggleNoTags}
          showNoInfo={showNoInfo}
          onToggleNoInfo={toggleNoInfo}
          searchPlaceholder="Cerca esercizio..."
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredExercises.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {exercises.length === 0
              ? 'Nessun esercizio nel catalogo.'
              : 'Nessun esercizio corrisponde ai criteri di ricerca.'}
          </p>
        ) : (
          filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer"
              onClick={() => onSelect(exercise)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium">{exercise.name}</p>
                {exercise.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {exercise.description}
                  </p>
                )}
                {exercise.tags && exercise.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.tags.map((t) => (
                      <Badge
                        key={t.id}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-secondary/80"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTag(t.tag)
                        }}
                      >
                        {t.tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Plus className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
