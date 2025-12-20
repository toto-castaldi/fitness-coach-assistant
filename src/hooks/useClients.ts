import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client, ClientInsert, ClientUpdate } from '@/types'

export function useClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .order('last_name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setClients(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const createClient = async (client: ClientInsert): Promise<Client | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utente non autenticato')
      return null
    }

    const { data, error: insertError } = await supabase
      .from('clients')
      .insert({ ...client, user_id: user.id })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    setClients((prev) => [...prev, data].sort((a, b) =>
      a.last_name.localeCompare(b.last_name)
    ))
    return data
  }

  const updateClient = async (id: string, updates: ClientUpdate): Promise<Client | null> => {
    const { data, error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    setClients((prev) =>
      prev.map((c) => (c.id === id ? data : c)).sort((a, b) =>
        a.last_name.localeCompare(b.last_name)
      )
    )
    return data
  }

  const deleteClient = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setClients((prev) => prev.filter((c) => c.id !== id))
    return true
  }

  const getClient = async (id: string): Promise<Client | null> => {
    const { data, error: fetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      return null
    }

    return data
  }

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClient,
    refetch: fetchClients,
  }
}
