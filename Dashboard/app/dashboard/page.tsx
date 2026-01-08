"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Upload,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  Eye,
  Loader2,
  LogOut,
} from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { FileUploadZone } from "@/components/file-upload-zone"
import { RevisionGallery } from "@/components/revision-gallery"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/hooks/use-language"
import Image from "next/image"

interface ClientData {
  status: string
  name: string
  company: string
  email: string
  phone: string
  language: string
  service: string
  quotePdfUrl: string
  receiptPdfUrl?: string
  quoteSpreadsheetId?: string
  revisionFolderLink: string
  accessCode: string
  uploadFolderLink: string
  quoteTotal?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acceptingQuote, setAcceptingQuote] = useState(false)

  // Collapsible sections state
  const [sectionsOpen, setSectionsOpen] = useState({
    projectDetails: true,
    clientInfo: true,
    upload: false,
    revisions: false,
    contact: false,
  })

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

  const email = searchParams.get("email")
  const code = searchParams.get("code")

  useEffect(() => {
    if (!email || !code) {
      router.push("/login")
      return
    }

    fetchClientData(email, code)
  }, [email, code, router])

  const fetchClientData = async (email: string, code: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔍 Fetching client data for:", { email, code })

      const response = await fetch(
        `${SCRIPT_URL}?action=login&email=${encodeURIComponent(email)}&accessCode=${encodeURIComponent(code)}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("📡 Client data response:", data)

      if (data.success && data.clientData) {
        setClientData(data.clientData)

        // Update session storage
        const sessionData = {
          email,
          accessCode: code,
          clientData: data.clientData,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem("heavyd_client_session", JSON.stringify(sessionData))
      } else {
        throw new Error(data.message || "Failed to fetch client data")
      }
    } catch (err) {
      console.error("❌ Error fetching client data:", err)
      setError(err instanceof Error ? err.message : t.errors.generic)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("heavyd_client_session")
    router.push("/login")
  }

  const handleQuoteAcceptance = async () => {
    if (!clientData) return

    try {
      setAcceptingQuote(true)

      const formData = new FormData()
      formData.append("action", "accept")
      formData.append("email", clientData.email)
      formData.append("accessCode", clientData.accessCode)

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setClientData((prev) => (prev ? { ...prev, status: "Quote Accepted" } : null))

        // Redirect to quote accepted page
        router.push(
          `/quote-accepted?email=${encodeURIComponent(clientData.email)}&accessCode=${encodeURIComponent(clientData.accessCode)}`,
        )
      } else {
        throw new Error(data.message || "Failed to accept quote")
      }
    } catch (error) {
      console.error("Error accepting quote:", error)
      alert(t.errors.generic)
    } finally {
      setAcceptingQuote(false)
    }
  }

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "quote sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "quote accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "on hold":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "quote sent":
        return <Clock className="h-4 w-4" />
      case "quote accepted":
        return <CheckCircle className="h-4 w-4" />
      case "in progress":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "on hold":
        return <AlertCircle className="h-4 w-4" />
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(num || 0)
  }

  if (loading) {
    return <LoadingSpinner message={t.loading.general} />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.common.error}</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => fetchClientData(email!, code!)} variant="outline" className="w-full">
                {t.common.retry}
              </Button>
              <Button onClick={handleLogout} variant="ghost" className="w-full">
                {t.header.logout}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t.errors.notFound}</h2>
            <p className="text-gray-600 mb-4">Client data not found</p>
            <Button onClick={handleLogout} variant="outline">
              {t.common.back}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image src="/heavy-d-logo-dark.svg" alt="Heavy D Logo" width={120} height={40} className="h-8 w-auto" />
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold text-gray-900">{t.dashboard.welcome}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button
                onClick={() =>
                  router.push(
                    `/print-view?email=${encodeURIComponent(clientData.email)}&code=${encodeURIComponent(clientData.accessCode)}`,
                  )
                }
                variant="outline"
                size="sm"
              >
                <Printer className="h-4 w-4 mr-2" />
                {t.quote.print}
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                {t.header.logout}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t.dashboard.welcome}, {clientData.name}!
                </h2>
                <p className="text-gray-600 mt-1">
                  {clientData.company} • {clientData.service}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(clientData.status)}
                <Badge className={`${getStatusColor(clientData.status)} font-medium`}>
                  {t.status?.[clientData.status as keyof typeof t.status] || clientData.status}
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {clientData.status === "Quote Sent" && (
                <Button
                  onClick={handleQuoteAcceptance}
                  disabled={acceptingQuote}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {acceptingQuote ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.quote.accepting}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t.dashboard.acceptQuote}
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={() =>
                  router.push(
                    `/quote-accepted?email=${encodeURIComponent(clientData.email)}&accessCode=${encodeURIComponent(clientData.accessCode)}`,
                  )
                }
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                {clientData.status === "Quote Sent" ? t.dashboard.viewQuote : t.dashboard.viewReceipt}
              </Button>

              {clientData.receiptPdfUrl && (
                <Button onClick={() => window.open(clientData.receiptPdfUrl, "_blank")} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {t.dashboard.downloadReceipt}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Project Details */}
          <Collapsible open={sectionsOpen.projectDetails} onOpenChange={() => toggleSection("projectDetails")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>{t.dashboard.projectDetails}</span>
                    </CardTitle>
                    {sectionsOpen.projectDetails ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t.common.service}</label>
                        <p className="text-gray-900 font-medium">{clientData.service}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">{t.common.status}</label>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusIcon(clientData.status)}
                          <span className="text-gray-900 font-medium">
                            {t.status?.[clientData.status as keyof typeof t.status] || clientData.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {clientData.quoteTotal && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.quote.total}</label>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(clientData.quoteTotal)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Client Information */}
          <Collapsible open={sectionsOpen.clientInfo} onOpenChange={() => toggleSection("clientInfo")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>{t.dashboard.clientInformation}</span>
                    </CardTitle>
                    {sectionsOpen.clientInfo ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.common.name}</label>
                          <p className="text-gray-900 font-medium">{clientData.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.common.company}</label>
                          <p className="text-gray-900 font-medium">{clientData.company}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.common.email}</label>
                          <p className="text-gray-900 font-medium">{clientData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.common.phone}</label>
                          <p className="text-gray-900 font-medium">{clientData.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* File Upload */}
          <Collapsible open={sectionsOpen.upload} onOpenChange={() => toggleSection("upload")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Upload className="h-5 w-5" />
                      <span>{t.upload.title}</span>
                    </CardTitle>
                    {sectionsOpen.upload ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <FileUploadZone
                    uploadFolderLink={clientData.uploadFolderLink}
                    onUploadComplete={(files) => {
                      console.log("Files uploaded:", files)
                    }}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Design Revisions */}
          {clientData.revisionFolderLink && (
            <RevisionGallery
              revisionFolderLink={clientData.revisionFolderLink}
              clientData={{
                name: clientData.name,
                company: clientData.company,
                service: clientData.service,
                email: clientData.email,
                accessCode: clientData.accessCode,
              }}
            />
          )}

          {/* Contact Information */}
          <Collapsible open={sectionsOpen.contact} onOpenChange={() => toggleSection("contact")}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>{t.contact.title}</span>
                    </CardTitle>
                    {sectionsOpen.contact ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.contact.phone}</label>
                          <p className="text-gray-900 font-medium">+1 (514) 883-6732</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.contact.email}</label>
                          <p className="text-gray-900 font-medium">info@heavydetailing.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.contact.address}</label>
                          <p className="text-gray-900">
                            Montreal, QC
                            <br />
                            Canada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                          <label className="text-sm font-medium text-gray-500">{t.contact.hours}</label>
                          <p className="text-gray-900">
                            Mon-Fri: 9:00 AM - 6:00 PM
                            <br />
                            Sat-Sun: {t.contact.closed}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </main>
    </div>
  )
}
