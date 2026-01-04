import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LumioCardViewer } from '@/components/markdown/LumioCardViewer'
import type { ExerciseWithDetails } from '@/types'

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<ExerciseWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cardError, setCardError] = useState(false)

  useEffect(() => {
    async function fetchExercise() {
      if (!id) return

      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single()

      if (!exerciseData) {
        setLoading(false)
        return
      }

      const [blocksResult, tagsResult] = await Promise.all([
        supabase
          .from('exercise_blocks')
          .select('*')
          .eq('exercise_id', id)
          .order('order_index', { ascending: true }),
        supabase
          .from('exercise_tags')
          .select('*')
          .eq('exercise_id', id)
      ])

      setExercise({
        ...exerciseData,
        blocks: blocksResult.data || [],
        tags: tagsResult.data || []
      })
      setLoading(false)
    }

    fetchExercise()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <p className="text-center text-muted-foreground">Esercizio non trovato</p>
      </div>
    )
  }

  // Show Lumio card if URL is set and no error occurred
  const showLumioCard = exercise.card_url && !cardError
  // Show local blocks as fallback
  const showLocalBlocks = !exercise.card_url || cardError

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Indietro
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
        {exercise.description && !showLumioCard && (
          <p className="text-muted-foreground mt-1">{exercise.description}</p>
        )}
      </div>

      {exercise.tags && exercise.tags.length > 0 && !showLumioCard && (
        <div className="flex flex-wrap gap-2">
          {exercise.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.tag}
            </Badge>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => navigate(`/sessions?exercise=${id}`)}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Vedi sessioni con questo esercizio
      </Button>

      {/* Lumio Card View */}
      {showLumioCard && (
        <LumioCardViewer
          cardUrl={exercise.card_url!}
          onError={() => setCardError(true)}
        />
      )}

      {/* Local Blocks Fallback */}
      {showLocalBlocks && (
        <>
          {exercise.blocks && exercise.blocks.length > 0 ? (
            <div className="space-y-4">
              {cardError && (
                <p className="text-sm text-muted-foreground italic">
                  Scheda esterna non disponibile. Mostrando blocchi locali.
                </p>
              )}
              {exercise.blocks.map((block, index) => (
                <Card key={block.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                        {index + 1}
                      </span>
                      Step {index + 1}
                    </div>

                    {block.image_url && (
                      <img
                        src={block.image_url}
                        alt={`Step ${index + 1}`}
                        className="w-full rounded-lg object-cover max-h-64"
                      />
                    )}

                    {block.description && (
                      <p className="text-sm">{block.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nessun blocco per questo esercizio
            </p>
          )}
        </>
      )}
    </div>
  )
}
