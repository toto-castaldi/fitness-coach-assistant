import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormActions } from '@/components/shared'
import type { Session, SessionInsert, Client, Gym } from '@/types'

const sessionSchema = z.object({
  client_id: z.string().min(1, 'Cliente obbligatorio'),
  gym_id: z.string().optional(),
  session_date: z.string().min(1, 'Data obbligatoria'),
  status: z.enum(['planned', 'completed']),
  notes: z.string().optional(),
})

type SessionFormData = z.infer<typeof sessionSchema>

interface SessionFormProps {
  session?: Session
  clients: Client[]
  gyms: Gym[]
  onSubmit: (data: SessionInsert) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SessionForm({
  session,
  clients,
  gyms,
  onSubmit,
  onCancel,
  isSubmitting,
}: SessionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      client_id: session?.client_id || '',
      gym_id: session?.gym_id || '',
      session_date: session?.session_date || new Date().toISOString().split('T')[0],
      status: session?.status || 'planned',
      notes: session?.notes || '',
    },
  })

  const handleFormSubmit = async (data: SessionFormData) => {
    await onSubmit({
      client_id: data.client_id,
      gym_id: data.gym_id || null,
      session_date: data.session_date,
      status: data.status,
      notes: data.notes || null,
    })
  }

  const selectClassName = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente *</Label>
        <select
          id="client_id"
          {...register('client_id')}
          className={selectClassName}
          disabled={!!session}
        >
          <option value="">Seleziona cliente...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
        {errors.client_id && (
          <p className="text-sm text-destructive">{errors.client_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gym_id">Palestra</Label>
        <select
          id="gym_id"
          {...register('gym_id')}
          className={selectClassName}
        >
          <option value="">Nessuna palestra</option>
          {gyms.map((gym) => (
            <option key={gym.id} value={gym.id}>
              {gym.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="session_date">Data *</Label>
        <Input
          id="session_date"
          type="date"
          {...register('session_date')}
        />
        {errors.session_date && (
          <p className="text-sm text-destructive">{errors.session_date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Stato</Label>
        <select
          id="status"
          {...register('status')}
          className={selectClassName}
        >
          <option value="planned">Pianificata</option>
          <option value="completed">Completata</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Note</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Note sulla sessione..."
          rows={3}
        />
      </div>

      <FormActions
        isSubmitting={isSubmitting}
        isEditing={!!session}
        onCancel={onCancel}
      />
    </form>
  )
}
