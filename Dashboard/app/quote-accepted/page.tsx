"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/hooks/use-language"

export default function QuoteAcceptedPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(30)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const email = searchParams.get("email")
  const accessCode = searchParams.get("accessCode")

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleRedirectToDashboard()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleRedirectToDashboard = () => {
    setIsRedirecting(true)

    if (email && accessCode) {
      // Store credentials for auto-login
      const loginData = { email, accessCode }
      localStorage.setItem("heavyd_client_session", JSON.stringify(loginData))

      // Redirect to dashboard with auto-login parameters
      const dashboardUrl = `/?email=${encodeURIComponent(email)}&code=${accessCode}`
      window.location.href = dashboardUrl
    } else {
      // Fallback to main page
      router.push("/")
    }
  }

  const handleGoToDashboardNow = () => {
    setCountdown(0)
    handleRedirectToDashboard()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardContent className="p-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/heavy-d-logo-dark.svg"
              alt="Heavy D Logo"
              width={200}
              height={67}
              className="h-16 w-auto mx-auto"
            />
          </div>

          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>

            {/* Success Message */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 Quote Accepted Successfully!</h1>

            <p className="text-xl text-gray-700 mb-2">Thank you for accepting our quote!</p>

            <p className="text-lg text-gray-600 mb-8">
              We're excited to begin work on your project and will keep you updated on our progress.
            </p>
          </div>

          {/* Project Details */}
          {email && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Your project has been added to our production queue</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">You'll receive email updates as work progresses</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Access your dashboard anytime to track progress</span>
                </div>
              </div>
            </div>
          )}

          {/* Redirect Information */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              {isRedirecting ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#000050]" />
              ) : (
                <div className="w-8 h-8 bg-[#000050] text-white rounded-full flex items-center justify-center font-bold">
                  {countdown}
                </div>
              )}
              <span className="text-gray-700">
                {isRedirecting
                  ? "Redirecting to your dashboard..."
                  : `Redirecting to your dashboard in ${countdown} seconds`}
              </span>
            </div>

            <Button
              onClick={handleGoToDashboardNow}
              disabled={isRedirecting}
              className="bg-[#000050] hover:bg-blue-800 text-white px-8 py-3 text-lg"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Go to Dashboard Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Contact Information */}
          <div className="text-center text-gray-600">
            <p className="text-sm mb-2">Questions about your project? We're here to help!</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm">
              <a href="mailto:info@heavydetailing.com" className="text-[#000050] hover:underline font-medium">
                info@heavydetailing.com
              </a>
              <span className="hidden sm:inline text-gray-400">•</span>
              <a href="tel:+15148836732" className="text-[#000050] hover:underline font-medium">
                (514) 883-6732
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
