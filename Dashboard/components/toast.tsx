import { CheckCircle, AlertCircle, Info } from "lucide-react"

interface ToastProps {
  toast: {
    show: boolean
    message: string
    type: "success" | "error" | "info"
  }
}

export function Toast({ toast }: ToastProps) {
  if (!toast.show) return null

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800"
      case "error":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-blue-50 border-blue-200 text-blue-800"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className={`flex items-center space-x-3 p-4 rounded-lg border shadow-lg max-w-md ${getStyles()}`}>
        {getIcon()}
        <p className="text-sm font-medium flex-1">{toast.message}</p>
      </div>
    </div>
  )
}
