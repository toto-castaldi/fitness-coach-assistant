import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SessionForm } from '@/components/sessions/SessionForm'
import { SessionCard } from '@/components/sessions/SessionCard'
import { useSessions } from '@/hooks/useSessions'
import { useClients } from '@/hooks/useClients'
import { useGyms } from '@/hooks/useGyms'
import type { SessionInsert, SessionWithDetails } from '@/types'

export function Sessions() {
  const navigate = useNavigate()
  const { sessions, loading, error, createSession, deleteSession } = useSessions()
  const { clients } = useClients()
  const { gyms } = useGyms()

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<SessionWithDetails | null>(null)

  const handleCreate = async (data: SessionInsert) => {
    setIsSubmitting(true)
    const result = await createSession(data)
    setIsSubmitting(false)
    if (result) {
      setShowForm(false)
      navigate(`/sessions/${result.id}`)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteSession(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleView = (session: SessionWithDetails) => {
    navigate(`/sessions/${session.id}`)
  }

  const handleEdit = (session: SessionWithDetails) => {
    navigate(`/sessions/${session.id}`)
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
        <h1 className="text-2xl font-bold">Sessioni</h1>
        {!showForm && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate('/planning')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Pianifica AI
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova
            </Button>
          </div>
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
              <CardTitle className="text-lg">Nuova Sessione</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SessionForm
              clients={clients}
              gyms={gyms}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
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
              Eliminare la sessione del{' '}
              <strong>
                {new Date(deleteConfirm.session_date).toLocaleDateString('it-IT')}
              </strong>{' '}
              per{' '}
              <strong>
                {deleteConfirm.client?.first_name} {deleteConfirm.client?.last_name}
              </strong>
              ?
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

      {/* Session List */}
      {!showForm && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nessuna sessione ancora.</p>
              <p className="text-sm">Crea la tua prima sessione per iniziare.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={handleEdit}
                onDelete={setDeleteConfirm}
                onView={handleView}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
