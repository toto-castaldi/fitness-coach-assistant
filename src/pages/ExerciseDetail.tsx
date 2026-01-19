import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LumioLocalCardViewer } from '@/components/lumio'
import type { ExerciseWithDetails, LumioLocalCardWithRepository } from '@/types'

export function ExerciseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<ExerciseWithDetails | null>(null)
  const [lumioCard, setLumioCard] = useState<LumioLocalCardWithRepository | null>(null)
  const [loading, setLoading] = useState(true)

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

      const { data: tagsData } = await supabase
        .from('exercise_tags')
        .select('*')
        .eq('exercise_id', id)

      // Fetch lumio card if lumio_card_id is set
      if (exerciseData.lumio_card_id) {
        const { data: cardData } = await supabase
          .from('lumio_cards')
          .select(`
            *,
            repository:lumio_repositories(*)
          `)
          .eq('id', exerciseData.lumio_card_id)
          .single()

        if (cardData) {
          setLumioCard(cardData as LumioLocalCardWithRepository)
        }
      }

      setExercise({
        ...exerciseData,
        tags: tagsData || []
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

  const hasLumioCard = !!lumioCard

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Indietro
      </Button>

      <div>
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
        {exercise.description && !hasLumioCard && (
          <p className="text-muted-foreground mt-1">{exercise.description}</p>
        )}
      </div>

      {exercise.tags && exercise.tags.length > 0 && !hasLumioCard && (
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
      {hasLumioCard && lumioCard && (
        <LumioLocalCardViewer card={lumioCard} />
      )}

      {/* No content available */}
      {!hasLumioCard && !exercise.description && (
        <p className="text-center text-muted-foreground py-8">
          Nessuna descrizione disponibile per questo esercizio
        </p>
      )}
    </div>
  )
}
