// Reusable optimistic update hook
// src/hooks/useOptimisticList.js

import { useState, useCallback } from 'react'

export const useOptimisticList = (initialItems = []) => {
  const [items, setItems] = useState(initialItems)
  const [pendingIds, setPendingIds] = useState(new Set())

  const updateItem = useCallback(async (id, optimisticUpdate, serverAction) => {
    const original = items.find(item => item.id === id)
    if (!original) return

    // Apply optimistic update immediately
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...optimisticUpdate } : item
    ))
    setPendingIds(prev => new Set([...prev, id]))

    try {
      await serverAction()
    } catch (err) {
      // Revert to original on failure
      setItems(prev => prev.map(item =>
        item.id === id ? original : item
      ))
      throw err
    } finally {
      setPendingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }, [items])

  const removeItem = useCallback(async (id, serverAction) => {
    const original = [...items]
    setItems(prev => prev.filter(item => item.id !== id))
    
    try {
      await serverAction()
    } catch (err) {
      setItems(original)
      throw err
    }
  }, [items])

  return { items, setItems, updateItem, removeItem, pendingIds }
}
