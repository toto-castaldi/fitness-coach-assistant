import { ClientForm } from '@/components/clients/ClientForm'
import { ClientCard } from '@/components/clients/ClientCard'
import {
  LoadingSpinner,
  ErrorAlert,
  DeleteConfirmDialog,
  EmptyState,
  FormCard,
  PageHeader,
} from '@/components/shared'
import { useClients } from '@/hooks/useClients'
import { useEntityPage } from '@/hooks/useEntityPage'
import type { Client, ClientInsert } from '@/types'

export function Clients() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients()
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
  } = useEntityPage<Client>()

  const onSubmitCreate = async (data: ClientInsert) => {
    await handleCreate(createClient, data)
  }

  const onSubmitUpdate = async (data: ClientInsert) => {
    await handleUpdate(updateClient, data)
  }

  const onConfirmDelete = async () => {
    await handleDelete(deleteClient)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clienti"
        showAddButton={!isFormVisible}
        onAdd={openCreateForm}
      />

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <FormCard title="Nuovo Cliente" onClose={closeForm}>
          <ClientForm
            onSubmit={onSubmitCreate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </FormCard>
      )}

      {editingItem && (
        <FormCard title="Modifica Cliente" onClose={closeForm}>
          <ClientForm
            client={editingItem}
            onSubmit={onSubmitUpdate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </FormCard>
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          itemName={`${deleteConfirm.last_name} ${deleteConfirm.first_name}`}
          onConfirm={onConfirmDelete}
          onCancel={closeDeleteConfirm}
        />
      )}

      {!isFormVisible && (
        <div className="space-y-3">
          {clients.length === 0 ? (
            <EmptyState
              title="Nessun cliente ancora."
              description="Aggiungi il tuo primo cliente per iniziare."
            />
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
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
