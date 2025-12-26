import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormActions } from '@/components/shared'
import type { Gym, GymInsert } from '@/types'

const gymSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  address: z.string().optional(),
  description: z.string().optional(),
})

type GymFormData = z.infer<typeof gymSchema>

interface GymFormProps {
  gym?: Gym
  onSubmit: (data: GymInsert) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function GymForm({ gym, onSubmit, onCancel, isSubmitting }: GymFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GymFormData>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      name: gym?.name || '',
      address: gym?.address || '',
      description: gym?.description || '',
    },
  })

  const handleFormSubmit = async (data: GymFormData) => {
    await onSubmit({
      name: data.name,
      address: data.address || null,
      description: data.description || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Palestra Centrale"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Indirizzo</Label>
        <Input
          id="address"
          {...register('address')}
          placeholder="Via Roma 123, Milano"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione e attrezzature</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Descrizione della palestra, attrezzature disponibili..."
          rows={4}
        />
      </div>

      <FormActions
        isSubmitting={isSubmitting}
        isEditing={!!gym}
        onCancel={onCancel}
      />
    </form>
  )
}
