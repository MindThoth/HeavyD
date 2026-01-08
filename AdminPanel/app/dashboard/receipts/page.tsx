"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Receipt, ExternalLink, Send, CheckCircle2, XCircle, Search, FolderOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { receiptsApi, ReceiptInfo } from "@/lib/api"
import Link from "next/link"
import { BoatLoading } from "@/components/ui/boat-loading"
import { useCache } from "@/app/providers/cache-provider"

type SortField = 'clientName' | 'accessCode' | 'date' | 'amount' | 'status' | 'inReceiptFolder'
type SortDirection = 'asc' | 'desc'

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptInfo[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sendingReceipt, setSendingReceipt] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const { toast } = useToast()
  const cache = useCache()

  useEffect(() => {
    loadReceipts()
  }, [])

  useEffect(() => {
    let filtered = receipts

    // Apply search filter
    if (searchTerm) {
      filtered = receipts.filter(receipt =>
        receipt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.accessCode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      // Handle date sorting
      if (sortField === 'date') {
        aVal = new Date(a.date || '').getTime()
        bVal = new Date(b.date || '').getTime()
      }

      // Handle numeric sorting for amount
      if (sortField === 'amount') {
        aVal = parseFloat(String(a.amount || '0').replace(/[^0-9.-]+/g, ''))
        bVal = parseFloat(String(b.amount || '0').replace(/[^0-9.-]+/g, ''))
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    setFilteredReceipts(filtered)
  }, [searchTerm, receipts, sortField, sortDirection])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc') // Default to desc when changing field
    }
  }

  const loadReceipts = async () => {
    try {
      // Check cache first
      const cachedReceipts = cache.get<ReceiptInfo[]>('receipts_list')
      if (cachedReceipts) {
        setReceipts(cachedReceipts)
        setFilteredReceipts(cachedReceipts)
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await receiptsApi.getAllReceipts()
      if (response.success && response.receipts) {
        setReceipts(response.receipts)
        setFilteredReceipts(response.receipts)
        cache.set('receipts_list', response.receipts)
      }
    } catch (error: any) {
      console.error("Error loading receipts:", error)
      toast({
        title: "Error",
        description: "Failed to load receipts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const sendToReceiptFolder = async (receipt: ReceiptInfo) => {
    try {
      setSendingReceipt(receipt.accessCode)
      const response = await receiptsApi.sendReceiptToFolder(receipt.accessCode)

      if (response.success) {
        toast({
          title: "Success",
          description: `Receipt sent to folder: ${response.folderPath}`
        })
        // Reload receipts to update status
        loadReceipts()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send receipt to folder",
        variant: "destructive"
      })
    } finally {
      setSendingReceipt(null)
    }
  }

  const formatDateTime = (dateTimeStr: string | Date): string => {
    if (!dateTimeStr) return '-'

    // If it's already a string in the correct format, return it
    if (typeof dateTimeStr === 'string') {
      // Check if it matches "YYYY-MM-DD H:MM" or "YYYY-MM-DD HH:MM"
      if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2}$/)) {
        return dateTimeStr
      }
      // Check if it's just a date without time
      if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateTimeStr + ' 00:00'
      }
    }

    // Try to parse as Date object
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return String(dateTimeStr) || '-'

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Generated": "bg-blue-100 text-blue-800",
      "Receipt Sent": "bg-yellow-100 text-yellow-800",
      "Paid": "bg-green-100 text-green-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-600 mt-2">Manage project receipts and organize in receipt folder</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open(`https://drive.google.com/drive/folders/1ER41h357d3tru7bQ1ulf78COcQ5fojan`, '_blank')}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Open Receipt Folder
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by client name, company, or access code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipts Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <BoatLoading size="md" />
        </div>
      ) : filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Receipt className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Receipts Found</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search" : "No receipts have been created yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Receipts ({filteredReceipts.length})</CardTitle>
            <CardDescription>View and manage project receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                    <th className="px-4 py-3">
                      <button
                        onClick={() => toggleSort('date')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Date
                        {sortField === 'date' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => toggleSort('clientName')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Client
                        {sortField === 'clientName' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => toggleSort('accessCode')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Code
                        {sortField === 'accessCode' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => toggleSort('amount')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Amount
                        {sortField === 'amount' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        onClick={() => toggleSort('status')}
                        className="flex items-center gap-1 hover:text-gray-700"
                      >
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">Receipt Link</th>
                    <th className="px-4 py-3">In Folder</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.accessCode} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDateTime(receipt.date)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/client/${receipt.accessCode}`}
                          className="block hover:underline"
                        >
                          <p className="text-sm font-medium text-blue-600 hover:text-blue-800">{receipt.clientName}</p>
                          {receipt.company && (
                            <p className="text-sm text-gray-600">{receipt.company}</p>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{receipt.accessCode}</td>
                      <td className="px-4 py-3 text-sm font-medium">{receipt.amount || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(receipt.status)}>
                          {receipt.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {receipt.receiptLink ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(receipt.receiptLink, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">No receipt</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {receipt.inReceiptFolder ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span className="text-sm">Yes</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <XCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">No</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {receipt.receiptLink && !receipt.inReceiptFolder && (
                          <Button
                            size="sm"
                            onClick={() => sendToReceiptFolder(receipt)}
                            disabled={sendingReceipt === receipt.accessCode}
                            className="bg-[#000050] hover:bg-blue-800"
                          >
                            {sendingReceipt === receipt.accessCode ? (
                              <>
                                <BoatLoading size="sm" />
                              </>
                            ) : (
                              <>
                                <Send className="h-3 w-3 mr-1" />
                                Send to Folder
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
