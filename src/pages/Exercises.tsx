import { useState } from 'react'
import { Download } from 'lucide-react'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { ExerciseCard } from '@/components/exercises/ExerciseCard'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import { ExerciseDetailModal } from '@/components/live/ExerciseDetailModal'
import {
  LoadingSpinner,
  ErrorAlert,
  DeleteConfirmDialog,
  EmptyState,
  FormCard,
  PageHeader,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { useExercises } from '@/hooks/useExercises'
import { useFilteredExercises } from '@/hooks/useFilteredExercises'
import { useEntityPage } from '@/hooks/useEntityPage'
import type { ExerciseWithDetails, ExerciseInsert } from '@/types'

export function Exercises() {
  const [viewingExercise, setViewingExercise] = useState<ExerciseWithDetails | null>(null)

  const {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
  } = useExercises()

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

  const {
    showForm,
    editingItem,
    isSubmitting,
    deleteConfirm,
    isFormVisible,
    openCreateForm,
    openEditForm,
    closeForm,
    setIsSubmitting,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useEntityPage<ExerciseWithDetails>()

  const onSubmitCreate = async (data: ExerciseInsert, tags: string[]) => {
    setIsSubmitting(true)
    const result = await createExercise(data, tags)
    setIsSubmitting(false)
    if (result) {
      closeForm()
    }
  }

  const onSubmitUpdate = async (data: ExerciseInsert, tags: string[]) => {
    if (!editingItem) return
    setIsSubmitting(true)
    const result = await updateExercise(editingItem.id, data, tags)
    setIsSubmitting(false)
    if (result) {
      closeForm()
    }
  }

  const onConfirmDelete = async () => {
    if (!deleteConfirm) return
    await deleteExercise(deleteConfirm.id)
    closeDeleteConfirm()
  }

  const exportExercises = () => {
    if (filteredExercises.length === 0) return

    const lines: string[] = ['# Esercizi Disponibili', '']

    // Criteri di selezione
    if (searchQuery || selectedTags.length > 0) {
      lines.push('## Criteri di selezione', '')
      if (searchQuery) {
        lines.push(`- **Ricerca**: "${searchQuery}"`)
      }
      if (selectedTags.length > 0) {
        lines.push(`- **Tag**: ${selectedTags.join(', ')}`)
      }
      lines.push('')
    }

    lines.push(`## Elenco (${filteredExercises.length} esercizi)`, '')

    filteredExercises.forEach((exercise, index) => {
      const tags = exercise.tags?.map(t => t.tag).join(', ') || ''
      const tagsPart = tags ? ` [${tags}]` : ''
      lines.push(`${index + 1}. **${exercise.name}**${tagsPart}`)
      if (exercise.description) {
        lines.push(`   ${exercise.description}`)
      }
      lines.push('')
    })

    const markdown = lines.join('\n')
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'esercizi.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Esercizi"
        showAddButton={!isFormVisible}
        onAdd={openCreateForm}
      >
        {!isFormVisible && filteredExercises.length > 0 && (
          <Button size="sm" variant="outline" onClick={exportExercises}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </PageHeader>

      {error && <ErrorAlert message={error} />}

      {!isFormVisible && (
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
        />
      )}

      {showForm && (
        <FormCard title="Nuovo Esercizio" onClose={closeForm}>
          <ExerciseForm
            onSubmit={onSubmitCreate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
            existingTags={allTags}
          />
        </FormCard>
      )}

      {editingItem && (
        <FormCard title="Modifica Esercizio" onClose={closeForm}>
          <ExerciseForm
            exercise={editingItem}
            onSubmit={onSubmitUpdate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
            existingTags={allTags}
          />
        </FormCard>
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          itemName={deleteConfirm.name}
          onConfirm={onConfirmDelete}
          onCancel={closeDeleteConfirm}
        />
      )}

      {!isFormVisible && (
        <div className="space-y-3">
          {filteredExercises.length === 0 ? (
            exercises.length === 0 ? (
              <EmptyState
                title="Nessun esercizio ancora."
                description="Crea il tuo primo esercizio personalizzato."
              />
            ) : (
              <EmptyState title="Nessun esercizio corrisponde ai criteri di ricerca." />
            )
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
                onTagClick={toggleTag}
                onViewBlocks={setViewingExercise}
              />
            ))
          )}
        </div>
      )}

      {viewingExercise && (
        <ExerciseDetailModal
          exercise={viewingExercise}
          onClose={() => setViewingExercise(null)}
        />
      )}
    </div>
  )
}
