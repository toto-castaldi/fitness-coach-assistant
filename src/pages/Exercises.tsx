import { useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExerciseForm } from '@/components/exercises/ExerciseForm'
import { ExerciseCard } from '@/components/exercises/ExerciseCard'
import { useExercises } from '@/hooks/useExercises'
import type { ExerciseWithDetails, ExerciseInsert, ExerciseBlockInsert } from '@/types'

export function Exercises() {
  const {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    uploadImage,
    getAllTags
  } = useExercises()

  const [showForm, setShowForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseWithDetails | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ExerciseWithDetails | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const allTags = getAllTags()

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag =>
        ex.tags?.some(t => t.tag === tag)
      )

    return matchesSearch && matchesTags
  })

  const handleCreate = async (
    data: ExerciseInsert,
    blocks: ExerciseBlockInsert[],
    tags: string[],
    newImages: { blockId: string; file: File }[]
  ) => {
    setIsSubmitting(true)

    // Upload images first
    const imageUrls: { [blockId: string]: string } = {}
    for (const { blockId, file } of newImages) {
      const url = await uploadImage(file)
      if (url) {
        imageUrls[blockId] = url
      }
    }

    // Update blocks with uploaded image URLs
    const blocksWithUrls = blocks.map((block, index) => {
      const matchingImage = newImages[index]
      if (matchingImage && imageUrls[matchingImage.blockId]) {
        return { ...block, image_url: imageUrls[matchingImage.blockId] }
      }
      return block
    })

    const result = await createExercise(data, blocksWithUrls, tags)
    setIsSubmitting(false)
    if (result) {
      setShowForm(false)
    }
  }

  const handleUpdate = async (
    data: ExerciseInsert,
    blocks: ExerciseBlockInsert[],
    tags: string[],
    newImages: { blockId: string; file: File }[]
  ) => {
    if (!editingExercise) return
    setIsSubmitting(true)

    // Upload new images
    const imageUrls: { [blockId: string]: string } = {}
    for (const { blockId, file } of newImages) {
      const url = await uploadImage(file)
      if (url) {
        imageUrls[blockId] = url
      }
    }

    // Update blocks with new image URLs
    const updatedBlocks = blocks.map((block, index) => {
      const newImage = newImages.find((_, i) => i === index)
      if (newImage && imageUrls[newImage.blockId]) {
        return { ...block, image_url: imageUrls[newImage.blockId] }
      }
      return block
    })

    const result = await updateExercise(editingExercise.id, data, updatedBlocks, tags)
    setIsSubmitting(false)
    if (result) {
      setEditingExercise(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    await deleteExercise(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const handleEdit = (exercise: ExerciseWithDetails) => {
    setEditingExercise(exercise)
    setShowForm(false)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingExercise(null)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
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
        <h1 className="text-2xl font-bold">Esercizi</h1>
        {!showForm && !editingExercise && (
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

      {/* Search and Filter */}
      {!showForm && !editingExercise && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca esercizi..."
              className="pl-9"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setSelectedTags([])}
                >
                  Rimuovi filtri
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Nuovo Esercizio</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ExerciseForm
              onSubmit={handleCreate}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              existingTags={allTags}
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingExercise && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Modifica Esercizio</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ExerciseForm
              exercise={editingExercise}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              existingTags={allTags}
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

      {/* Exercise List */}
      {!showForm && !editingExercise && (
        <div className="space-y-3">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {exercises.length === 0 ? (
                <>
                  <p>Nessun esercizio ancora.</p>
                  <p className="text-sm">Crea il tuo primo esercizio personalizzato.</p>
                </>
              ) : (
                <p>Nessun esercizio corrisponde ai criteri di ricerca.</p>
              )}
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
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
