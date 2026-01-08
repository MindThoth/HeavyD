"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

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

interface QuoteItem {
  description: string
  quantity: number
  price: number
  total: number
}

export default function PrintViewPage() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [quoteBreakdown, setQuoteBreakdown] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingQuoteData, setLoadingQuoteData] = useState(false)

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    clientInfo: true,
    documentDetails: true,
    quoteDetails: true,
  })

  const email = searchParams.get("email")
  const code = searchParams.get("code")

  // Google Apps Script endpoint
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzpZH1kw0ZDn6QYbllpRJ6g33OwZP_kLMfU8X-EcDOEKgre_1uznhp2DZbCbY9zz8Phow/exec"

  // Demo mode flag
  const DEMO_MODE = false

  // Demo data
  const DEMO_CLIENT_DATA: ClientData = {
    status: "Quote Sent",
    name: "John Smith",
    company: "Blue Bay Boats",
    service: "Boat Lettering",
    quotePdfUrl: "https://drive.google.com/file/d/1234567890/view",
    revisionFolderLink: "https://drive.google.com/drive/folders/0987654321",
    uploadFolderLink: "https://drive.google.com/drive/folders/0987654321",
    email: "john@bluebayboats.com",
    phone: "514-555-1212",
    language: "EN",
    accessCode: "1234",
    quoteTotal: "225.00",
  }

  const DEMO_QUOTE_BREAKDOWN = [
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
  ]

  useEffect(() => {
    if (!email || !code) {
      setError("Access denied: Invalid credentials.")
      setLoading(false)
      return
    }

    handleLogin()
  }, [email, code])

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      if (DEMO_MODE) {
        // Demo mode
        if (email === DEMO_CLIENT_DATA.email && code === DEMO_CLIENT_DATA.accessCode) {
          setClientData(DEMO_CLIENT_DATA)
          setQuoteBreakdown(DEMO_QUOTE_BREAKDOWN)
        } else {
          setError("Access denied: Invalid credentials.")
        }
      } else {
        // Real mode
        const loginUrl = `${SCRIPT_URL}?action=login&email=${encodeURIComponent(email)}&accessCode=${encodeURIComponent(code)}`
        const response = await fetch(loginUrl)

        if (!response.ok) {
          throw new Error(`Login failed with status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.clientData) {
          setClientData(data.clientData)

          // Fetch quote breakdown if spreadsheet ID is available
          if (data.clientData.quoteSpreadsheetId) {
            await fetchQuoteBreakdown(data.clientData.quoteSpreadsheetId, email)
          } else {
            // Fallback to basic quote data
            setQuoteBreakdown([
              {
                description: data.clientData.service || "Service",
                quantity: 1,
                price: Number.parseFloat(data.clientData.quoteTotal || "0"),
                total: Number.parseFloat(data.clientData.quoteTotal || "0"),
              },
            ])
          }
        } else {
          setError("Access denied: Invalid credentials.")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Access denied: Invalid credentials.")
    } finally {
      setLoading(false)
    }
  }

  const fetchQuoteBreakdown = async (spreadsheetId: string, clientEmail: string) => {
    try {
      setLoadingQuoteData(true)

      let finalSpreadsheetId = spreadsheetId
      if (spreadsheetId.includes("spreadsheets")) {
        const spreadsheetIdMatch = spreadsheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
        if (spreadsheetIdMatch) {
          finalSpreadsheetId = spreadsheetIdMatch[1]
        }
      }

      if (DEMO_MODE) {
        setQuoteBreakdown(DEMO_QUOTE_BREAKDOWN)
      } else {
        const response = await fetch(
          `${SCRIPT_URL}?action=getQuoteBreakdown&spreadsheetId=${finalSpreadsheetId}&clientEmail=${encodeURIComponent(clientEmail)}`,
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.quoteItems && data.quoteItems.length > 0) {
            setQuoteBreakdown(data.quoteItems)
          } else {
            // Fallback to service-based item
            setQuoteBreakdown([
              {
                description: clientData?.service || "Service",
                quantity: 1,
                price: Number.parseFloat(clientData?.quoteTotal || "0"),
                total: Number.parseFloat(clientData?.quoteTotal || "0"),
              },
            ])
          }
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const formatCurrency = (amount: string | number): string => {
    const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(numericAmount)) return "$0.00"

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numericAmount)
  }

  const getStatusInfo = (status: string) => {
    const statusLower = status.toLowerCase()
    const isCompleted =
      statusLower.includes("completed") || statusLower.includes("paid") || statusLower.includes("receipt sent")

    return {
      isReceipt: isCompleted,
      label: isCompleted
        ? statusLower.includes("paid")
          ? t("receipt.paidLabel")
          : t("receipt.label")
        : t("quote.label"),
    }
  }

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center print:hidden">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">{t("loading.general")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center print:hidden">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t("receipt.accessDenied")}</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center print:hidden">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t("receipt.accessDenied")}</h1>
          <p className="text-gray-600">{t("receipt.invalidCredentials")}</p>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(clientData.status)
  const totalAmount = quoteBreakdown.reduce((sum, item) => sum + item.total, 0)
  const taxes = calculateQuebecTaxes(totalAmount)

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print-container { 
            width: 8.5in; 
            min-height: 11in; 
            margin: 0; 
            padding: 0.5in;
            font-size: 12pt;
            line-height: 1.4;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          table { page-break-inside: avoid; }
          tr { page-break-inside: avoid; }
          .collapsible-content { display: block !important; max-height: none !important; opacity: 1 !important; }
          .chevron-icon { display: none !important; }
        }
        
        @page {
          size: letter;
          margin: 0.5in;
        }
      `}</style>

      <div
        className="min-h-screen bg-gray-50 print:bg-white text-black print-container"
        style={{ fontFamily: 'Inter, "Open Sans", sans-serif' }}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none space-y-6">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-300 print:border-gray-300">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("receipt.headerTitle")}</h1>
            <p className="text-lg text-gray-600">{t("receipt.companyName")}</p>
            <p className="text-sm text-gray-500">{t("receipt.tagline")}</p>
          </div>

          {/* Document Type Badge */}
          <div className="text-center mb-8">
            <div className="inline-block px-6 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900">{statusInfo.label}</h2>
              {clientData.status.toLowerCase() === "paid" && (
                <div className="mt-2">
                  <span className="inline-block px-4 py-1 bg-green-100 text-green-800 border border-green-300 rounded-full text-sm font-bold">
                    ✅ {t("receipt.paidBadge")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Client Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 cursor-pointer select-none print:cursor-default hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              onClick={() => toggleSection("clientInfo")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("receipt.clientInformation")}</h3>
                <div className="chevron-icon">
                  {expandedSections.clientInfo ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`collapsible-content transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.clientInfo ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.clientName")}:</span>
                    <p className="text-lg font-semibold text-gray-900">{clientData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.company")}:</span>
                    <p className="text-lg font-semibold text-gray-900">{clientData.company}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.service")}:</span>
                    <p className="text-lg font-semibold text-gray-900">{clientData.service}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.email")}:</span>
                    <p className="text-base text-gray-900">{clientData.email}</p>
                  </div>
                  {clientData.phone && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">{t("receipt.phone")}:</span>
                      <p className="text-base text-gray-900">{clientData.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 cursor-pointer select-none print:cursor-default hover:from-green-700 hover:to-teal-700 transition-all duration-200"
              onClick={() => toggleSection("documentDetails")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("receipt.documentDetails")}</h3>
                <div className="chevron-icon">
                  {expandedSections.documentDetails ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`collapsible-content transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.documentDetails ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.status")}:</span>
                    <p className="text-lg font-semibold text-gray-900">{clientData.status}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.date")}:</span>
                    <p className="text-lg font-semibold text-gray-900">{getCurrentDate()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.accessCode")}:</span>
                    <p className="text-lg font-semibold text-gray-900">{clientData.accessCode}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">{t("receipt.documentType")}:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {statusInfo.isReceipt ? t("receipt.receiptType") : t("receipt.quoteType")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote/Receipt Details Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 cursor-pointer select-none print:cursor-default hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              onClick={() => toggleSection("quoteDetails")}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {statusInfo.isReceipt ? t("receipt.receiptDetails") : t("receipt.quoteBreakdown")}
                </h3>
                <div className="chevron-icon">
                  {expandedSections.quoteDetails ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </div>

            <div
              className={`collapsible-content transition-all duration-300 ease-in-out overflow-hidden ${
                expandedSections.quoteDetails ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-6">
                {loadingQuoteData ? (
                  <div className="text-center py-8 no-print">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-gray-600" />
                    <p className="text-gray-600">
                      {t("receipt.loadingDetails", {
                        type: statusInfo.isReceipt ? t("receipt.receipt") : t("receipt.quote"),
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300">
                          <th className="px-4 py-3 text-left font-bold text-gray-900 border-r border-gray-300">
                            {t("receipt.itemDescription")}
                          </th>
                          <th className="px-4 py-3 text-center font-bold text-gray-900 border-r border-gray-300">
                            {t("receipt.quantity")}
                          </th>
                          <th className="px-4 py-3 text-right font-bold text-gray-900 border-r border-gray-300">
                            {t("receipt.unitPrice")}
                          </th>
                          <th className="px-4 py-3 text-right font-bold text-gray-900">{t("receipt.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quoteBreakdown.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="px-4 py-3 text-gray-900 border-r border-gray-200">{item.description}</td>
                            <td className="px-4 py-3 text-center text-gray-900 border-r border-gray-200">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-900 border-r border-gray-200">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {statusInfo.isReceipt ? (
                        <tfoot>
                          <tr>
                            <td colSpan={4} className="px-4 py-2">
                              <table className="w-full">
                                <tbody>
                                  <tr>
                                    <td className="text-right font-bold px-4 py-2">{t("receipt.subtotal")}:</td>
                                    <td className="text-right px-4 py-2">{formatCurrency(totalAmount)}</td>
                                  </tr>
                                  <tr>
                                    <td className="text-right font-bold px-4 py-2">{t("receipt.gst")}:</td>
                                    <td className="text-right px-4 py-2">{formatCurrency(taxes.gst)}</td>
                                  </tr>
                                  <tr>
                                    <td className="text-right font-bold px-4 py-2">{t("receipt.qst")}:</td>
                                    <td className="text-right px-4 py-2">{formatCurrency(taxes.qst)}</td>
                                  </tr>
                                  <tr className="bg-gray-900 text-white">
                                    <td className="text-right font-bold text-lg px-4 py-3">
                                      {t("receipt.finalTotal")}:
                                    </td>
                                    <td className="text-right font-bold text-lg px-4 py-3">
                                      {formatCurrency(taxes.total)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tfoot>
                      ) : (
                        <tfoot>
                          <tr className="bg-gray-900 text-white">
                            <td colSpan={3} className="px-4 py-4 text-right font-bold text-lg border-r border-gray-600">
                              {t("receipt.totalAmount")}:
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-xl">{formatCurrency(totalAmount)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-gray-300 print:border-gray-300">
            <p className="text-sm text-gray-600 mb-2">{t("receipt.thankYou")}</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <strong>{t("receipt.emailLabel")}:</strong> info@heavydetailing.com
              </p>
              <p className="text-sm text-gray-600">
                <strong>{t("receipt.phoneLabel")}:</strong> (514) 883-6732
              </p>
              <p className="text-sm text-gray-600">
                <strong>{t("receipt.websiteLabel")}:</strong> heavydetailing.com
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-4">{t("receipt.copyright")}</p>
          </div>
        </div>
      </div>
    </>
  )
}
