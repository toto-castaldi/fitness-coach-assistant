import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Client, ClientInsert } from '@/types'

const clientSchema = z.object({
  first_name: z.string().min(1, 'Nome obbligatorio'),
  last_name: z.string().min(1, 'Cognome obbligatorio'),
  birth_date: z.string().optional(),
  age_years: z.string().optional(),
  physical_notes: z.string().optional(),
}).refine(
  (data) => data.birth_date || data.age_years,
  {
    message: 'Inserisci data di nascita o età',
    path: ['birth_date'],
  }
).refine(
  (data) => !data.age_years || (parseInt(data.age_years) > 0 && parseInt(data.age_years) <= 120),
  {
    message: 'Età non valida',
    path: ['age_years'],
  }
)

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  client?: Client
  onSubmit: (data: ClientInsert) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ClientForm({ client, onSubmit, onCancel, isSubmitting }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: client?.first_name || '',
      last_name: client?.last_name || '',
      birth_date: client?.birth_date || '',
      age_years: client?.age_years?.toString() || '',
      physical_notes: client?.physical_notes || '',
    },
  })

  const birthDate = watch('birth_date')
  const ageYears = watch('age_years')

  const handleFormSubmit = async (data: ClientFormData) => {
    await onSubmit({
      first_name: data.first_name,
      last_name: data.last_name,
      birth_date: data.birth_date || null,
      age_years: data.age_years ? parseInt(data.age_years) : null,
      physical_notes: data.physical_notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="first_name">Nome *</Label>
        <Input
          id="first_name"
          {...register('first_name')}
          placeholder="Mario"
        />
        {errors.first_name && (
          <p className="text-sm text-destructive">{errors.first_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="last_name">Cognome *</Label>
        <Input
          id="last_name"
          {...register('last_name')}
          placeholder="Rossi"
        />
        {errors.last_name && (
          <p className="text-sm text-destructive">{errors.last_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="birth_date">Data di nascita</Label>
          <Input
            id="birth_date"
            type="date"
            {...register('birth_date')}
            disabled={!!ageYears}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age_years">Oppure età (anni)</Label>
          <Input
            id="age_years"
            type="number"
            min="1"
            max="120"
            {...register('age_years')}
            placeholder="35"
            disabled={!!birthDate}
          />
        </div>
      </div>
      {errors.birth_date && (
        <p className="text-sm text-destructive">{errors.birth_date.message}</p>
      )}
      {errors.age_years && (
        <p className="text-sm text-destructive">{errors.age_years.message}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="physical_notes">Note condizione fisica</Label>
        <Textarea
          id="physical_notes"
          {...register('physical_notes')}
          placeholder="Problemi alla schiena, limitazioni movimenti..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Salvataggio...' : client ? 'Aggiorna' : 'Crea'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annulla
        </Button>
      </div>
    </form>
  )
}
