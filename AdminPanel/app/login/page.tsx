"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { handleGoogleSignIn } from "./actions"
import { BoatLoading } from "@/components/ui/boat-loading"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    console.log("Button clicked!")
    setIsLoading(true)
    try {
      await handleGoogleSignIn()
    } catch (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="mx-auto h-24 w-60 relative">
            <Image
              src="/logo/heavyd.svg"
              alt="Heavy D Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
            {error === "AccessDenied" && "Access denied. Your email is not authorized."}
            {error === "Configuration" && "Authentication configuration error. Please check your settings."}
            {error !== "AccessDenied" && error !== "Configuration" && "An error occurred during sign in."}
          </div>
        )}

        {/* Sign In Button */}
        <div>
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-6 text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 disabled:opacity-70"
            style={{
              backgroundColor: isLoading ? "#0000a0" : "#000050",
            }}
          >
            {isLoading ? (
              <>
                <BoatLoading size="sm" />
              </>
            ) : (
              <>
                <Chrome className="h-5 w-5" />
                Sign in with Google
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Heavy D Admin Dashboard v3.0.0
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <BoatLoading size="md" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
