"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, FolderOpen, FileText, Clock, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { clientsApi, Client } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { BoatLoading } from "@/components/ui/boat-loading"
import { useCache } from "@/app/providers/cache-provider"

const statusColors: Record<string, string> = {
  "New": "bg-teal-100 text-teal-800",
  "Estimate Ready": "bg-teal-100 text-teal-800",
  "Estimate Approved": "bg-teal-100 text-teal-800",
  "Quote Sent": "bg-green-100 text-green-800",
  "Quote Accepted": "bg-green-100 text-green-800",
  "Not Started": "bg-purple-100 text-purple-800",
  "In Progress": "bg-purple-200 text-purple-800",
  "Designed": "bg-purple-200 text-purple-800",
  "Printed": "bg-orange-100 text-orange-800",
  "Completed": "bg-orange-100 text-orange-800",
  "Receipt Sent": "bg-gray-200 text-gray-800",
  "Paid": "bg-gray-800 text-white",
}

// Status order for sorting
const statusOrder = [
  "New",
  "Estimate Ready",
  "Estimate Approved",
  "Quote Sent",
  "Quote Accepted",
  "Not Started",
  "In Progress",
  "Designed",
  "Printed",
  "Completed",
  "Receipt Sent",
  "Paid",
]

type SortField = 'name' | 'service' | 'status' | 'email' | 'price'
type SortDirection = 'asc' | 'desc' | null

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [showPaidClients, setShowPaidClients] = useState(false)
  const { toast } = useToast()
  const cache = useCache()

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterClients()
  }, [clients, searchQuery, statusFilter, serviceFilter, sortField, sortDirection, showPaidClients])

  const loadClients = async () => {
    try {
      // Check cache first
      const cachedClients = cache.get<Client[]>('clients_list')
      if (cachedClients) {
        setClients(cachedClients)
        setLoading(false)
        return
      }

      setLoading(true)
      const response = await clientsApi.getAllClients()
      const clientsData = response.clients || []
      setClients(clientsData)
      cache.set('clients_list', clientsData)
    } catch (error: any) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load clients. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterClients = () => {
    let filtered = [...clients]

    // Hide paid clients by default
    if (!showPaidClients) {
      filtered = filtered.filter((client) => client.status !== "Paid")
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.company.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          client.service?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    // Service filter
    if (serviceFilter !== "all") {
      filtered = filtered.filter((client) => client.service === serviceFilter)
    }

    // Sort by status order first (always applied)
    filtered.sort((a, b) => {
      const aStatusIndex = statusOrder.indexOf(a.status) !== -1 ? statusOrder.indexOf(a.status) : 999
      const bStatusIndex = statusOrder.indexOf(b.status) !== -1 ? statusOrder.indexOf(b.status) : 999
      return aStatusIndex - bStatusIndex
    })

    // Additional user-selected sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aValue = ''
        let bValue = ''

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'service':
            aValue = (a.service || '').toLowerCase()
            bValue = (b.service || '').toLowerCase()
            break
          case 'status':
            // Use status order for status sorting
            const aStatusIndex = statusOrder.indexOf(a.status) !== -1 ? statusOrder.indexOf(a.status) : 999
            const bStatusIndex = statusOrder.indexOf(b.status) !== -1 ? statusOrder.indexOf(b.status) : 999
            return sortDirection === 'asc' ? aStatusIndex - bStatusIndex : bStatusIndex - aStatusIndex
          case 'email':
            aValue = a.email.toLowerCase()
            bValue = b.email.toLowerCase()
            break
          case 'price':
            aValue = a.price || '0'
            bValue = b.price || '0'
            break
        }

        // Sort for non-status fields
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })
    }

    setFilteredClients(filtered)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getUniqueStatuses = () => {
    return [...new Set(clients.map((c) => c.status).filter(Boolean))].sort()
  }

  const getUniqueServices = () => {
    return [...new Set(clients.map((c) => c.service).filter(Boolean))].sort()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BoatLoading size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your client projects</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="bg-[#000050] hover:bg-blue-800 w-full sm:w-auto">
            Add New Client
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {getUniqueStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-full lg:w-40">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {getUniqueServices().map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={loadClients} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showPaid"
                checked={showPaidClients}
                onCheckedChange={(checked) => setShowPaidClients(checked as boolean)}
              />
              <label
                htmlFor="showPaid"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Show paid clients
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {clients.length === 0
                ? "No clients found. Set up your Google Apps Script endpoint to load client data."
                : "No clients match your filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-2 sm:px-4 py-3">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center hover:text-gray-700 transition-colors"
                      >
                        Client
                        {sortField === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('service')}
                        className="flex items-center hover:text-gray-700 transition-colors"
                      >
                        Service
                        {sortField === 'service' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center hover:text-gray-700 transition-colors"
                      >
                        Status
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center hover:text-gray-700 transition-colors"
                      >
                        Contact
                        {sortField === 'email' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 hidden md:table-cell">
                      <button
                        onClick={() => handleSort('price')}
                        className="flex items-center hover:text-gray-700 transition-colors"
                      >
                        Price
                        {sortField === 'price' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 sm:px-4 py-3 hidden xl:table-cell">Links</th>
                    <th className="px-2 sm:px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.accessCode} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-3">
                        <Link href={`/dashboard/client/${client.revisionCode || client.accessCode}`}>
                          <div className="cursor-pointer hover:text-blue-600">
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{client.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {(client.company || "").trim() || "-"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                        <div>
                          <p className="text-sm text-gray-900">{client.service || "-"}</p>
                          {(client.service || "").toLowerCase().replace(/\s+/g, "-") === "boat-lettering" && client.boatName && (
                            <p className="text-xs text-blue-600 font-medium mt-1">
                              {client.boatName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <Badge
                          className={
                            statusColors[client.status] || "bg-gray-100 text-gray-800"
                          }
                        >
                          {client.status}
                        </Badge>
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden lg:table-cell">
                        <div className="text-sm">
                          <p className="text-gray-900">{client.email}</p>
                          <p className="text-gray-500">{client.phone || "-"}</p>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-sm text-gray-900 hidden md:table-cell">
                        {client.price || "-"}
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden xl:table-cell">
                        <div className="flex space-x-2">
                          {client.driveLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(client.driveLink, "_blank")}
                              title="Client Drive Folder"
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          )}
                          {client.briefLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(client.briefLink, "_blank")}
                              title="Brief Document"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          {client.timesheetLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(client.timesheetLink, "_blank")}
                              title="Timesheet"
                            >
                              <Clock className="h-4 w-4" />
                              {client.timeAmount && (
                                <span className="ml-1">{client.timeAmount}</span>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <Link href={`/dashboard/client/${client.revisionCode || client.accessCode}`}>
                          <Button size="sm" className="bg-[#000050] hover:bg-blue-800">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
