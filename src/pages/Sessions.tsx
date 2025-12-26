import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Play, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SessionForm } from '@/components/sessions/SessionForm'
import { SessionCard } from '@/components/sessions/SessionCard'
import {
  LoadingSpinner,
  ErrorAlert,
  DeleteConfirmDialog,
  EmptyState,
  FormCard,
  PageHeader,
} from '@/components/shared'
import { useSessions } from '@/hooks/useSessions'
import { useClients } from '@/hooks/useClients'
import { useGyms } from '@/hooks/useGyms'
import type { SessionInsert, SessionWithDetails } from '@/types'

export function Sessions() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const exerciseFilter = searchParams.get('exercise')

  const { sessions, loading, error, createSession, deleteSession } = useSessions()
  const { clients } = useClients()
  const { gyms } = useGyms()

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<SessionWithDetails | null>(null)

  const filteredSessions = useMemo(() => {
    if (!exerciseFilter) return sessions
    return sessions.filter(session =>
      session.exercises?.some(ex => ex.exercise_id === exerciseFilter)
    )
  }, [sessions, exerciseFilter])

  const filterExerciseName = useMemo(() => {
    if (!exerciseFilter || filteredSessions.length === 0) return null
    for (const session of filteredSessions) {
      const ex = session.exercises?.find(e => e.exercise_id === exerciseFilter)
      if (ex?.exercise?.name) return ex.exercise.name
    }
    return null
  }, [exerciseFilter, filteredSessions])

  const clearFilter = () => {
    setSearchParams({})
  }

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
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <PageHeader title="Sessioni">
          {!showForm && (
            <div className="flex gap-2">
              <Button size="sm" variant="default" onClick={() => navigate('/live')}>
                <Play className="h-4 w-4 mr-2" />
                Live
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/planning')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Pianifica AI
              </Button>
              <Button size="sm" onClick={() => setShowForm(true)}>
                Nuova
              </Button>
            </div>
          )}
        </PageHeader>
        {exerciseFilter && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm flex-1">
              Filtro: <strong>{filterExerciseName || 'esercizio'}</strong>
            </span>
            <Button size="sm" variant="ghost" onClick={clearFilter}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {showForm && (
        <FormCard title="Nuova Sessione" onClose={() => setShowForm(false)}>
          <SessionForm
            clients={clients}
            gyms={gyms}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
          />
        </FormCard>
      )}

      {deleteConfirm && (
        <DeleteConfirmDialog
          itemName={`sessione del ${new Date(deleteConfirm.session_date).toLocaleDateString('it-IT')} per ${deleteConfirm.client?.first_name} ${deleteConfirm.client?.last_name}`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {!showForm && (
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            exerciseFilter ? (
              <EmptyState title="Nessuna sessione con questo esercizio." />
            ) : (
              <EmptyState
                title="Nessuna sessione ancora."
                description="Crea la tua prima sessione per iniziare."
              />
            )
          ) : (
            filteredSessions.map((session) => (
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
