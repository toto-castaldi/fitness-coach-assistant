import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, FolderGit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { FormActions } from '@/components/shared'
import { LumioCardPicker, LumioCardPreviewInline } from '@/components/lumio'
import type { ExerciseWithDetails, ExerciseInsert, LumioLocalCardWithRepository } from '@/types'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  description: z.string().optional(),
})

type ExerciseFormData = z.infer<typeof exerciseSchema>

interface ExerciseFormProps {
  exercise?: ExerciseWithDetails
  existingTags?: string[]
  onSubmit: (
    data: ExerciseInsert,
    tags: string[]
  ) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ExerciseForm({ exercise, existingTags = [], onSubmit, onCancel, isSubmitting }: ExerciseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: exercise?.name || '',
      description: exercise?.description || '',
    },
  })

  // Lumio local card state
  const [selectedCard, setSelectedCard] = useState<LumioLocalCardWithRepository | null>(() => {
    if (exercise?.lumio_card) {
      return exercise.lumio_card as LumioLocalCardWithRepository
    }
    return null
  })
  const [showCardPicker, setShowCardPicker] = useState(false)

  const [tags, setTags] = useState<string[]>(() => {
    return exercise?.tags?.map(t => t.tag) || []
  })

  const [newTag, setNewTag] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)

  // Filter existing tags that match input and aren't already selected
  const tagSuggestions = newTag.trim()
    ? existingTags.filter(
        t => t.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(t)
      )
    : []

  const addTag = (tagToAdd?: string) => {
    const trimmed = (tagToAdd || newTag).trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setNewTag('')
      setShowTagSuggestions(false)
    }
  }

  const selectSuggestion = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
      setNewTag('')
      setShowTagSuggestions(false)
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false)
    }
  }

  const handleSelectCard = (card: LumioLocalCardWithRepository) => {
    setSelectedCard(card)
    setShowCardPicker(false)
  }

  const handleRemoveCard = () => {
    setSelectedCard(null)
  }

  const handleFormSubmit = async (data: ExerciseFormData) => {
    await onSubmit(
      {
        name: data.name,
        description: data.description || null,
        lumio_card_id: selectedCard?.id || null,
      },
      tags
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome esercizio *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Es. Squat con bilanciere"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrizione</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descrivi l'esercizio..."
            rows={3}
          />
        </div>

        {/* Lumio Card Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <FolderGit2 className="h-4 w-4" />
            Carta Lumio
          </Label>
          {selectedCard ? (
            <LumioCardPreviewInline
              card={selectedCard}
              onRemove={handleRemoveCard}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCardPicker(true)}
              className="w-full"
            >
              <FolderGit2 className="h-4 w-4 mr-2" />
              Seleziona carta dal repository
            </Button>
          )}
        </div>
      </div>

      {/* Card Picker Modal */}
      {showCardPicker && (
        <LumioCardPicker
          onSelect={handleSelectCard}
          onCancel={() => setShowCardPicker(false)}
          selectedCardId={selectedCard?.id}
        />
      )}

      {/* Tags Section */}
      <div className="space-y-3">
        <Label>Tag</Label>
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => {
                setNewTag(e.target.value)
                setShowTagSuggestions(true)
              }}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => setShowTagSuggestions(false), 150)
              }}
              onKeyDown={handleTagKeyDown}
              placeholder="Aggiungi tag..."
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={() => addTag()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tag suggestions dropdown */}
          {showTagSuggestions && tagSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-32 overflow-y-auto">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => selectSuggestion(tag)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <FormActions
        isSubmitting={isSubmitting}
        isEditing={!!exercise}
        onCancel={onCancel}
      />
    </form>
  )
}
