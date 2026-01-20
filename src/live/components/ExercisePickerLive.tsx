import { X, Search, Plus, Tags, FileQuestion } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useFilteredExercises } from '@/hooks/useFilteredExercises'
import type { ExerciseWithDetails } from '@/shared/types'

interface ExercisePickerLiveProps {
  open: boolean
  title?: string
  exercises: ExerciseWithDetails[]
  onSelect: (exercise: ExerciseWithDetails) => void
  onClose: () => void
}

export function ExercisePickerLive({
  open,
  title = 'Seleziona Esercizio',
  exercises,
  onSelect,
  onClose,
}: ExercisePickerLiveProps) {
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

  if (!open) return null

  const hasFilters = searchQuery.trim() || selectedTags.length > 0 || showNoTags || showNoInfo

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-950">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca esercizio..."
            className="pl-10 h-12 text-lg bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
            autoFocus
          />
        </div>
      </div>

      {/* Tags Filter */}
      <div className="p-4 border-b border-gray-700 bg-gray-900">
        <div className="flex flex-wrap gap-2">
          {hasFilters && (
            <button
              onClick={() => {
                setSearchQuery('')
                clearTags()
              }}
              className="px-3 py-1.5 rounded-full text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              <X className="h-3 w-3 inline mr-1" />
              Rimuovi filtri
            </button>
          )}
          {/* Special filter: Senza tag */}
          <button
            onClick={toggleNoTags}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
              showNoTags
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Tags className="h-3 w-3" />
            Senza tag
          </button>
          {/* Special filter: Senza Lumio */}
          <button
            onClick={toggleNoInfo}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
              showNoInfo
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileQuestion className="h-3 w-3" />
            Senza Lumio
          </button>
          {/* Regular tags */}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredExercises.length === 0 ? (
          <p className="text-center text-gray-500 py-8 text-lg">
            {exercises.length === 0
              ? 'Nessun esercizio nel catalogo.'
              : 'Nessun esercizio corrisponde ai criteri di ricerca.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => onSelect(exercise)}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800 border border-gray-700 hover:border-primary hover:bg-gray-750 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-lg">{exercise.name}</p>
                  {exercise.description && (
                    <p className="text-sm text-gray-400 line-clamp-1 mt-1">
                      {exercise.description}
                    </p>
                  )}
                  {exercise.tags && exercise.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exercise.tags.map((t) => (
                        <span
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleTag(t.tag)
                          }}
                          className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 cursor-pointer"
                        >
                          {t.tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Plus className="h-6 w-6 text-primary flex-shrink-0 ml-4" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
