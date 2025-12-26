import { useState, useCallback } from 'react'

interface EntityWithId {
  id: string
}

interface UseEntityPageResult<T extends EntityWithId> {
  showForm: boolean
  editingItem: T | null
  isSubmitting: boolean
  deleteConfirm: T | null
  isFormVisible: boolean
  openCreateForm: () => void
  openEditForm: (item: T) => void
  closeForm: () => void
  setIsSubmitting: (value: boolean) => void
  openDeleteConfirm: (item: T) => void
  closeDeleteConfirm: () => void
  handleCreate: <D>(
    createFn: (data: D) => Promise<T | null>,
    data: D
  ) => Promise<T | null>
  handleUpdate: <D>(
    updateFn: (id: string, data: D) => Promise<T | null>,
    data: D
  ) => Promise<T | null>
  handleDelete: (deleteFn: (id: string) => Promise<boolean>) => Promise<boolean>
}

export function useEntityPage<T extends EntityWithId>(): UseEntityPageResult<T> {
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<T | null>(null)

  const isFormVisible = showForm || editingItem !== null

  const openCreateForm = useCallback(() => {
    setShowForm(true)
    setEditingItem(null)
  }, [])

  const openEditForm = useCallback((item: T) => {
    setEditingItem(item)
    setShowForm(false)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingItem(null)
  }, [])

  const openDeleteConfirm = useCallback((item: T) => {
    setDeleteConfirm(item)
  }, [])

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(null)
  }, [])

  const handleCreate = useCallback(
    async <D>(
      createFn: (data: D) => Promise<T | null>,
      data: D
    ): Promise<T | null> => {
      setIsSubmitting(true)
      const result = await createFn(data)
      setIsSubmitting(false)
      if (result) {
        setShowForm(false)
      }
      return result
    },
    []
  )

  const handleUpdate = useCallback(
    async <D>(
      updateFn: (id: string, data: D) => Promise<T | null>,
      data: D
    ): Promise<T | null> => {
      if (!editingItem) return null
      setIsSubmitting(true)
      const result = await updateFn(editingItem.id, data)
      setIsSubmitting(false)
      if (result) {
        setEditingItem(null)
      }
      return result
    },
    [editingItem]
  )

  const handleDelete = useCallback(
    async (deleteFn: (id: string) => Promise<boolean>): Promise<boolean> => {
      if (!deleteConfirm) return false
      const result = await deleteFn(deleteConfirm.id)
      if (result) {
        setDeleteConfirm(null)
      }
      return result
    },
    [deleteConfirm]
  )

  return {
    showForm,
    editingItem,
    isSubmitting,
    deleteConfirm,
    isFormVisible,
    openCreateForm,
    openEditForm,
    closeForm,
    setIsSubmitting,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
