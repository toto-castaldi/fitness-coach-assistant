import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { LumioRepository, LumioRepositoryInsert, LumioRepositoryUpdate } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useRepositories() {
  const [repositories, setRepositories] = useState<LumioRepository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchRepositories = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('lumio_repositories')
      .select('*')
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setRepositories(data || [])
    }

    setLoading(false)
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchRepositories()
  }, [fetchRepositories])

  // Realtime subscription for live updates from Docora webhooks
  useEffect(() => {
    const channel = supabase
      .channel('lumio_repositories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lumio_repositories',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRepo = payload.new as LumioRepository
            setRepositories((prev) => {
              // Avoid duplicates
              if (prev.some((r) => r.id === newRepo.id)) return prev
              return [...prev, newRepo].sort((a, b) => a.name.localeCompare(b.name))
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedRepo = payload.new as LumioRepository
            setRepositories((prev) =>
              prev.map((r) => (r.id === updatedRepo.id ? updatedRepo : r))
            )
          } else if (payload.eventType === 'DELETE') {
            const deletedRepo = payload.old as { id: string }
            setRepositories((prev) => prev.filter((r) => r.id !== deletedRepo.id))
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  const createRepository = async (repo: LumioRepositoryInsert): Promise<LumioRepository | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utente non autenticato')
      return null
    }

    // 1. Create repository record in database
    const { data, error: insertError } = await supabase
      .from('lumio_repositories')
      .insert({
        ...repo,
        user_id: user.id,
        sync_status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    // 2. Register with Docora for automatic sync
    try {
      const githubUrl = `https://github.com/${repo.github_owner}/${repo.github_repo}`
      const response = await supabase.functions.invoke('docora-register', {
        body: {
          action: 'register',
          repositoryId: data.id,
          githubUrl,
          githubToken: repo.access_token || undefined,
        },
      })

      if (response.error) {
        console.error('Failed to register with Docora:', response.error)
        // Don't fail - repo is created, just not registered with Docora yet
      } else {
        // Refresh to get updated docora_repository_id
        const { data: updatedRepo } = await supabase
          .from('lumio_repositories')
          .select('*')
          .eq('id', data.id)
          .single()

        if (updatedRepo) {
          setRepositories((prev) => [...prev.filter(r => r.id !== data.id), updatedRepo].sort((a, b) =>
            a.name.localeCompare(b.name)
          ))
          return updatedRepo
        }
      }
    } catch (err) {
      console.error('Docora registration error:', err)
      // Don't fail - repo is created, just not registered with Docora yet
    }

    setRepositories((prev) => [...prev, data].sort((a, b) =>
      a.name.localeCompare(b.name)
    ))
    return data
  }

  const updateRepository = async (id: string, updates: LumioRepositoryUpdate): Promise<LumioRepository | null> => {
    const { data, error: updateError } = await supabase
      .from('lumio_repositories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    setRepositories((prev) =>
      prev.map((r) => (r.id === id ? data : r)).sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    )
    return data
  }

  const deleteRepository = async (id: string): Promise<boolean> => {
    // 1. Unregister from Docora first
    try {
      const response = await supabase.functions.invoke('docora-register', {
        body: {
          action: 'unregister',
          repositoryId: id,
        },
      })

      if (response.error) {
        console.error('Failed to unregister from Docora:', response.error)
        // Continue with deletion - Docora will handle orphaned repos
      }
    } catch (err) {
      console.error('Docora unregistration error:', err)
      // Continue with deletion
    }

    // 2. Delete from database (cascade deletes cards and images)
    const { error: deleteError } = await supabase
      .from('lumio_repositories')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setRepositories((prev) => prev.filter((r) => r.id !== id))
    return true
  }

  const getRepository = useCallback(async (id: string): Promise<LumioRepository | null> => {
    const { data, error: fetchError } = await supabase
      .from('lumio_repositories')
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
    repositories,
    loading,
    error,
    createRepository,
    updateRepository,
    deleteRepository,
    getRepository,
    refetch: fetchRepositories,
  }
}
