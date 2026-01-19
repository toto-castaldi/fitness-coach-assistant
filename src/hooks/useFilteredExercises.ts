import { useState, useMemo, useCallback } from 'react'
import type { ExerciseWithDetails } from '@/types'

export function useFilteredExercises(exercises: ExerciseWithDetails[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showNoTags, setShowNoTags] = useState(false)
  const [showNoInfo, setShowNoInfo] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    exercises.forEach(ex => {
      ex.tags?.forEach(t => tagSet.add(t.tag))
    })
    return Array.from(tagSet).sort()
  }, [exercises])

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = !searchQuery.trim() ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // If showNoInfo is active, only show exercises without lumio_card_id
      if (showNoInfo) {
        const hasNoLumioCard = !ex.lumio_card_id
        return matchesSearch && hasNoLumioCard
      }

      // If showNoTags is active, only show exercises without tags
      if (showNoTags) {
        const hasNoTags = !ex.tags || ex.tags.length === 0
        return matchesSearch && hasNoTags
      }

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag =>
          ex.tags?.some(t => t.tag === tag)
        )

      return matchesSearch && matchesTags
    })
  }, [exercises, searchQuery, selectedTags, showNoTags, showNoInfo])

  const toggleTag = useCallback((tag: string) => {
    // When selecting a tag, disable special filters
    setShowNoTags(false)
    setShowNoInfo(false)
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  const toggleNoTags = useCallback(() => {
    setShowNoTags(prev => !prev)
    // When enabling showNoTags, clear selected tags and disable showNoInfo
    if (!showNoTags) {
      setSelectedTags([])
      setShowNoInfo(false)
    }
  }, [showNoTags])

  const toggleNoInfo = useCallback(() => {
    setShowNoInfo(prev => !prev)
    // When enabling showNoInfo, clear selected tags and disable showNoTags
    if (!showNoInfo) {
      setSelectedTags([])
      setShowNoTags(false)
    }
  }, [showNoInfo])

  const clearTags = useCallback(() => {
    setSelectedTags([])
    setShowNoTags(false)
    setShowNoInfo(false)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    clearTags,
    allTags,
    filteredExercises,
    showNoTags,
    toggleNoTags,
    showNoInfo,
    toggleNoInfo,
  }
}
