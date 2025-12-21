import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Exercise,
  ExerciseWithDetails,
  ExerciseInsert,
  ExerciseUpdate,
  ExerciseBlockInsert
} from '@/types'

export function useExercises() {
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch only user's exercises (not default ones)
    const { data: exercisesData, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user?.id)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    if (!exercisesData || exercisesData.length === 0) {
      setExercises([])
      setLoading(false)
      return
    }

    // Fetch blocks and tags for all exercises
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
  }, [])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const createExercise = async (
    exercise: ExerciseInsert,
    blocks: ExerciseBlockInsert[],
    tags: string[]
  ): Promise<ExerciseWithDetails | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utente non autenticato')
      return null
    }

    // Create exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .insert({ ...exercise, user_id: user.id })
      .select()
      .single()

    if (exerciseError) {
      setError(exerciseError.message)
      return null
    }

    // Create blocks
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        exercise_id: exerciseData.id,
        image_url: block.image_url,
        description: block.description,
        order_index: block.order_index ?? index
      }))

      const { error: blocksError } = await supabase
        .from('exercise_blocks')
        .insert(blocksToInsert)

      if (blocksError) {
        setError(blocksError.message)
      }
    }

    // Create tags
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        exercise_id: exerciseData.id,
        tag
      }))

      const { error: tagsError } = await supabase
        .from('exercise_tags')
        .insert(tagsToInsert)

      if (tagsError) {
        setError(tagsError.message)
      }
    }

    await fetchExercises()
    return exerciseData
  }

  const updateExercise = async (
    id: string,
    exercise: ExerciseUpdate,
    blocks: ExerciseBlockInsert[],
    tags: string[]
  ): Promise<Exercise | null> => {
    // Update exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .update(exercise)
      .eq('id', id)
      .select()
      .single()

    if (exerciseError) {
      setError(exerciseError.message)
      return null
    }

    // Delete existing blocks and tags, then recreate
    await Promise.all([
      supabase.from('exercise_blocks').delete().eq('exercise_id', id),
      supabase.from('exercise_tags').delete().eq('exercise_id', id)
    ])

    // Recreate blocks
    if (blocks.length > 0) {
      const blocksToInsert = blocks.map((block, index) => ({
        exercise_id: id,
        image_url: block.image_url,
        description: block.description,
        order_index: block.order_index ?? index
      }))

      await supabase.from('exercise_blocks').insert(blocksToInsert)
    }

    // Recreate tags
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        exercise_id: id,
        tag
      }))

      await supabase.from('exercise_tags').insert(tagsToInsert)
    }

    await fetchExercises()
    return exerciseData
  }

  const deleteExercise = async (id: string): Promise<boolean> => {
    // Delete associated images from storage
    const exercise = exercises.find(e => e.id === id)
    if (exercise?.blocks) {
      for (const block of exercise.blocks) {
        if (block.image_url) {
          const path = block.image_url.split('/').pop()
          if (path) {
            await supabase.storage.from('exercise-images').remove([path])
          }
        }
      }
    }

    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setExercises(prev => prev.filter(e => e.id !== id))
    return true
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utente non autenticato')
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('exercise-images')
      .upload(fileName, file)

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const deleteImage = async (url: string): Promise<boolean> => {
    const path = url.split('exercise-images/').pop()
    if (!path) return false

    const { error } = await supabase.storage
      .from('exercise-images')
      .remove([path])

    if (error) {
      setError(error.message)
      return false
    }

    return true
  }

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>()
    exercises.forEach(ex => {
      ex.tags?.forEach(t => tagSet.add(t.tag))
    })
    return Array.from(tagSet).sort()
  }, [exercises])

  return {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    uploadImage,
    deleteImage,
    getAllTags,
    refetch: fetchExercises,
  }
}
