import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Gym, GymInsert, GymUpdate } from '@/types'

export function useGyms() {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGyms = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('gyms')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setGyms(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchGyms()
  }, [fetchGyms])

  const createGym = async (gym: GymInsert): Promise<Gym | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utente non autenticato')
      return null
    }

    const { data, error: insertError } = await supabase
      .from('gyms')
      .insert({ ...gym, user_id: user.id })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    setGyms((prev) => [...prev, data].sort((a, b) =>
      a.name.localeCompare(b.name)
    ))
    return data
  }

  const updateGym = async (id: string, updates: GymUpdate): Promise<Gym | null> => {
    const { data, error: updateError } = await supabase
      .from('gyms')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    setGyms((prev) =>
      prev.map((g) => (g.id === id ? data : g)).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    )
    return data
  }

  const deleteGym = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('gyms')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setGyms((prev) => prev.filter((g) => g.id !== id))
    return true
  }

  const getGym = useCallback(async (id: string): Promise<Gym | null> => {
    const { data, error: fetchError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      return null
    }

    return data
  }, [])

  return {
    gyms,
    loading,
    error,
    createGym,
    updateGym,
    deleteGym,
    getGym,
    refetch: fetchGyms,
  }
}
