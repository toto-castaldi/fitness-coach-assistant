import { useState } from 'react'
import { RepositoryForm, RepositoryList, RepositoryCardsDialog } from '@/components/repositories'
import {
  LoadingSpinner,
  ErrorAlert,
  DeleteConfirmDialog,
  FormCard,
  PageHeader,
} from '@/components/shared'
import { useRepositories } from '@/hooks/useRepositories'
import { useEntityPage } from '@/hooks/useEntityPage'
import type { LumioRepository, LumioRepositoryInsert } from '@/types'

export function Repositories() {
  const [viewingCardsRepo, setViewingCardsRepo] = useState<LumioRepository | null>(null)
  // Realtime updates are handled automatically by useRepositories hook
  const {
    repositories,
    loading,
    error,
    createRepository,
    updateRepository,
    deleteRepository,
  } = useRepositories()

  const {
    showForm,
    editingItem,
    isSubmitting,
    deleteConfirm,
    isFormVisible,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useEntityPage<LumioRepository>()

  const onSubmitCreate = async (data: LumioRepositoryInsert) => {
    // Repository is automatically registered with Docora in createRepository
    await handleCreate(createRepository, data)
  }

  const onSubmitUpdate = async (data: LumioRepositoryInsert) => {
    await handleUpdate(updateRepository, data)
  }

  const onConfirmDelete = async () => {
    await handleDelete(deleteRepository)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repository Lumio"
        showAddButton={!isFormVisible}
        addButtonLabel="Aggiungi"
        onAdd={openCreateForm}
      />

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <FormCard title="Nuovo Repository" onClose={closeForm}>
          <RepositoryForm
            onSubmit={onSubmitCreate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </FormCard>
      )}

      {editingItem && (
        <FormCard title="Modifica Repository" onClose={closeForm}>
          <RepositoryForm
            repository={editingItem}
            onSubmit={onSubmitUpdate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
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
        <RepositoryList
          repositories={repositories}
          onEdit={openEditForm}
          onDelete={openDeleteConfirm}
          onViewCards={setViewingCardsRepo}
        />
      )}

      {viewingCardsRepo && (
        <RepositoryCardsDialog
          repository={viewingCardsRepo}
          onClose={() => setViewingCardsRepo(null)}
        />
      )}
    </div>
  )
}
