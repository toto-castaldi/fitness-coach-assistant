import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientForm } from '@/components/clients/ClientForm'
import { ClientCard } from '@/components/clients/ClientCard'
import { useClients } from '@/hooks/useClients'
import type { Client, ClientInsert } from '@/types'

export function Clients() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients()
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null)

  const handleCreate = async (data: ClientInsert) => {
    setIsSubmitting(true)
    const result = await createClient(data)
    setIsSubmitting(false)
    if (result) {
      setShowForm(false)
    }
  }

  const handleUpdate = async (data: ClientInsert) => {
    if (!editingClient) return
    setIsSubmitting(true)
    const result = await updateClient(editingClient.id, data)
    setIsSubmitting(false)
    if (result) {
      setEditingClient(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteClient(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setShowForm(false)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingClient(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clienti</h1>
        {!showForm && !editingClient && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Nuovo Cliente</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ClientForm
              onSubmit={handleCreate}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingClient && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Modifica Cliente</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ClientForm
              client={editingClient}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="mb-4">
              Eliminare <strong>{deleteConfirm.last_name} {deleteConfirm.first_name}</strong>?
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete}>
                Elimina
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {!showForm && !editingClient && (
        <div className="space-y-3">
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessun cliente ancora.</p>
              <p className="text-sm">Aggiungi il tuo primo cliente per iniziare.</p>
            </div>
          ) : (
            clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onEdit={handleEdit}
                onDelete={setDeleteConfirm}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
