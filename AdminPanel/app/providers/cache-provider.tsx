"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface CacheContextType {
  get: <T>(key: string) => T | null
  set: <T>(key: string, data: T, ttl?: number) => void
  invalidate: (key: string) => void
  invalidateAll: () => void
}

const CacheContext = createContext<CacheContextType | undefined>(undefined)

const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

export function CacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<Record<string, CacheEntry<any>>>({})

  const get = useCallback(<T,>(key: string): T | null => {
    const entry = cache[key]
    if (!entry) return null

    // Check if expired
    const now = Date.now()
    if (now - entry.timestamp > DEFAULT_TTL) {
      // Expired, remove it
      setCache(prev => {
        const newCache = { ...prev }
        delete newCache[key]
        return newCache
      })
      return null
    }

    return entry.data as T
  }, [cache])

  const set = useCallback(<T,>(key: string, data: T, ttl?: number) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }))
  }, [])

  const invalidate = useCallback((key: string) => {
    setCache(prev => {
      const newCache = { ...prev }
      delete newCache[key]
      return newCache
    })
  }, [])

  const invalidateAll = useCallback(() => {
    setCache({})
  }, [])

  return (
    <CacheContext.Provider value={{ get, set, invalidate, invalidateAll }}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within CacheProvider')
  }
  return context
}
