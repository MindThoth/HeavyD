"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/hooks/use-language"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const [email, setEmail] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAccessCode, setShowAccessCode] = useState(false)

  // Google Apps Script endpoint
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

  // Check for auto-login parameters
  useEffect(() => {
    const emailParam = searchParams.get("email")
    const codeParam = searchParams.get("code")

    if (emailParam && codeParam) {
      setEmail(emailParam)
      setAccessCode(codeParam)
      handleLogin(emailParam, codeParam)
    }
  }, [searchParams])

  const handleLogin = async (loginEmail?: string, loginCode?: string) => {
    const emailToUse = loginEmail || email
    const codeToUse = loginCode || accessCode

    if (!emailToUse || !codeToUse) {
      setError(t.login.error.required)
      return
    }

    if (codeToUse.length < 4 || codeToUse.length > 8) {
      setError(t.login.error.codeLength)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("🔐 Attempting login:", { email: emailToUse, code: codeToUse })

      const loginUrl = `${SCRIPT_URL}?action=login&email=${encodeURIComponent(emailToUse)}&accessCode=${encodeURIComponent(codeToUse)}`

      console.log("📡 Login URL:", loginUrl)

      const response = await fetch(loginUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      console.log("📡 Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📡 Login response:", data)

      if (data.success && data.clientData) {
        console.log("✅ Login successful, redirecting to dashboard")

        // Store session data
        const sessionData = {
          email: emailToUse,
          accessCode: codeToUse,
          clientData: data.clientData,
          timestamp: new Date().toISOString(),
        }

        localStorage.setItem("heavyd_client_session", JSON.stringify(sessionData))

        // Redirect to dashboard with parameters
        router.push(`/dashboard?email=${encodeURIComponent(emailToUse)}&code=${encodeURIComponent(codeToUse)}`)
      } else {
        console.log("❌ Login failed:", data.message)
        setError(data.message || t.login.invalidCredentials)
      }
    } catch (err) {
      console.error("❌ Login error:", err)

      if (err instanceof Error) {
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          setError(t.login.networkError)
        } else if (err.message.includes("CORS")) {
          setError(t.errors.cors)
        } else if (err.message.includes("timeout")) {
          setError(t.errors.timeout)
        } else {
          setError(err.message)
        }
      } else {
        setError(t.errors.network)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <Image
            src="/heavy-d-logo-dark.svg"
            alt="Heavy D Logo"
            width={200}
            height={67}
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">{t.login.title}</h1>
          <p className="text-gray-600 mt-2">{t.login.description}</p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">{t.login.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">{t.login.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11"
                />
              </div>

              {/* Access Code Field */}
              <div className="space-y-2">
                <Label htmlFor="accessCode">{t.login.accessCode}</Label>
                <div className="relative">
                  <Input
                    id="accessCode"
                    type={showAccessCode ? "text" : "password"}
                    placeholder={t.login.accessCodePlaceholder}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    disabled={loading}
                    required
                    minLength={4}
                    maxLength={8}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    disabled={loading}
                  >
                    {showAccessCode ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" disabled={loading || !email || !accessCode} className="w-full h-11">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {searchParams.get("email") ? t.login.autoLogging : t.login.loggingIn}
                  </>
                ) : (
                  t.login.button
                )}
              </Button>
            </form>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">{t.login.needHelp}</p>
                <div className="space-y-1">
                  <p>
                    {t.login.contactEmail}{" "}
                    <a href="mailto:info@heavydetailing.com" className="text-[#000050] hover:underline font-medium">
                      info@heavydetailing.com
                    </a>
                  </p>
                  <p>
                    {t.login.contactPhone}{" "}
                    <a href="tel:+15148836732" className="text-[#000050] hover:underline font-medium">
                      (514) 883-6732
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Message */}
        {loading && searchParams.get("email") && (
          <div className="text-center">
            <p className="text-sm text-gray-600">{t.login.pleaseWait}</p>
          </div>
        )}
      </div>
    </div>
  )
}
