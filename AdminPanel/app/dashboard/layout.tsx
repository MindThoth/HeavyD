"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calculator, Clock, Receipt, LogOut, User, Menu, X, Briefcase, FileText } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Employees", href: "/dashboard/employees", icon: Briefcase },
  { name: "Receipts", href: "/dashboard/receipts", icon: FileText },
  { name: "Calculator", href: "/dashboard/tools/calculator", icon: Calculator },
  { name: "Timesheet", href: "/dashboard/tools/timesheet", icon: Clock },
  { name: "Expenses", href: "/dashboard/expenses", icon: Receipt },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#000050] text-white flex items-center justify-between px-4 z-40 border-b border-blue-800">
        <div className="h-10 w-28 relative">
          <Image
            src="/logo/heavyd-white.svg"
            alt="Heavy D"
            fill
            className="object-contain"
            priority
          />
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-blue-900 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 mt-16"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-[#000050] text-white z-50 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0 mt-16" : "-translate-x-full lg:mt-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile (shown in header instead) */}
          <div className="hidden lg:flex items-center justify-center h-20 border-b border-blue-800 px-4">
            <div className="h-12 w-40 relative">
              <Image
                src="/logo/heavyd-white.svg"
                alt="Heavy D"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-800 text-white"
                      : "text-blue-100 hover:bg-blue-900 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          {session?.user && (
            <div className="px-4 py-3 border-t border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-blue-300 truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 bg-transparent border-blue-700 text-blue-100 hover:bg-blue-900 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <p className="text-sm text-blue-200">
              Heavy Detailing Admin Dashboard
            </p>
            <p className="text-xs text-blue-300 mt-1">
              Version 3.0.0
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
