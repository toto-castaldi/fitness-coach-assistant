import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GymForm } from '@/components/gyms/GymForm'
import { GymCard } from '@/components/gyms/GymCard'
import { useGyms } from '@/hooks/useGyms'
import type { Gym, GymInsert } from '@/types'

export function Gyms() {
  const { gyms, loading, error, createGym, updateGym, deleteGym } = useGyms()
  const [showForm, setShowForm] = useState(false)
  const [editingGym, setEditingGym] = useState<Gym | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Gym | null>(null)

  const handleCreate = async (data: GymInsert) => {
    setIsSubmitting(true)
    const result = await createGym(data)
    setIsSubmitting(false)
    if (result) {
      setShowForm(false)
    }
  }

  const handleUpdate = async (data: GymInsert) => {
    if (!editingGym) return
    setIsSubmitting(true)
    const result = await updateGym(editingGym.id, data)
    setIsSubmitting(false)
    if (result) {
      setEditingGym(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteGym(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleEdit = (gym: Gym) => {
    setEditingGym(gym)
    setShowForm(false)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGym(null)
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
        <h1 className="text-2xl font-bold">Palestre</h1>
        {!showForm && !editingGym && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova
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
              <CardTitle className="text-lg">Nuova Palestra</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GymForm
              onSubmit={handleCreate}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingGym && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Modifica Palestra</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <GymForm
              gym={editingGym}
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
              Eliminare <strong>{deleteConfirm.name}</strong>?
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

      {/* Gym List */}
      {!showForm && !editingGym && (
        <div className="space-y-3">
          {gyms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessuna palestra ancora.</p>
              <p className="text-sm">Aggiungi la tua prima palestra per iniziare.</p>
            </div>
          ) : (
            gyms.map((gym) => (
              <GymCard
                key={gym.id}
                gym={gym}
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
