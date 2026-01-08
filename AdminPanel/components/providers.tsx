"use client"

import { SessionProvider } from "next-auth/react"
import { CacheProvider } from "@/app/providers/cache-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CacheProvider>
        {children}
      </CacheProvider>
    </SessionProvider>
  )
}
