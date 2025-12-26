import { GymForm } from '@/components/gyms/GymForm'
import { GymCard } from '@/components/gyms/GymCard'
import {
  LoadingSpinner,
  ErrorAlert,
  DeleteConfirmDialog,
  EmptyState,
  FormCard,
  PageHeader,
} from '@/components/shared'
import { useGyms } from '@/hooks/useGyms'
import { useEntityPage } from '@/hooks/useEntityPage'
import type { Gym, GymInsert } from '@/types'

export function Gyms() {
  const { gyms, loading, error, createGym, updateGym, deleteGym } = useGyms()
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
  } = useEntityPage<Gym>()

  const onSubmitCreate = async (data: GymInsert) => {
    await handleCreate(createGym, data)
  }

  const onSubmitUpdate = async (data: GymInsert) => {
    await handleUpdate(updateGym, data)
  }

  const onConfirmDelete = async () => {
    await handleDelete(deleteGym)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Palestre"
        showAddButton={!isFormVisible}
        addButtonLabel="Nuova"
        onAdd={openCreateForm}
      />

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <FormCard title="Nuova Palestra" onClose={closeForm}>
          <GymForm
            onSubmit={onSubmitCreate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </FormCard>
      )}

      {editingItem && (
        <FormCard title="Modifica Palestra" onClose={closeForm}>
          <GymForm
            gym={editingItem}
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
        <div className="space-y-3">
          {gyms.length === 0 ? (
            <EmptyState
              title="Nessuna palestra ancora."
              description="Aggiungi la tua prima palestra per iniziare."
            />
          ) : (
            gyms.map((gym) => (
              <GymCard
                key={gym.id}
                gym={gym}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
