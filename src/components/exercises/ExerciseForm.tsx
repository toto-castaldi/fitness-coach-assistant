import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, GripVertical, Upload, Link, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FormActions } from '@/components/shared'
import { isValidCardUrl, normalizeCardUrl, fetchLumioCard } from '@/lib/lumio'
import { useAuth } from '@/hooks/useAuth'
import type { ExerciseWithDetails, ExerciseInsert, ExerciseBlockInsert } from '@/types'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio'),
  description: z.string().optional(),
  card_url: z.string().optional(),
})

type ExerciseFormData = z.infer<typeof exerciseSchema>

interface BlockState {
  id: string
  image_url: string | null
  description: string
  file?: File
  isNew?: boolean
}

interface ExerciseFormProps {
  exercise?: ExerciseWithDetails
  existingTags?: string[]
  onSubmit: (
    data: ExerciseInsert,
    blocks: ExerciseBlockInsert[],
    blockIds: string[],
    tags: string[],
    newImages: { blockId: string; file: File }[]
  ) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ExerciseForm({ exercise, existingTags = [], onSubmit, onCancel, isSubmitting }: ExerciseFormProps) {
  const { session } = useAuth()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: exercise?.name || '',
      description: exercise?.description || '',
      card_url: exercise?.card_url || '',
    },
  })

  const watchedCardUrl = watch('card_url')
  const [cardUrlStatus, setCardUrlStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [cardUrlError, setCardUrlError] = useState<string | null>(null)

  const [blocks, setBlocks] = useState<BlockState[]>(() => {
    if (exercise?.blocks && exercise.blocks.length > 0) {
      return exercise.blocks.map(b => ({
        id: b.id,
        image_url: b.image_url,
        description: b.description || '',
      }))
    }
    return []
  })

  const [tags, setTags] = useState<string[]>(() => {
    return exercise?.tags?.map(t => t.tag) || []
  })

  const [newTag, setNewTag] = useState('')
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Filter existing tags that match input and aren't already selected
  const tagSuggestions = newTag.trim()
    ? existingTags.filter(
        t => t.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(t)
      )
    : []

  const addBlock = () => {
    const newBlock: BlockState = {
      id: `new-${Date.now()}`,
      image_url: null,
      description: '',
      isNew: true,
    }
    setBlocks([...blocks, newBlock])
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const updateBlockDescription = (id: string, description: string) => {
    setBlocks(blocks.map(b =>
      b.id === id ? { ...b, description } : b
    ))
  }

  const handleImageSelect = (id: string, file: File) => {
    const previewUrl = URL.createObjectURL(file)
    setBlocks(blocks.map(b =>
      b.id === id ? { ...b, file, image_url: previewUrl } : b
    ))
  }

  const removeImage = (id: string) => {
    setBlocks(blocks.map(b =>
      b.id === id ? { ...b, file: undefined, image_url: null } : b
    ))
  }

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

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return

    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[newIndex]
    newBlocks[newIndex] = temp
    setBlocks(newBlocks)
  }

  const handleTestCardUrl = async () => {
    if (!watchedCardUrl || !session?.access_token) return

    const normalizedUrl = normalizeCardUrl(watchedCardUrl)

    if (!isValidCardUrl(normalizedUrl)) {
      setCardUrlStatus('invalid')
      setCardUrlError('URL non valido. Usa un URL di GitHub raw.')
      return
    }

    setCardUrlStatus('testing')
    setCardUrlError(null)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      await fetchLumioCard(normalizedUrl, supabaseUrl, session.access_token)
      setCardUrlStatus('valid')
    } catch (err) {
      setCardUrlStatus('invalid')
      setCardUrlError(err instanceof Error ? err.message : 'Errore nel test della card')
    }
  }

  const handleFormSubmit = async (data: ExerciseFormData) => {
    const blocksData: ExerciseBlockInsert[] = blocks.map((block, index) => ({
      image_url: block.file ? null : block.image_url,
      description: block.description || null,
      order_index: index,
    }))

    const blockIds = blocks.map(b => b.id)

    const newImages = blocks
      .filter(b => b.file)
      .map(b => ({ blockId: b.id, file: b.file! }))

    // Normalize card URL before saving
    const normalizedCardUrl = data.card_url ? normalizeCardUrl(data.card_url) : null

    await onSubmit(
      {
        name: data.name,
        description: data.description || null,
        card_url: normalizedCardUrl || null,
      },
      blocksData,
      blockIds,
      tags,
      newImages
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
          <Label htmlFor="description">Descrizione iniziale</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Descrivi l'esercizio..."
            rows={3}
          />
        </div>

        {/* Lumio Card URL */}
        <div className="space-y-2">
          <Label htmlFor="card_url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL Scheda Esterna (Lumio)
          </Label>
          <div className="flex gap-2">
            <Input
              id="card_url"
              type="url"
              {...register('card_url')}
              placeholder="https://raw.githubusercontent.com/..."
              className={cardUrlStatus === 'valid' ? 'border-green-500' : cardUrlStatus === 'invalid' ? 'border-destructive' : ''}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleTestCardUrl}
              disabled={!watchedCardUrl || cardUrlStatus === 'testing'}
            >
              {cardUrlStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : cardUrlStatus === 'valid' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : cardUrlStatus === 'invalid' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                'Testa'
              )}
            </Button>
          </div>
          {cardUrlError && (
            <p className="text-sm text-destructive">{cardUrlError}</p>
          )}
          {cardUrlStatus === 'valid' && (
            <p className="text-sm text-green-600">URL valido - scheda trovata</p>
          )}
          {watchedCardUrl && (
            <p className="text-xs text-muted-foreground">
              Se impostato, la scheda esterna sostituisce i blocchi locali nella visualizzazione.
            </p>
          )}
        </div>
      </div>

      {/* Blocks Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Blocchi (immagine + descrizione)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addBlock}>
            <Plus className="h-4 w-4 mr-1" />
            Aggiungi
          </Button>
        </div>

        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessun blocco. Aggiungi immagini con descrizioni.
          </p>
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <Card key={block.id}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveBlock(index, 'up')}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-center text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      {/* Image */}
                      <div className="relative">
                        {block.image_url ? (
                          <div className="relative">
                            <img
                              src={block.image_url}
                              alt={`Blocco ${index + 1}`}
                              className="w-full h-32 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removeImage(block.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[block.id]?.click()}
                            className="w-full h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                          >
                            <Upload className="h-5 w-5" />
                            <span className="text-xs">Carica immagine</span>
                          </button>
                        )}
                        <input
                          key={block.id}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={el => { fileInputRefs.current[block.id] = el }}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageSelect(block.id, file)
                              // Reset input value to allow re-selecting the same file
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>

                      {/* Description */}
                      <Textarea
                        value={block.description}
                        onChange={(e) => updateBlockDescription(block.id, e.target.value)}
                        placeholder="Descrizione del blocco..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeBlock(block.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
