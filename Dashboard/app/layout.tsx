import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { LanguageProvider } from "@/hooks/use-language"

export const metadata: Metadata = {
  title: "Client Dashboard - Heavy D Print & Design",
  description: "Secure client dashboard for Heavy D Print & Design projects",
  icons: {
    icon: "/heavydicon.ico",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Suspense
            fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000050] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </LanguageProvider>
      </body>
    </html>
  )
}
