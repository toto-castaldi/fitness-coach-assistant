import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { ExerciseCard } from '@/components/exercises/ExerciseCard'
import { ExerciseFilterBar } from '@/components/exercises/ExerciseFilterBar'
import {
  LoadingSpinner,
  ErrorAlert,
  DeleteConfirmDialog,
  EmptyState,
  FormCard,
  PageHeader,
} from '@/components/shared'
import { useExercises } from '@/hooks/useExercises'
import { useFilteredExercises } from '@/hooks/useFilteredExercises'
import { useEntityPage } from '@/hooks/useEntityPage'
import type { ExerciseWithDetails, ExerciseInsert, ExerciseBlockInsert } from '@/types'

export function Exercises() {
  const {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    uploadImage,
  } = useExercises()

  const {
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    clearTags,
    allTags,
    filteredExercises,
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

  const uploadImagesAndGetUrls = async (
    blocks: ExerciseBlockInsert[],
    newImages: { blockId: string; file: File }[]
  ) => {
    const imageUrls: { [blockId: string]: string } = {}
    for (const { blockId, file } of newImages) {
      const url = await uploadImage(file)
      if (url) {
        imageUrls[blockId] = url
      }
    }

    return blocks.map((block, index) => {
      const matchingImage = newImages[index]
      if (matchingImage && imageUrls[matchingImage.blockId]) {
        return { ...block, image_url: imageUrls[matchingImage.blockId] }
      }
      return block
    })
  }

  const onSubmitCreate = async (
    data: ExerciseInsert,
    blocks: ExerciseBlockInsert[],
    tags: string[],
    newImages: { blockId: string; file: File }[]
  ) => {
    setIsSubmitting(true)
    const blocksWithUrls = await uploadImagesAndGetUrls(blocks, newImages)
    const result = await createExercise(data, blocksWithUrls, tags)
    setIsSubmitting(false)
    if (result) {
      closeForm()
    }
  }

  const onSubmitUpdate = async (
    data: ExerciseInsert,
    blocks: ExerciseBlockInsert[],
    tags: string[],
    newImages: { blockId: string; file: File }[]
  ) => {
    if (!editingItem) return
    setIsSubmitting(true)
    const updatedBlocks = await uploadImagesAndGetUrls(blocks, newImages)
    const result = await updateExercise(editingItem.id, data, updatedBlocks, tags)
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

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Esercizi"
        showAddButton={!isFormVisible}
        onAdd={openCreateForm}
      />

      {error && <ErrorAlert message={error} />}

      {!isFormVisible && (
        <ExerciseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTags={allTags}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
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
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
