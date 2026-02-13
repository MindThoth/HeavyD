"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function EditClientRedirect() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string

  useEffect(() => {
    // Redirect to the client detail page where editing is available
    if (code) {
      router.push(`/dashboard/client/${code}`)
    }
  }, [code, router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#000050]"></div>
    </div>
  )
}
