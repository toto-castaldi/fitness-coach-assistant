import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Dumbbell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ExerciseWithDetails } from '@/types'

export function Dashboard() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchExercises() {
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch user's exercises
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user?.id)
        .order('name', { ascending: true })

      if (!exercisesData || exercisesData.length === 0) {
        setExercises([])
        setLoading(false)
        return
      }

      const exerciseIds = exercisesData.map(e => e.id)

      const [blocksResult, tagsResult] = await Promise.all([
        supabase
          .from('exercise_blocks')
          .select('*')
          .in('exercise_id', exerciseIds)
          .order('order_index', { ascending: true }),
        supabase
          .from('exercise_tags')
          .select('*')
          .in('exercise_id', exerciseIds)
      ])

      const blocksMap = new Map<string, typeof blocksResult.data>()
      const tagsMap = new Map<string, typeof tagsResult.data>()

      blocksResult.data?.forEach(block => {
        const existing = blocksMap.get(block.exercise_id) || []
        blocksMap.set(block.exercise_id, [...existing, block])
      })

      tagsResult.data?.forEach(tag => {
        const existing = tagsMap.get(tag.exercise_id) || []
        tagsMap.set(tag.exercise_id, [...existing, tag])
      })

      const exercisesWithDetails: ExerciseWithDetails[] = exercisesData.map(exercise => ({
        ...exercise,
        blocks: blocksMap.get(exercise.id) || [],
        tags: tagsMap.get(exercise.id) || []
      }))

      setExercises(exercisesWithDetails)
      setLoading(false)
    }

    fetchExercises()
  }, [])

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    exercises.forEach(ex => {
      ex.tags?.forEach(t => tagSet.add(t.tag))
    })
    return Array.from(tagSet).sort()
  }, [exercises])

  // Filter exercises by selected tags and search query
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = exercise.name.toLowerCase().includes(query)
        const matchesDescription = exercise.description?.toLowerCase().includes(query)
        if (!matchesName && !matchesDescription) return false
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        const exerciseTags = exercise.tags?.map(t => t.tag) || []
        return selectedTags.every(tag => exerciseTags.includes(tag))
      }

      return true
    })
  }, [exercises, selectedTags, searchQuery])

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Esercizi</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca esercizi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tag filters */}
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

      {/* Exercise list */}
      {filteredExercises.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {exercises.length === 0
            ? "Nessun esercizio. Vai alla sezione Esercizi per crearne uno."
            : "Nessun esercizio corrisponde ai filtri"}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/exercise/${exercise.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{exercise.name}</h3>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {exercise.description}
                      </p>
                    )}
                    {exercise.tags && exercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exercise.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.tag}
                          </Badge>
                        ))}
                        {exercise.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{exercise.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
