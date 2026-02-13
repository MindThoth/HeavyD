import { Loader2 } from "lucide-react"

export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#000050]" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
}
