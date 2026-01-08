"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  User,
  Building,
  Wrench,
  ExternalLink,
  Loader2,
  LogOut,
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import { Toast } from "@/components/toast"
import { useLanguage, detectLanguageFromClient } from "@/hooks/use-language"
import { LanguageSwitcher } from "@/components/language-switcher"
import { FileUploadZone } from "@/components/file-upload-zone"
import { RevisionGallery } from "@/components/revision-gallery"

interface ClientData {
  status: string // Column B
  name: string // Column D
  company: string // Column E
  email: string // Column F
  phone: string // Column G
  language: string // Column H
  service: string // Column I
  quotePdfUrl: string // Column R
  quoteSpreadsheetId?: string // Column N - Spreadsheet ID
  revisionFolderLink: string // Column O
  accessCode: string // Column P
  uploadFolderLink: string // Column Q
  quoteTotal?: string
  receiptPdfUrl: string // Column S
}

interface LoginCredentials {
  email: string
  accessCode: string
}

interface ToastState {
  show: boolean
  message: string
  type: "success" | "error" | "info"
}

interface QuoteItem {
  description: string
  quantity: number
  price: number
  total: number
}

export default function ClientDashboard() {
  const { language, setLanguage, t } = useLanguage()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [allClientsData, setAllClientsData] = useState<ClientData[]>([])
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({
    email: "",
    accessCode: "",
  })
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [acceptingQuote, setAcceptingQuote] = useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "info" })
  const [autoLoggingIn, setAutoLoggingIn] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [showQuoteView, setShowQuoteView] = useState(false)
  const [quoteItems, setQuoteItems] = useState(false)
  const [quoteAccepted, setQuoteAccepted] = useState(false)
  const [quoteBreakdown, setQuoteBreakdown] = useState([])
  const [loadingQuoteData, setLoadingQuoteData] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Collapsible sections state for quote view
  const [quoteCollapsedSections, setQuoteCollapsedSections] = useState({
    clientInfo: false,
    documentDetails: false,
    quoteDetails: false,
  })

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    projectInfo: false,
    quote: false,
    timeline: false,
    revisions: false,
    upload: false,
    contact: false,
  })

  // Google Apps Script endpoint - replace with your actual URL
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

  // Admin credentials - using numeric code only
  const ADMIN_EMAIL = "admin@heavydetailing.com"
  const ADMIN_CODE = "2024" // Changed to numeric only

  // Demo mode flag - set to true for testing without backend
  const DEMO_MODE = false

  // Demo data for testing
  const DEMO_CLIENT_DATA: ClientData = {
    status: "Quote Sent",
    name: "John Smith",
    company: "Blue Bay Boats",
    service: "Boat Lettering",
    quotePdfUrl: "https://drive.google.com/file/d/1234567890/view", // Changed from quotePdfId
    revisionFolderLink: "https://drive.google.com/drive/folders/0987654321",
    uploadFolderLink: "https://drive.google.com/drive/folders/0987654321",
    email: "john@bluebayboats.com",
    phone: "514-555-1212",
    language: "EN",
    accessCode: "1234",
    quoteTotal: "123.45",
    receiptPdfUrl: "https://drive.google.com/file/d/1234567890/view",
  }

  const DEMO_ALL_CLIENTS: ClientData[] = [
    DEMO_CLIENT_DATA,
    {
      status: "In Progress",
      name: "Sarah Johnson",
      company: "Maritime Services",
      service: "Vehicle Lettering",
      quotePdfUrl: "https://drive.google.com/file/d/2234567890/view",
      revisionFolderLink: "https://drive.google.com/drive/folders/1987654321",
      uploadFolderLink: "https://drive.google.com/drive/folders/1987654321",
      email: "sarah@maritime.com",
      phone: "514-555-1212",
      language: "EN",
      accessCode: "5678",
      quoteTotal: "456.78",
      receiptPdfUrl: "https://drive.google.com/file/d/1234567890/view",
    },
    {
      status: "Completed",
      name: "Mike Wilson",
      company: "Wilson Graphics",
      service: "Logo Design",
      quotePdfUrl: "https://drive.google.com/file/d/3234567890/view",
      revisionFolderLink: "https://drive.google.com/drive/folders/2987654321",
      uploadFolderLink: "https://drive.google.com/drive/folders/2987654321",
      email: "mike@wilsongraphics.com",
      phone: "514-555-1212",
      language: "EN",
      accessCode: "9999",
      quoteTotal: "789.01",
      receiptPdfUrl: "https://drive.google.com/file/d/1234567890/view",
    },
  ]

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  useEffect(() => {
    // Enhanced debugging for auto-login
    console.log("🔍 Dashboard useEffect triggered")
    console.log("🔍 Current URL:", window.location.href)
    console.log("🔍 URL Search params:", window.location.search)

    // Check for existing session first
    const savedSession = localStorage.getItem("heavyd_client_session")
    console.log("🔍 Saved session:", savedSession ? "Found" : "None")

    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession)
        if (sessionData.email && sessionData.accessCode) {
          console.log("🔍 Restoring session for:", sessionData.email)
          setLoginCredentials(sessionData)
          handleLogin(sessionData, true)
          return // Exit early if we have a session
        }
      } catch (error) {
        console.error("🔍 Session restore error:", error)
        localStorage.removeItem("heavyd_client_session")
      }
    }

    // Enhanced URL parameter checking for automatic login from email links
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get("email")
    const codeParam = urlParams.get("code")

    console.log("🔍 URL Parameters:")
    console.log("  - email:", emailParam)
    console.log("  - code:", codeParam)
    console.log("  - all params:", Array.from(urlParams.entries()))

    if (emailParam && codeParam) {
      console.log("✅ Auto-login parameters found!")
      setDebugInfo(`Auto-login detected: ${emailParam} / ${codeParam}`)

      // Clean the URL to remove parameters after extracting them
      const newUrl = window.location.pathname
      console.log("🔍 Cleaning URL from", window.location.href, "to", newUrl)
      window.history.replaceState({}, document.title, newUrl)

      // Set credentials and attempt automatic login
      const autoLoginCredentials = {
        email: decodeURIComponent(emailParam),
        accessCode: codeParam,
      }

      console.log("🔍 Auto-login credentials:", autoLoginCredentials)
      setLoginCredentials(autoLoginCredentials)
      handleLogin(autoLoginCredentials, false, true)
    } else {
      console.log("❌ No auto-login parameters found")
      setDebugInfo("No auto-login parameters in URL")
    }
  }, [])

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 4000)
  }

  const handleLogin = async (credentials?: LoginCredentials, isSessionRestore = false, isAutoLogin = false) => {
    const creds = credentials || loginCredentials

    console.log("🔍 handleLogin called:")
    console.log("  - credentials:", creds)
    console.log("  - isSessionRestore:", isSessionRestore)
    console.log("  - isAutoLogin:", isAutoLogin)

    if (!creds.email || !creds.accessCode) {
      const error = t("login.error.required")
      console.log("❌ Missing credentials:", error)
      setLoginError(error)
      return
    }

    if (creds.accessCode.length < 4 || creds.accessCode.length > 8) {
      const error = t("login.error.codeLength")
      console.log("❌ Invalid code length:", error)
      setLoginError(error)
      return
    }

    try {
      if (isAutoLogin) {
        console.log("🔄 Starting auto-login...")
        setAutoLoggingIn(true)
      } else {
        setLoading(true)
      }
      setLoginError(null)

      // Check for admin login
      if (creds.email === ADMIN_EMAIL && creds.accessCode === ADMIN_CODE) {
        console.log("👑 Admin login detected")
        if (DEMO_MODE) {
          // Demo admin login
          setAllClientsData(DEMO_ALL_CLIENTS)
          setIsAdmin(true)
          setIsLoggedIn(true)

          localStorage.setItem(
            "heavyd_client_session",
            JSON.stringify({
              ...creds,
              isAdmin: true,
            }),
          )

          if (!isSessionRestore) {
            showToast("Welcome, Admin! (Demo Mode)", "success")
          }
          return
        } else {
          // Real admin login
          const response = await fetch(`${SCRIPT_URL}?action=getAllClients`)
          if (!response.ok) throw new Error("Failed to fetch admin data")

          const data = await response.json()
          setAllClientsData(data.clients || [])
          setIsAdmin(true)
          setIsLoggedIn(true)

          localStorage.setItem(
            "heavyd_client_session",
            JSON.stringify({
              ...creds,
              isAdmin: true,
            }),
          )

          if (!isSessionRestore) {
            showToast("Welcome, Admin!", "success")
          }
          return
        }
      }

      if (DEMO_MODE) {
        console.log("🎭 Demo mode login")
        // Demo client login
        const demoClient = DEMO_ALL_CLIENTS.find(
          (client) => client.email === creds.email && client.accessCode === creds.accessCode,
        )

        if (demoClient) {
          console.log("✅ Demo client found:", demoClient.name)
          setClientData(demoClient)
          setIsLoggedIn(true)

          localStorage.setItem("heavyd_client_session", JSON.stringify(creds))

          const detectedLanguage = detectLanguageFromClient(demoClient?.language || "")
          if (detectedLanguage !== language) {
            setLanguage(detectedLanguage)
          }

          if (!isSessionRestore) {
            showToast(`Welcome back, ${demoClient.name}! (Demo Mode)`, "success")
          }
        } else {
          console.log("❌ Demo client not found")
          setLoginError("Invalid email or access code. Try demo credentials: john@bluebayboats.com / 1234")
        }
      } else {
        console.log("🌐 Real mode login - calling API")
        // Real client login - FIXED: Use 'login' action instead of 'getClientData'
        const loginUrl = `${SCRIPT_URL}?action=login&email=${encodeURIComponent(creds.email)}&accessCode=${encodeURIComponent(creds.accessCode)}`
        console.log("🔍 Login URL:", loginUrl)

        const response = await fetch(loginUrl)
        console.log("🔍 Login response status:", response.status)

        if (!response.ok) {
          throw new Error(`Login failed with status: ${response.status}`)
        }

        const data = await response.json()
        console.log("🔍 Login response data:", data)

        if (data.success && data.clientData) {
          console.log("✅ Login successful for:", data.clientData.name)
          setClientData(data.clientData)
          setIsLoggedIn(true)

          localStorage.setItem("heavyd_client_session", JSON.stringify(creds))

          const detectedLanguage = detectLanguageFromClient(data.clientData?.language || "")
          if (detectedLanguage !== language) {
            setLanguage(detectedLanguage)
          }

          if (!isSessionRestore) {
            showToast(`Welcome back, ${data.clientData.name}!`, "success")
          }
        } else {
          console.log("❌ Login failed:", data.message)
          setLoginError("Invalid email or access code. Please check your credentials and try again.")
        }
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      if (DEMO_MODE) {
        setLoginError(
          "Demo mode: Use john@bluebayboats.com / 1234 for client or admin@heavydetailing.com / 2024 for admin",
        )
      } else {
        setLoginError(t("login.error.connection"))
      }
    } finally {
      if (isAutoLogin) {
        setAutoLoggingIn(false)
      } else {
        setLoading(false)
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("heavyd_client_session")
    setIsLoggedIn(false)
    setIsAdmin(false)
    setClientData(null)
    setAllClientsData([])
    setLoginCredentials({ email: "", accessCode: "" })
    setShowQuoteView(false)
    setQuoteAccepted(false)
    setQuoteBreakdown([])
    showToast("Logged out successfully", "info")
  }

  const handleAcceptQuote = async () => {
    if (!clientData) return

    try {
      setAcceptingQuote(true)

      if (DEMO_MODE) {
        // Demo mode - simulate success
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setClientData((prev) => (prev ? { ...prev, status: "Quote Accepted" } : null))
        setQuoteAccepted(true)
        showToast("Quote accepted successfully! We'll begin work on your project soon. (Demo Mode)", "success")
      } else {
        // Real mode - use no-cors mode to avoid CORS issues
        const requestData = {
          action: "accept",
          email: clientData.email,
          accessCode: clientData.accessCode,
        }

        console.log("🔍 Sending quote acceptance request:", requestData)
        console.log("🔍 Script URL:", SCRIPT_URL)

        try {
          // Use no-cors mode to bypass CORS restrictions
          const response = await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors", // This bypasses CORS but limits response access
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(requestData),
          })

          console.log("🔍 Quote acceptance response (no-cors mode)")

          // With no-cors, we can't read the response, so we assume success
          // and update the UI optimistically
          setClientData((prev) => (prev ? { ...prev, status: "Quote Accepted" } : null))
          setQuoteAccepted(true)
          showToast("Quote accepted successfully! We'll begin work on your project soon.", "success")
        } catch (fetchError) {
          console.error("❌ Fetch error details:", fetchError)
          throw new Error("Network error. Please try again or contact support.")
        }
      }
    } catch (error) {
      console.error("❌ Error accepting quote:", error)

      let errorMessage = "Error accepting quote. "

      if (error.message.includes("Network error")) {
        errorMessage += "Network connection problem. Please check your internet and try again."
      } else {
        errorMessage += error.message || "Please try again or contact us directly."
      }

      showToast(errorMessage, "error")
    } finally {
      setAcceptingQuote(false)
    }
  }

  const handleSubmitComment = async (imageUrl?: string, commentText?: string) => {
    const finalComment = commentText || comment.trim()
    if (!clientData || !finalComment) return

    try {
      setSubmittingComment(true)

      if (DEMO_MODE) {
        // Demo mode - simulate success
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (!imageUrl) setComment("") // Only clear main comment box
        showToast("Your comment has been submitted successfully! (Demo Mode)", "success")
      } else {
        // Real mode - use no-cors mode
        const response = await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors", // Bypass CORS restrictions
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            action: "comment",
            name: clientData.name,
            company: clientData.company,
            service: clientData.service,
            email: clientData.email,
            comment: finalComment,
            imageUrl: imageUrl || "",
            accessCode: clientData.accessCode,
          }),
        })

        // With no-cors, assume success and update UI optimistically
        if (!imageUrl) setComment("") // Only clear main comment box
        showToast("Your comment has been submitted successfully!", "success")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      showToast("Error submitting comment. Please try again or contact us directly.", "error")
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "quote sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "quote accepted":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
      case "receipt sent":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "quote sent":
        return <Clock className="h-4 w-4" />
      case "quote accepted":
        return <CheckCircle className="h-4 w-4" />
      case "in progress":
        return <Wrench className="h-4 w-4" />
      case "completed":
      case "receipt sent":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTimelineSteps = (status: string) => {
    const statusLower = status.toLowerCase()

    const steps = [
      { name: "Quote Sent", key: "quote_sent" },
      { name: "Quote Accepted", key: "quote_accepted" },
      { name: "In Progress", key: "in_progress" },
      { name: "Designed", key: "designed" },
      { name: "Printed", key: "printed" },
      { name: "Completed", key: "completed" },
      { name: "Paid", key: "paid" },
    ]

    const activeSteps = new Set()

    switch (statusLower) {
      case "paid":
        activeSteps.add("paid")
      case "completed":
      case "receipt sent":
        activeSteps.add("completed")
      case "printed":
        activeSteps.add("printed")
      case "designed":
        activeSteps.add("designed")
      case "in progress":
        activeSteps.add("in_progress")
      case "quote accepted":
      case "quote accepted, not started":
        activeSteps.add("quote_accepted")
      case "quote sent":
        activeSteps.add("quote_sent")
        break
    }

    return steps.map((step) => ({
      ...step,
      active: activeSteps.has(step.key),
    }))
  }

  const getCurrentStep = (status: string) => {
    const steps = getTimelineSteps(status)
    const activeSteps = steps.filter((step) => step.active)
    return activeSteps.length > 0 ? activeSteps[activeSteps.length - 1] : steps[0]
  }

  const getStatusInfo = (status: string) => {
    const statusLower = status.toLowerCase()
    const isCompleted =
      statusLower.includes("completed") || statusLower.includes("paid") || statusLower.includes("receipt sent")

    return {
      isReceipt: isCompleted,
      label: isCompleted ? (statusLower.includes("paid") ? "PAID" : "RECEIPT") : "QUOTE",
      badgeClass: isCompleted
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-blue-100 text-blue-800 border-blue-200",
      icon: isCompleted ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />,
    }
  }

  const getDocumentTitle = (status: string) => {
    const statusLower = status.toLowerCase()
    const isCompleted =
      statusLower.includes("completed") || statusLower.includes("paid") || statusLower.includes("receipt sent")
    return isCompleted ? t("receipt.projectReceipt") : t("quote.projectQuote")
  }

  const getViewButtonText = (status: string) => {
    const statusLower = status.toLowerCase()
    const isCompleted =
      statusLower.includes("completed") || statusLower.includes("paid") || statusLower.includes("receipt sent")
    return isCompleted ? t("receipt.viewReceipt") : t("quote.viewQuote")
  }

  // Replace the getSectionTitle function with this version that uses translations:
  const getSectionTitle = (status: string) => {
    const statusLower = status.toLowerCase()
    const isCompleted =
      statusLower.includes("completed") || statusLower.includes("paid") || statusLower.includes("receipt sent")
    return isCompleted ? t("receipt.title") : t("quote.title")
  }

  // Helper function to get status description with translation
  const getStatusDescription = (stepKey: string) => {
    return t(`timeline.statusDescriptions.${stepKey}`)
  }

  const formatCurrency = (amount: string): string => {
    if (!amount) return "$0.00"

    // Remove any existing currency symbols and clean the string
    const cleanAmount = amount.toString().replace(/[^0-9.-]/g, "")
    const numericAmount = Number.parseFloat(cleanAmount)

    if (isNaN(numericAmount)) return "$0.00"

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numericAmount)
  }

  const calculateQuebecTaxes = (subtotal: number) => {
    const GST_RATE = 0.05 // 5% GST
    const QST_RATE = 0.09975 // 9.975% QST

    const gst = subtotal * GST_RATE
    const qst = subtotal * QST_RATE
    const totalTaxes = gst + qst

    return {
      gst,
      qst,
      totalTaxes,
      total: subtotal + totalTaxes,
    }
  }

  const fetchQuoteBreakdown = async (spreadsheetId: string) => {
    if (!spreadsheetId) return

    try {
      setLoadingQuoteData(true)

      // If it's already a full URL, extract the ID, otherwise use as-is
      let finalSpreadsheetId = spreadsheetId
      if (spreadsheetId.includes("spreadsheets")) {
        const spreadsheetIdMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
        if (spreadsheetIdMatch) {
          finalSpreadsheetId = spreadsheetIdMatch[1]
        }
      }

      if (DEMO_MODE) {
        // Demo mode - simulate multiple quote items
        await new Promise((resolve) => setTimeout(resolve, 500))
        setQuoteBreakdown([
          {
            description: "Design & Setup",
            quantity: 1,
            price: 50.0,
            total: 50.0,
          },
          {
            description: "Vinyl Lettering - Premium",
            quantity: 2,
            price: 75.0,
            total: 150.0,
          },
          {
            description: "Installation",
            quantity: 1,
            price: 25.0,
            total: 25.0,
          },
        ])
      } else {
        // Real mode - fetch from Google Apps Script
        const response = await fetch(
          `${SCRIPT_URL}?action=getQuoteBreakdown&spreadsheetId=${finalSpreadsheetId}&clientEmail=${encodeURIComponent(clientData?.email || "")}`,
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            if (data.quoteItems && data.quoteItems.length > 0) {
              // Use detailed breakdown from Quote sheet
              setQuoteBreakdown(data.quoteItems)
            } else {
              // Fallback to service-based item if no detailed breakdown
              setQuoteBreakdown([
                {
                  description: clientData?.service || "Service",
                  quantity: 1,
                  price: Number.parseFloat(clientData?.quoteTotal || "0"),
                  total: Number.parseFloat(clientData?.quoteTotal || "0"),
                },
              ])
            }
          } else {
            console.error("Quote breakdown error:", data.message)
            // Error case - use fallback
            setQuoteBreakdown([
              {
                description: clientData?.service || "Service",
                quantity: 1,
                price: Number.parseFloat(clientData?.quoteTotal || "0"),
                total: Number.parseFloat(clientData?.quoteTotal || "0"),
              },
            ])
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error("Error fetching quote breakdown:", error)
      // Fallback to basic quote data
      setQuoteBreakdown([
        {
          description: clientData?.service || "Service",
          quantity: 1,
          price: Number.parseFloat(clientData?.quoteTotal || "0"),
          total: Number.parseFloat(clientData?.quoteTotal || "0"),
        },
      ])
    } finally {
      setLoadingQuoteData(false)
    }
  }

  useEffect(() => {
    if (showQuoteView && clientData) {
      // Check if quote is already accepted based on status
      setQuoteAccepted(clientData.status.toLowerCase().includes("accepted"))

      // Fetch quote breakdown data using spreadsheet ID from column N
      if (clientData.quoteSpreadsheetId) {
        fetchQuoteBreakdown(clientData.quoteSpreadsheetId)
      } else if (clientData.quotePdfUrl) {
        // Fallback to PDF URL if spreadsheet ID is not available
        fetchQuoteBreakdown(clientData.quotePdfUrl)
      }
    }
  }, [showQuoteView, clientData])

  // Enhanced auto-login loading screen with debug info
  if (autoLoggingIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Image
                src="/heavy-d-logo-dark.svg"
                alt="Heavy D Logo"
                width={180}
                height={60}
                className="h-15 w-auto mx-auto"
              />
            </div>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#000050]" />
            <p className="text-gray-600">{t("login.autoLogging")}</p>
            <p className="text-sm text-gray-500 mt-2">{t("login.pleaseWait")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Login Screen with enhanced debugging
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4">
              <Image
                src="/heavy-d-logo-dark.svg"
                alt="Heavy D Logo"
                width={180}
                height={60}
                className="h-15 w-auto mx-auto"
              />
            </div>
            <div className="flex justify-center mb-4">
              <LanguageSwitcher />
            </div>
            <CardTitle className="text-2xl font-bold text-[#000050]">{t("login.title")}</CardTitle>
            <CardDescription>{t("login.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={loginCredentials.email}
                onChange={(e) => setLoginCredentials((prev) => ({ ...prev, email: e.target.value }))}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessCode">{t("login.accessCode")}</Label>
              <Input
                id="accessCode"
                type="text"
                placeholder={t("login.accessCodePlaceholder")}
                value={loginCredentials.accessCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 8)
                  setLoginCredentials((prev) => ({ ...prev, accessCode: value }))
                }}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                maxLength={8}
              />
            </div>

            {loginError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{loginError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={() => handleLogin()}
              disabled={loading}
              className="w-full bg-[#000050] hover:bg-blue-800 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("login.loggingIn")}
                </>
              ) : (
                t("login.button")
              )}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>{t("login.needHelp")}</p>
              <p>
                {t("login.contactEmail")}{" "}
                <a href="mailto:info@heavydetailing.com" className="text-[#000050] underline">
                  info@heavydetailing.com
                </a>
              </p>
              <p>
                {t("login.contactPhone")}{" "}
                <a href="tel:+15148836732" className="text-[#000050] underline">
                  (514) 883-6732
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toast toast={toast} />

        {/* Admin Header */}
        <header className="bg-[#000050] text-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="h-6 w-6" />
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#000050]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Client Projects</h2>
            <p className="text-gray-600">Overview of all active client projects</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allClientsData.map((client, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <Badge className={`${getStatusColor(client.status)} flex items-center space-x-1`}>
                      {getStatusIcon(client.status)}
                      <span className="text-xs">{client.status}</span>
                    </Badge>
                  </div>
                  <CardDescription>{client.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Service:</strong> {client.service}
                    </p>
                    <p>
                      <strong>Email:</strong> {client.email}
                    </p>
                    <p>
                      <strong>Access Code:</strong> {client.accessCode}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Loading state for client data
  if (!clientData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#000050]" />
          <p className="text-gray-600">Loading your project dashboard...</p>
        </div>
      </div>
    )
  }

  // Quote/Receipt View
  if (showQuoteView && clientData) {
    const statusInfo = getStatusInfo(clientData.status)

    // Collapsible sections state for quote view
    const toggleQuoteSection = (sectionKey: string) => {
      setQuoteCollapsedSections((prev) => ({
        ...prev,
        [sectionKey]: !prev[sectionKey],
      }))
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Toast toast={toast} />

        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-1">
                <Button
                  variant="outline"
                  onClick={() => setShowQuoteView(false)}
                  className="flex-shrink-0 p-2 lg:px-4 lg:py-2"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">{t("receipt.backToDashboard")}</span>
                </Button>
                <Image
                  src="/heavy-d-logo-dark.svg"
                  alt="Heavy D Logo"
                  width={120}
                  height={40}
                  className="h-8 lg:h-10 w-auto flex-shrink-0"
                />
                <div className="hidden lg:block">
                  <h1 className="text-xl font-semibold text-gray-900">{statusInfo.label}</h1>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="flex lg:hidden">
                <Button variant="outline" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </div>

              {/* Desktop menu */}
              <div className="hidden lg:flex items-center space-x-4">
                <LanguageSwitcher />
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("header.logout")}
                </Button>
              </div>
            </div>

            {/* Mobile menu dropdown */}
            {showMobileMenu && (
              <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
                <div className="text-center">
                  <h1 className="text-lg font-semibold text-gray-900">{statusInfo.label}</h1>
                </div>
                <div className="flex flex-col space-y-2">
                  <LanguageSwitcher />
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("header.logout")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quote/Receipt Card */}
          <Card className="shadow-lg rounded-2xl overflow-hidden">
            {/* Fixed Header Layout */}
            <CardHeader className="bg-gradient-to-r from-[#000050] to-blue-800 text-white p-6 lg:p-8">
              <div className="flex flex-col space-y-4">
                {/* Top row: Logo left, Badge right */}
                <div className="flex items-center justify-between">
                  <Image
                    src="/heavy-d-logo-white.svg"
                    alt="Heavy D Logo"
                    width={120}
                    height={40}
                    className="h-8 lg:h-10 w-auto"
                  />
                  <Badge
                    className={`flex items-center space-x-2 px-3 lg:px-4 py-2 text-sm font-medium ${statusInfo.badgeClass}`}
                  >
                    {statusInfo.icon}
                    <span>{statusInfo.isReceipt ? t("receipt.label") : t("quote.label")}</span>
                  </Badge>
                </div>

                {/* Bottom row: Title centered */}
                <div className="text-center">
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    {statusInfo.isReceipt ? t("receipt.label") : t("quote.label")}
                  </h1>
                  <p className="text-blue-100 mt-1">{t("receipt.companyName")}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Client Information Section */}
              <div className="border-b border-gray-200">
                <div
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
                  onClick={() => toggleQuoteSection("clientInfo")}
                >
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-6 w-6 mr-2 text-[#000050]" />
                      {t("receipt.clientInformation")}
                    </h3>
                    {quoteCollapsedSections.clientInfo ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
                {!quoteCollapsedSections.clientInfo && (
                  <div className="p-6 bg-white">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.clientName")}</p>
                          <p className="font-semibold text-gray-900">{clientData.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.company")}</p>
                          <p className="font-semibold text-gray-900">{clientData.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Wrench className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.service")}</p>
                          <p className="font-semibold text-gray-900">{clientData.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.email")}</p>
                          <p className="font-semibold text-gray-900">{clientData.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.phone")}</p>
                          <p className="font-semibold text-gray-900">{clientData.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Details Section */}
              <div className="border-b border-gray-200">
                <div
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
                  onClick={() => toggleQuoteSection("documentDetails")}
                >
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FileText className="h-6 w-6 mr-2 text-[#000050]" />
                      {t("receipt.documentDetails")}
                    </h3>
                    {quoteCollapsedSections.documentDetails ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
                {!quoteCollapsedSections.documentDetails && (
                  <div className="p-6 bg-white">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.documentType")}</p>
                          <p className="font-semibold text-gray-900">
                            {statusInfo.isReceipt ? t("receipt.receiptType") : t("receipt.quoteType")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.status")}</p>
                          <p className="font-semibold text-gray-900">{clientData.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.date")}</p>
                          <p className="font-semibold text-gray-900">
                            {new Date().toLocaleDateString(language === "fr" ? "fr-CA" : "en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{t("receipt.accessCode")}</p>
                          <p className="font-semibold text-gray-900">{clientData.accessCode}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quote/Receipt Details Section */}
              <div className="border-b border-gray-200">
                <div
                  className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-colors"
                  onClick={() => toggleQuoteSection("quoteDetails")}
                >
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-6 w-6 mr-2 text-[#000050]" />
                        {statusInfo.isReceipt ? t("receipt.receiptDetails") : t("receipt.quoteBreakdown")}
                      </h3>
                      {/* Status Badge */}
                      {clientData.status.toLowerCase() === "paid" && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-bold ml-4">
                          ✅ {t("receipt.paidBadge")}
                        </Badge>
                      )}
                    </div>
                    {quoteCollapsedSections.quoteDetails ? (
                      <ChevronDown className="h-5 w-5 text-gray-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
                {!quoteCollapsedSections.quoteDetails && (
                  <div className="p-6 bg-white">
                    {loadingQuoteData ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-[#000050]" />
                        <p className="text-gray-600">
                          {t("receipt.loadingDetails", {
                            type: statusInfo.isReceipt ? t("receipt.receipt") : t("receipt.quote"),
                          })}
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden lg:block border border-gray-300 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <th className="px-6 py-4 text-left font-semibold text-gray-900">
                                  {t("receipt.itemDescription")}
                                </th>
                                <th className="px-6 py-4 text-center font-semibold text-gray-900">
                                  {t("receipt.quantity")}
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-900">
                                  {t("receipt.unitPrice")}
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-900">
                                  {t("receipt.total")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {quoteBreakdown.length > 0 ? (
                                quoteBreakdown.map((item, index) => (
                                  <tr
                                    key={index}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                  >
                                    <td className="px-6 py-4 text-gray-900 font-medium">{item.description}</td>
                                    <td className="px-6 py-4 text-center text-gray-700">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-gray-700 font-mono">
                                      {formatCurrency(item.price.toString())}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900 font-mono">
                                      {formatCurrency(item.total.toString())}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 text-gray-900 font-medium">{clientData.service}</td>
                                  <td className="px-6 py-4 text-center text-gray-700">1</td>
                                  <td className="px-6 py-4 text-right text-gray-700 font-mono">
                                    {formatCurrency(clientData.quoteTotal || "0")}
                                  </td>
                                  <td className="px-6 py-4 text-right font-semibold text-gray-900 font-mono">
                                    {formatCurrency(clientData.quoteTotal || "0")}
                                  </td>
                                </tr>
                              )}

                              {/* Add subtotal and taxes for receipts only */}
                              {statusInfo.isReceipt &&
                                (() => {
                                  const subtotal =
                                    quoteBreakdown.length > 0
                                      ? quoteBreakdown.reduce((sum, item) => sum + item.total, 0)
                                      : Number.parseFloat(clientData.quoteTotal || "0")
                                  const taxes = calculateQuebecTaxes(subtotal)

                                  return (
                                    <>
                                      {/* Subtotal Row */}
                                      <tr className="border-b border-gray-200 bg-gray-50">
                                        <td colSpan={3} className="px-6 py-3 text-right font-semibold text-gray-900">
                                          {t("receipt.subtotal").toUpperCase()}:
                                        </td>
                                        <td className="px-6 py-3 text-right font-semibold text-gray-900 font-mono">
                                          {formatCurrency(subtotal)}
                                        </td>
                                      </tr>

                                      {/* GST Row */}
                                      <tr className="border-b border-gray-200">
                                        <td colSpan={3} className="px-6 py-3 text-right text-gray-700">
                                          {t("receipt.gst")}:
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-700 font-mono">
                                          {formatCurrency(taxes.gst)}
                                        </td>
                                      </tr>

                                      {/* QST Row */}
                                      <tr className="border-b border-gray-200">
                                        <td colSpan={3} className="px-6 py-3 text-right text-gray-700">
                                          {t("receipt.qst")}:
                                        </td>
                                        <td className="px-6 py-3 text-right text-gray-700 font-mono">
                                          {formatCurrency(taxes.qst)}
                                        </td>
                                      </tr>

                                      {/* Total Taxes Row */}
                                      <tr className="border-b border-gray-200 bg-gray-50">
                                        <td colSpan={3} className="px-6 py-3 text-right font-semibold text-gray-900">
                                          {t("receipt.finalTotal").toUpperCase()}:
                                        </td>
                                        <td className="px-6 py-3 text-right font-semibold text-gray-900 font-mono">
                                          {formatCurrency(taxes.totalTaxes)}
                                        </td>
                                      </tr>
                                    </>
                                  )
                                })()}
                            </tbody>
                            <tfoot>
                              <tr className="bg-gradient-to-r from-[#000050] to-blue-800 text-white">
                                <td colSpan={3} className="px-6 py-4 text-right font-bold text-lg">
                                  {t("receipt.totalAmount")}:
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-xl font-mono">
                                  {(() => {
                                    if (statusInfo.isReceipt) {
                                      const subtotal =
                                        quoteBreakdown.length > 0
                                          ? quoteBreakdown.reduce((sum, item) => sum + item.total, 0)
                                          : Number.parseFloat(clientData.quoteTotal || "0")
                                      const taxes = calculateQuebecTaxes(subtotal)
                                      return formatCurrency(taxes.total)
                                    } else {
                                      return quoteBreakdown.length > 0
                                        ? formatCurrency(
                                            quoteBreakdown.reduce((sum, item) => sum + item.total, 0).toString(),
                                          )
                                        : formatCurrency(clientData.quoteTotal || "0")
                                    }
                                  })()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="lg:hidden space-y-4">
                          {quoteBreakdown.length > 0 ? (
                            quoteBreakdown.map((item, index) => (
                              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm text-gray-600 font-medium">{t("receipt.itemDescription")}</p>
                                    <p className="text-lg font-semibold text-gray-900">{item.description}</p>
                                  </div>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-sm text-gray-600 font-medium">{t("receipt.quantity")}</p>
                                      <p className="text-base font-semibold text-gray-900">{item.quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600 font-medium">{t("receipt.unitPrice")}</p>
                                      <p className="text-base font-semibold text-gray-900 font-mono">
                                        {formatCurrency(item.price.toString())}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-600 font-medium">{t("receipt.total")}</p>
                                      <p className="text-lg font-bold text-[#000050] font-mono">
                                        {formatCurrency(item.total.toString())}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm text-gray-600 font-medium">{t("receipt.itemDescription")}</p>
                                  <p className="text-lg font-semibold text-gray-900">{clientData.service}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600 font-medium">{t("receipt.quantity")}</p>
                                    <p className="text-base font-semibold text-gray-900">1</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 font-medium">{t("receipt.unitPrice")}</p>
                                    <p className="text-base font-semibold text-gray-900 font-mono">
                                      {formatCurrency(clientData.quoteTotal || "0")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600 font-medium">{t("receipt.total")}</p>
                                    <p className="text-lg font-bold text-[#000050] font-mono">
                                      {formatCurrency(clientData.quoteTotal || "0")}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mobile Summary Card */}
                          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4">
                            {statusInfo.isReceipt ? (
                              (() => {
                                const subtotal =
                                  quoteBreakdown.length > 0
                                    ? quoteBreakdown.reduce((sum, item) => sum + item.total, 0)
                                    : Number.parseFloat(clientData.quoteTotal || "0")
                                const taxes = calculateQuebecTaxes(subtotal)

                                return (
                                  <div className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="font-medium text-gray-900">{t("receipt.subtotal")}:</span>
                                      <span className="font-mono text-gray-900">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">{t("receipt.gst")}:</span>
                                      <span className="font-mono text-gray-700">{formatCurrency(taxes.gst)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-700">{t("receipt.qst")}:</span>
                                      <span className="font-mono text-gray-700">{formatCurrency(taxes.qst)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-3">
                                      <span className="font-bold text-gray-900">{t("receipt.finalTotal")}:</span>
                                      <span className="font-mono font-bold text-gray-900">
                                        {formatCurrency(taxes.totalTaxes)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between bg-[#000050] text-white p-3 rounded-lg -mx-1">
                                      <span className="font-bold text-lg">{t("receipt.totalAmount")}:</span>
                                      <span className="font-mono font-bold text-xl">{formatCurrency(taxes.total)}</span>
                                    </div>
                                  </div>
                                )
                              })()
                            ) : (
                              <div className="bg-[#000050] text-white p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-lg">{t("receipt.totalAmount")}:</span>
                                  <span className="font-mono font-bold text-xl">
                                    {quoteBreakdown.length > 0
                                      ? formatCurrency(
                                          quoteBreakdown.reduce((sum, item) => sum + item.total, 0).toString(),
                                        )
                                      : formatCurrency(clientData.quoteTotal || "0")}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-gray-50">
                {statusInfo.isReceipt ? (
                  // Receipt view - show Pay Now button and Download PDF
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => alert("Payment processing coming soon! Please contact us to arrange payment.")}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      {t("receipt.payNow")}
                    </Button>

                    {/* PDF Download Button for receipts - always show, use Column S (receiptPdfUrl) */}
                    <Button
                      variant="outline"
                      onClick={() => window.open(clientData.receiptPdfUrl, "_blank")}
                      className="border-[#000050] text-[#000050] hover:bg-[#000050] hover:text-white px-8 py-3 text-lg"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {t("receipt.downloadPdf")}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ) : // Quote view - show accept button only if status is "Quote Sent", otherwise show accepted state or just download
                clientData.status === "Quote Sent" ? (
                  // Show accept button only when status is exactly "Quote Sent"
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleAcceptQuote}
                      disabled={acceptingQuote}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                    >
                      {acceptingQuote ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {t("quote.processing")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {t("quote.acceptQuote")}
                        </>
                      )}
                    </Button>

                    {/* PDF Download Button for quotes - use Column R */}
                    {clientData.quotePdfUrl && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(clientData.quotePdfUrl, "_blank")}
                        className="border-[#000050] text-[#000050] hover:bg-[#000050] hover:text-white px-8 py-3 text-lg"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        {t("receipt.downloadPdf")}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : quoteAccepted || clientData.status.toLowerCase().includes("accepted") ? (
                  // Show accepted state for accepted quotes
                  <div className="bg-green-50 border border-green-200 rounded-lg px-8 py-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-semibold text-green-800">{t("quote.accepted")}</p>
                    <p className="text-sm text-green-600">{t("quote.acceptedDescription")}</p>

                    {/* Keep PDF download available after acceptance */}
                    {clientData.quotePdfUrl && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={() => window.open(clientData.quotePdfUrl, "_blank")}
                          className="border-[#000050] text-[#000050] hover:bg-[#000050] hover:text-white px-6 py-2"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {t("receipt.downloadQuotePdf")}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  // For other statuses (In Progress, etc.), just show download button
                  <div className="flex justify-center">
                    {clientData.quotePdfUrl && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(clientData.quotePdfUrl, "_blank")}
                        className="border-[#000050] text-[#000050] hover:bg-[#000050] hover:text-white px-8 py-3 text-lg"
                      >
                        <FileText className="h-5 w-5 mr-2" />
                        {t("receipt.downloadPdf")}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-8 border-t text-center text-gray-600">
                  <p className="text-sm">{t("receipt.thankYou")}</p>
                  <p className="text-sm mt-2">
                    {t("receipt.questionsContact")}{" "}
                    <a href="mailto:info@heavydetailing.com" className="text-[#000050] underline">
                      info@heavydetailing.com
                    </a>{" "}
                    {t("receipt.or")}{" "}
                    <a href="tel:+15148836732" className="text-[#000050] underline">
                      (514) 883-6732
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Main Client Dashboard (only renders when clientData exists)
  return (
    <div className="min-h-screen bg-gray-50 text-base lg:text-sm">
      <Toast toast={toast} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-4 min-w-0 flex-1">
              <Image
                src="/heavy-d-logo-dark.svg"
                alt="Heavy D Logo"
                width={120}
                height={40}
                className="h-8 lg:h-10 w-auto flex-shrink-0"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900">Client Dashboard</h1>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex sm:hidden">
              <Button variant="outline" size="sm" onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:flex items-center space-x-4">
              <LanguageSwitcher />
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("header.logout")}
              </Button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {showMobileMenu && (
            <div className="sm:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
              <div className="flex flex-col space-y-2">
                <LanguageSwitcher />
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("header.logout")}
                </Button>
                <div className="text-center py-2 border-t border-gray-200">
                  <p className="text-sm text-gray-500">{t("header.needHelp")}</p>
                  <p className="text-sm font-medium text-[#000050]">(514) 883-6732</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#000050] to-blue-800 rounded-lg p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("welcome.title", { name: clientData.name })}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span className="text-lg">{clientData.company}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5" />
                <span>{clientData.service}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden space-y-4">
          {/* 1. Project Information */}
          <Card className="border-2 border-gray-100">
            <CardHeader
              className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer"
              onClick={() => toggleSection("projectInfo")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="h-6 w-6 text-[#000050]" />
                  <span>{t("project.title")}</span>
                </CardTitle>
                {collapsedSections.projectInfo ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {!collapsedSections.projectInfo && (
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t("project.client")}</p>
                      <p className="font-semibold text-gray-900">{clientData.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t("project.company")}</p>
                      <p className="font-semibold text-gray-900">{clientData.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Wrench className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t("project.service")}</p>
                      <p className="font-semibold text-gray-900">{clientData.service}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 2. Your Quote */}
          <Card className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
            <CardHeader
              className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer"
              onClick={() => toggleSection("quote")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileText className="h-6 w-6 text-[#000050]" />
                    <span>{getSectionTitle(clientData.status)}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(clientData.status)} flex items-center space-x-1 px-3 py-1`}>
                      {getStatusIcon(clientData.status)}
                      <span className="font-medium">{clientData.status}</span>
                    </Badge>
                    {collapsedSections.quote ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                  </div>
                </div>
              </div>
            </CardHeader>
            {!collapsedSections.quote && (
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col space-y-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#000050] rounded-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-xl text-gray-900">{getDocumentTitle(clientData.status)}</p>
                      <p className="text-base text-gray-600">{t("quote.detailedBreakdown")}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowQuoteView(true)}
                    className="w-full bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white px-6 py-4 font-medium text-lg"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {getViewButtonText(clientData.status)}
                  </Button>
                </div>

                {clientData.status === "Quote Sent" && (
                  <div className="pt-2">
                    <Button
                      onClick={handleAcceptQuote}
                      disabled={acceptingQuote}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium rounded-xl"
                    >
                      {acceptingQuote ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {t("quote.processing")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {t("quote.acceptQuote")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* 3. Project Timeline */}
          <Card className="border-2 border-gray-100">
            <CardHeader
              className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer"
              onClick={() => toggleSection("timeline")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="h-6 w-6 text-[#000050]" />
                  <span>{t("project.status")}</span>
                </CardTitle>
                {collapsedSections.timeline ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
            </CardHeader>
            {!collapsedSections.timeline && (
              <CardContent className="p-6">
                {/* Current Step Display */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#000050] rounded-lg">{getStatusIcon(clientData.status)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">{t("project.currentStatus")}</p>
                      <p className="text-xl font-bold text-gray-900">{getCurrentStep(clientData.status).name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getStatusDescription(getCurrentStep(clientData.status).key)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Quote Sent</span>
                    <span>Completed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#000050] to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(getTimelineSteps(clientData.status).filter((step) => step.active).length / getTimelineSteps(clientData.status).length) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>
                      {t("project.stepsCompleted", {
                        completed: getTimelineSteps(clientData.status).filter((step) => step.active).length,
                        total: getTimelineSteps(clientData.status).length,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* 4. Design Revisions - Using RevisionGallery from version 2 in section style */}
          <Card className="border-2 border-gray-100">
            <CardHeader
              className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer"
              onClick={() => toggleSection("revisions")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Eye className="h-6 w-6 text-[#000050]" />
                  <span>{t("revisions.title")}</span>
                </CardTitle>
                {collapsedSections.revisions ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
            </CardHeader>
            {!collapsedSections.revisions && (
              <CardContent className="p-0">
                <RevisionGallery
                  revisionFolderLink={clientData.revisionFolderLink}
                  clientData={{
                    name: clientData.name,
                    company: clientData.company,
                    service: clientData.service,
                    email: clientData.email,
                  }}
                  onCommentSubmit={handleSubmitComment}
                />
              </CardContent>
            )}
          </Card>

          {/* 5. File Upload */}
          <Card className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
            <CardHeader
              className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer"
              onClick={() => toggleSection("upload")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Upload className="h-6 w-6 text-[#000050]" />
                  <span>{t("upload.title")}</span>
                </CardTitle>
                {collapsedSections.upload ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
            </CardHeader>
            {!collapsedSections.upload && (
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-gray-600">{t("upload.description")}</p>
                  <FileUploadZone
                    uploadFolderLink={clientData.uploadFolderLink}
                    onUploadComplete={(files) => {
                      showToast(t("upload.success", { count: files.length }), "success")
                    }}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* 6. Need Help? */}
          <Card className="border-2 border-gray-100">
            <CardHeader
              className="bg-gradient-to-r from-gray-50 to-gray-100 border-b cursor-pointer"
              onClick={() => toggleSection("contact")}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <MessageSquare className="h-6 w-6 text-[#000050]" />
                  <span>{t("contact.title")}</span>
                </CardTitle>
                {collapsedSections.contact ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
            </CardHeader>
            {!collapsedSections.contact && (
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-4">{t("contact.description")}</p>
                <div className="space-y-3">
                  <a
                    href="mailto:info@heavydetailing.com"
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg text-[#000050] hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Email Us</p>
                      <p className="text-sm">info@heavydetailing.com</p>
                    </div>
                  </a>
                  <a
                    href="tel:+15148836732"
                    className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg text-[#000050] hover:bg-green-100 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Call Us</p>
                      <p className="text-sm">(514) 883-6732</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote/Receipt Section */}
            <Card className="border-2 border-gray-100 hover:border-gray-200 transition-colors">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileText className="h-6 w-6 text-[#000050]" />
                    <span>{getSectionTitle(clientData.status)}</span>
                  </CardTitle>
                  <Badge className={`${getStatusColor(clientData.status)} flex items-center space-x-1 px-3 py-1`}>
                    {getStatusIcon(clientData.status)}
                    <span className="font-medium">{clientData.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#000050] rounded-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg lg:text-xl text-gray-900">
                        {getDocumentTitle(clientData.status)}
                      </p>
                      <p className="text-sm lg:text-base text-gray-600">{t("quote.detailedBreakdown")}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowQuoteView(true)}
                    className="w-full lg:w-auto bg-white text-[#000050] border-[#000050] hover:bg-[#000050] hover:text-white px-6 py-4 lg:py-3 font-medium text-lg lg:text-base"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {getViewButtonText(clientData.status)}
                  </Button>
                </div>

                {clientData.status === "Quote Sent" && (
                  <div className="pt-2">
                    <Button
                      onClick={handleAcceptQuote}
                      disabled={acceptingQuote}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium rounded-xl"
                    >
                      {acceptingQuote ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {t("quote.processing")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {t("quote.acceptQuote")}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>{t("upload.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{t("upload.description")}</CardDescription>
                <FileUploadZone
                  uploadFolderLink={clientData.uploadFolderLink}
                  onUploadComplete={(files) => {
                    showToast(t("upload.success", { count: files.length }), "success")
                  }}
                />
              </CardContent>
            </Card>

            {/* Design Preview Section - Using RevisionGallery from version 2 */}
            <Card className="border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Eye className="h-6 w-6 text-[#000050]" />
                  <span>{t("revisions.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RevisionGallery
                  revisionFolderLink={clientData.revisionFolderLink}
                  clientData={{
                    name: clientData.name,
                    company: clientData.company,
                    service: clientData.service,
                    email: clientData.email,
                  }}
                  onCommentSubmit={handleSubmitComment}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card className="border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <User className="h-6 w-6 text-[#000050]" />
                  <span>{t("project.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t("project.client")}</p>
                      <p className="font-semibold text-gray-900">{clientData.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t("project.company")}</p>
                      <p className="font-semibold text-gray-900">{clientData.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Wrench className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">{t("project.service")}</p>
                      <p className="font-semibold text-gray-900">{clientData.service}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card className="border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="h-6 w-6 text-[#000050]" />
                  <span>{t("timeline.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {getTimelineSteps(clientData.status).map((step, index) => (
                    <div key={step.key} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            step.active ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                          }`}
                        >
                          {step.active && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${step.active ? "text-green-800" : "text-gray-500"}`}>
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {step.key === "quote_sent" && t("timeline.quoteSent")}
                          {step.key === "quote_accepted" && t("timeline.quoteAccepted")}
                          {step.key === "in_progress" && t("timeline.inProgress")}
                          {step.key === "designed" && t("timeline.designed")}
                          {step.key === "printed" && t("timeline.printed")}
                          {step.key === "completed" && t("timeline.completed")}
                          {step.key === "paid" && t("timeline.paid")}
                        </p>
                      </div>
                      {step.active && (
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-2 border-gray-100">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <MessageSquare className="h-6 w-6 text-[#000050]" />
                  <span>{t("contact.title")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-gray-600 mb-4">{t("contact.description")}</p>
                <div className="space-y-3">
                  <a
                    href="mailto:info@heavydetailing.com"
                    className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg text-[#000050] hover:bg-blue-100 transition-colors"
                  >
                    <Mail className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Email Us</p>
                      <p className="text-sm">info@heavydetailing.com</p>
                    </div>
                  </a>
                  <a
                    href="tel:+15148836732"
                    className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg text-[#000050] hover:bg-green-100 transition-colors"
                  >
                    <Phone className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Call Us</p>
                      <p className="text-sm">(514) 883-6732</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#000050] text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Image
              src="/heavy-d-logo-white.svg"
              alt="Heavy D Logo"
              width={120}
              height={40}
              className="h-10 w-auto mx-auto mb-4"
            />
            <p className="text-gray-300">{t("footer.description")}</p>
            <p className="text-sm text-gray-400 mt-2">© 2024 Heavy D Print & Design. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
