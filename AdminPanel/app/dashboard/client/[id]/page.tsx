"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  Clock,
  ExternalLink,
  Plus,
  Mail,
  Phone,
  MapPin,
  User,
  Building2,
  DollarSign,
  AlertCircle,
  Edit,
  Save,
  X,
  Trash2,
  Globe,
  FileCheck,
  Receipt
} from "lucide-react"
import Link from "next/link"
import { clientsApi, timesheetApi, clientExtrasApi, employeeApi } from "@/lib/api"
import { Client, Employee } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { BoatLoading } from "@/components/ui/boat-loading"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TimeEntry {
  id?: string
  date: string
  startTime: string
  endTime: string
  task: string
  notes: string
  duration: number
  employeeName?: string
}

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

const statusOptions = [
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

export default function ClientPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientCode = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [timesheetExists, setTimesheetExists] = useState(false)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [boatName, setBoatName] = useState<string | null>(null)
  const [loadingBoatName, setLoadingBoatName] = useState(false)
  const [submittingEntry, setSubmittingEntry] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [notes, setNotes] = useState("")
  const [editingNotes, setEditingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [briefData, setBriefData] = useState<any>(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [editingInfo, setEditingInfo] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedEmail, setEditedEmail] = useState("")
  const [editedPhone, setEditedPhone] = useState("")
  const [editedCompany, setEditedCompany] = useState("")
  const [editedLanguage, setEditedLanguage] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [creatingQuote, setCreatingQuote] = useState(false)
  const [creatingReceipt, setCreatingReceipt] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [currentEntry, setCurrentEntry] = useState<TimeEntry>({
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    task: "",
    notes: "",
    duration: 0
  })

  useEffect(() => {
    loadClient()
    loadEmployees()
  }, [clientCode])

  const loadClient = async () => {
    try {
      setLoading(true)
      const response = await clientsApi.getClient(clientCode)
      setClient(response.client)

      // Check if timesheet exists (column W - timesheetLink)
      if (response.client.timesheetLink) {
        setTimesheetExists(true)
        loadTimeEntries()
      }

      // Load boat name if service is boat-lettering and brief exists
      if (response.client.service === 'boat-lettering' && response.client.briefLink) {
        loadBoatName(response.client.briefLink)
      }

      // Set notes
      setNotes(response.client.notes || '')

      // Initialize editable fields
      setEditedName(response.client.name || '')
      setEditedEmail(response.client.email || '')
      setEditedPhone(response.client.phone || '')
      setEditedCompany(response.client.company || '')
      setEditedLanguage(response.client.language || '')
    } catch (error: any) {
      console.error("Error loading client:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load client",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const response = await employeeApi.getAllEmployees()
      if (response.success && response.employees) {
        setEmployees(response.employees)
        // Auto-select Nicholas if available
        const nicholas = response.employees.find(e => e.name === "Nicholas Lachance")
        if (nicholas) {
          setSelectedEmployee(nicholas.name)
        }
      }
    } catch (error: any) {
      console.error("Error loading employees:", error)
      // Don't show error toast - employees might not exist yet
    } finally {
      setLoadingEmployees(false)
    }
  }

  const loadBoatName = async (briefLink: string) => {
    try {
      setLoadingBoatName(true)
      // Extract document ID from briefLink
      // Format: https://docs.google.com/open?id=DOCUMENT_ID
      let briefId = ''

      if (briefLink.includes('?id=')) {
        // Format: https://docs.google.com/open?id=DOCUMENT_ID
        briefId = briefLink.split('?id=')[1]?.split('&')[0]
      } else if (briefLink.includes('/d/')) {
        // Format: https://docs.google.com/document/d/DOCUMENT_ID/...
        briefId = briefLink.split('/d/')[1]?.split('/')[0]
      }

      if (briefId) {
        const response = await clientExtrasApi.getBoatName(briefId)
        if (response.success && response.boatName) {
          setBoatName(response.boatName)
        }

        // Also load the full brief content
        loadBriefContent(briefId)
      }
    } catch (error) {
      console.error("Error loading boat name:", error)
      // Don't show error toast, boat name is optional
    } finally {
      setLoadingBoatName(false)
    }
  }

  const loadBriefContent = async (briefId: string) => {
    try {
      setLoadingBrief(true)
      const response = await clientExtrasApi.getBriefContent(briefId)
      if (response.success && response.briefData) {
        setBriefData(response.briefData)
      }
    } catch (error) {
      console.error("Error loading brief content:", error)
    } finally {
      setLoadingBrief(false)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const response = await timesheetApi.getTimeEntries(clientCode)
      setTimeEntries(response.entries || [])
    } catch (error) {
      console.error("Error loading time entries:", error)
    }
  }

  const createTimesheet = async () => {
    if (!client) return
    
    try {
      const response = await timesheetApi.createTimesheet(clientCode, client.name)
      setTimesheetExists(true)
      setClient({ ...client, timesheetLink: response.timesheetUrl })
      toast({
        title: "Success",
        description: "Timesheet created successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create timesheet",
        variant: "destructive"
      })
    }
  }

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0
    const startDate = new Date(`2000-01-01T${start}:00`)
    const endDate = new Date(`2000-01-01T${end}:00`)
    if (endDate <= startDate) return 0
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
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

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return ''

    // If it's a full datetime string (ISO format), extract the time
    if (timeStr.includes('T') || timeStr.includes('Z')) {
      try {
        const date = new Date(timeStr)
        if (!isNaN(date.getTime())) {
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${hours}:${minutes}`
        }
      } catch (e) {
        // If parsing fails, continue to other checks
      }
    }

    // If time is already in HH:MM or H:MM format
    if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) return timeStr
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    return timeStr
  }

  const addTimeEntry = async () => {
    if (!currentEntry.startTime || !currentEntry.endTime || !currentEntry.task) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const duration = calculateDuration(currentEntry.startTime, currentEntry.endTime)
    if (duration <= 0) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmittingEntry(true)
      const newEntry = { ...currentEntry, duration, employeeName: selectedEmployee || undefined }
      await timesheetApi.addTimeEntry(clientCode, newEntry)

      setTimeEntries([...timeEntries, { ...newEntry, id: Date.now().toString() }])
      setCurrentEntry({
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        task: "",
        notes: "",
        duration: 0
      })

      toast({
        title: "Success",
        description: "Time entry added"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add time entry",
        variant: "destructive"
      })
    } finally {
      setSubmittingEntry(false)
    }
  }

  const getTotalHours = () => {
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    return (totalMinutes / 60).toFixed(2)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!client) return

    try {
      setUpdatingStatus(true)
      await clientsApi.updateClientStatus(client.accessCode, newStatus)

      // Update local state
      setClient({ ...client, status: newStatus })

      toast({
        title: "Success",
        description: "Status updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!client) return

    try {
      setSavingNotes(true)
      await clientsApi.updateClientNotes(client.accessCode, notes)

      // Update local state
      setClient({ ...client, notes })
      setEditingNotes(false)

      toast({
        title: "Success",
        description: "Notes updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notes",
        variant: "destructive"
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const handleCancelNotes = () => {
    setNotes(client?.notes || '')
    setEditingNotes(false)
  }

  const handleEditInfo = () => {
    setEditingInfo(true)
  }

  const handleSaveInfo = async () => {
    if (!client) return

    try {
      setSavingInfo(true)
      const response = await clientsApi.updateClient(client.accessCode, {
        name: editedName,
        email: editedEmail,
        phone: editedPhone,
        company: editedCompany,
        language: editedLanguage
      })

      if (response.success) {
        // Update local state
        setClient({
          ...client,
          name: editedName,
          email: editedEmail,
          phone: editedPhone,
          company: editedCompany,
          language: editedLanguage
        })
        setEditingInfo(false)

        toast({
          title: "Success",
          description: "Client information updated successfully"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update client information",
        variant: "destructive"
      })
    } finally {
      setSavingInfo(false)
    }
  }

  const handleCancelInfo = () => {
    setEditedName(client?.name || '')
    setEditedEmail(client?.email || '')
    setEditedPhone(client?.phone || '')
    setEditedCompany(client?.company || '')
    setEditedLanguage(client?.language || '')
    setEditingInfo(false)
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!client) return

    try {
      setDeleting(true)
      const response = await clientsApi.deleteClient(client.accessCode, client.driveLink)

      if (response.success) {
        toast({
          title: "Client Deleted",
          description: `${client.name} has been successfully deleted.`,
        })

        // Redirect to clients list
        setTimeout(() => {
          router.push('/dashboard/clients')
        }, 1500)
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete client",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleCreateQuote = async () => {
    if (!client) return

    try {
      setCreatingQuote(true)
      const response = await clientsApi.createQuote(client.accessCode)

      if (response.success && response.quoteLink) {
        // Update local state
        setClient({
          ...client,
          quoteLink: response.quoteLink
        })

        toast({
          title: "Quote Created",
          description: "Quote document has been generated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create quote",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error creating quote:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      })
    } finally {
      setCreatingQuote(false)
    }
  }

  const handleCreateReceipt = async () => {
    if (!client) return

    try {
      setCreatingReceipt(true)
      const response = await clientsApi.createReceipt(client.accessCode)

      if (response.success && response.receiptLink) {
        // Update local state
        setClient({
          ...client,
          receiptLink: response.receiptLink
        })

        toast({
          title: "Receipt Created",
          description: "Receipt document has been generated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create receipt",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error creating receipt:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create receipt",
        variant: "destructive",
      })
    } finally {
      setCreatingReceipt(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <BoatLoading size="md" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/clients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Button>
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Not Found</h3>
              <p className="text-gray-600">The client with code {clientCode} could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />
      
      {/* Header with Back Button */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dashboard/clients">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
            onClick={handleDeleteClick}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Client
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-gray-600 whitespace-nowrap">Status:</Label>
          <Select
            value={client.status}
            onValueChange={handleStatusChange}
            disabled={updatingStatus}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue>
                <Badge className={statusColors[client.status] || "bg-gray-100 text-gray-800"}>
                  {client.status}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
                    {status}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Header Card - Matching Screenshot */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{client.name}</CardTitle>
              {boatName && (
                <div className="text-lg font-semibold text-blue-600 mt-1 mb-2">
                  {boatName}
                </div>
              )}
              {loadingBoatName && (
                <div className="text-sm text-gray-500 mt-1 mb-2">
                  Loading boat name...
                </div>
              )}
              {client.company && (
                <div className="flex items-center text-gray-600 mt-1">
                  <Building2 className="h-4 w-4 mr-2" />
                  <span>{client.company}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Project Code</div>
              <div className="text-lg font-mono font-bold">{client.revisionCode || clientCode}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700 uppercase">Contact</h3>
                {!editingInfo ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditInfo}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveInfo}
                      disabled={savingInfo}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {savingInfo ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelInfo}
                      disabled={savingInfo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {editingInfo ? (
                  <>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Name"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                      <Input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        placeholder="Email"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                      <Input
                        type="tel"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        placeholder="Phone"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center text-sm">
                      <Building2 className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                      <Input
                        value={editedCompany}
                        onChange={(e) => setEditedCompany(e.target.value)}
                        placeholder="Company"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                      <Select
                        value={editedLanguage}
                        onValueChange={setEditedLanguage}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-900">{client.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                        {client.email}
                      </a>
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                        <a href={`tel:${client.phone}`} className="text-gray-900">
                          {client.phone}
                        </a>
                      </div>
                    )}
                    {client.company && (
                      <div className="flex items-center text-sm">
                        <Building2 className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-gray-900">{client.company}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="capitalize text-gray-900">{client.language}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 uppercase">Project</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Service</div>
                  <div className="font-medium">{client.service}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium">{formatDateTime(client.date)}</div>
                </div>
                {client.priority && (
                  <div>
                    <div className="text-xs text-gray-500">Priority</div>
                    <Badge variant="outline">{client.priority}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 uppercase">Financial</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500">Cost</div>
                  <div className="text-lg font-bold text-gray-900">{client.cost || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-lg font-bold text-green-600">{client.price || "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Time Tracked</div>
                  <div className="text-lg font-bold text-blue-600">{client.timeAmount || "0h"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-wrap gap-2">
              {client.driveLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(client.driveLink, "_blank")}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Drive Folder
                </Button>
              )}
              {client.briefLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(client.briefLink, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Brief
                </Button>
              )}
              {client.estimateLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(client.estimateLink, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Estimate
                </Button>
              )}
              {client.quoteLink ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(client.quoteLink, "_blank")}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Open Quote
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateQuote}
                  disabled={creatingQuote}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  {creatingQuote ? "Creating..." : "Create Quote"}
                </Button>
              )}
              {client.receiptLink ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(client.receiptLink, "_blank")}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Open Receipt
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateReceipt}
                  disabled={creatingReceipt}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {creatingReceipt ? "Creating..." : "Create Receipt"}
                </Button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700 uppercase">Notes</h3>
              {!editingNotes && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingNotes(true)}
                >
                  Edit
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this client..."
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="bg-[#000050] hover:bg-blue-800"
                  >
                    {savingNotes ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelNotes}
                    disabled={savingNotes}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {notes || "No notes yet. Click Edit to add notes."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Timesheet and Other Details */}
      <Tabs defaultValue="timesheet" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timesheet">
            <Clock className="h-4 w-4 mr-2" />
            Timesheet
          </TabsTrigger>
          <TabsTrigger value="details">Project Details</TabsTrigger>
        </TabsList>

        {/* Timesheet Tab */}
        <TabsContent value="timesheet" className="space-y-6">
          {!timesheetExists ? (
            <Card>
              <CardContent className="p-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Timesheet Created</h3>
                  <p className="text-gray-600 mb-6">
                    Create a timesheet for {client.name} to start tracking time.
                  </p>
                  <Button onClick={createTimesheet} className="bg-[#000050] hover:bg-blue-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Timesheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Time Entry Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Add Time Entry</CardTitle>
                  <CardDescription>Record work hours for {client.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={currentEntry.date}
                        onChange={(e) => setCurrentEntry({...currentEntry, date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={currentEntry.startTime}
                        onChange={(e) => setCurrentEntry({...currentEntry, startTime: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={currentEntry.endTime}
                        onChange={(e) => setCurrentEntry({...currentEntry, endTime: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee">Employee</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.name} value={employee.name}>
                            {employee.name}
                          </SelectItem>
                        ))}
                        {employees.length === 0 && (
                          <SelectItem value="Nicholas Lachance">
                            Nicholas Lachance
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task">Task</Label>
                    <Input
                      id="task"
                      placeholder="e.g., Design work, Installation, Consultation"
                      value={currentEntry.task}
                      onChange={(e) => setCurrentEntry({...currentEntry, task: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional details about this work session..."
                      value={currentEntry.notes}
                      onChange={(e) => setCurrentEntry({...currentEntry, notes: e.target.value})}
                      rows={3}
                    />
                  </div>

                  {currentEntry.startTime && currentEntry.endTime && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        Duration: <span className="font-medium">
                          {formatDuration(calculateDuration(currentEntry.startTime, currentEntry.endTime))}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={addTimeEntry}
                      disabled={submittingEntry}
                      className="flex-1 bg-[#000050] hover:bg-blue-800"
                    >
                      {submittingEntry ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Entry
                        </>
                      )}
                    </Button>

                    {client.timesheetLink && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(client.timesheetLink, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Sheets
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>Total time tracked</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{getTotalHours()}</p>
                    <p className="text-sm text-gray-600">Total Hours</p>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge variant="outline" className="w-full justify-center">
                      {timeEntries.length} time entries
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Entries List */}
              {timeEntries.length > 0 && (
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Time Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Duration</th>
                            <th className="px-4 py-3">Employee</th>
                            <th className="px-4 py-3">Task</th>
                            <th className="px-4 py-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {timeEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{formatDateTime(entry.date)}</td>
                              <td className="px-4 py-3 text-sm">
                                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {formatDuration(entry.duration)}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                  {(entry as any).employeeName || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">{entry.task}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{entry.notes || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Project Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {loadingBrief ? (
            <div className="flex items-center justify-center h-64">
              <BoatLoading size="md" />
            </div>
          ) : briefData && client.service === 'boat-lettering' ? (
            <div className="space-y-6">
              {/* Boat Name Header */}
              {(briefData.BoatName || boatName) && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <h2 className="text-3xl font-bold text-blue-900 text-center">
                      {briefData.BoatName || boatName}
                    </h2>
                    {(briefData.BoatType || briefData.Type || briefData.Model) && (
                      <p className="text-center text-blue-700 mt-2">
                        {briefData.BoatType || briefData.Type || briefData.Model}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Boat Lettering Checklist */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lettering Requirements</CardTitle>
                    <CardDescription>Checklist of what's needed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Front Names */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {briefData.NamesFront?.toLowerCase().includes('yes') ? (
                          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : briefData.NamesFront?.toLowerCase().includes('no') ? (
                          <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">✗</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Front Names</p>
                        {briefData.NamesFront && (
                          <p className="text-sm text-gray-600 mt-1">{briefData.NamesFront}</p>
                        )}
                      </div>
                    </div>

                    {/* Name on Stern */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {briefData.NameStern?.toLowerCase().includes('yes') ? (
                          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : briefData.NameStern?.toLowerCase().includes('no') ? (
                          <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">✗</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Name on Stern</p>
                        {briefData.NameStern && (
                          <p className="text-sm text-gray-600 mt-1">{briefData.NameStern}</p>
                        )}
                        {briefData.BoatLocation && briefData.NameStern?.toLowerCase().includes('yes') && (
                          <p className="text-sm text-blue-600 mt-1">
                            <span className="font-medium">Location:</span> {briefData.BoatLocation}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Need Numbers */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {briefData.NeedNumbers?.toLowerCase().includes('yes') ? (
                          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : briefData.NeedNumbers?.toLowerCase().includes('no') ? (
                          <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">✗</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Registration Numbers</p>
                        {briefData.NeedNumbers && (
                          <p className="text-sm text-gray-600 mt-1">{briefData.NeedNumbers}</p>
                        )}
                        {briefData.WhatNumbers && briefData.NeedNumbers?.toLowerCase().includes('yes') && (
                          <p className="text-sm text-blue-600 mt-1">
                            <span className="font-medium">Numbers:</span> {briefData.WhatNumbers}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Name on Cabin Cap */}
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {briefData.NameCabinCap?.toLowerCase().includes('yes') ? (
                          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : briefData.NameCabinCap?.toLowerCase().includes('no') ? (
                          <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">✗</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Name on Cabin Cap</p>
                        {briefData.NameCabinCap && (
                          <p className="text-sm text-gray-600 mt-1">{briefData.NameCabinCap}</p>
                        )}
                        {briefData.NameCabinCap?.toLowerCase().includes('yes') && (
                          <div className="mt-2 space-y-1">
                            {briefData.FrontCapText && (
                              <p className="text-sm text-blue-600">
                                <span className="font-medium">Front:</span> {briefData.FrontCapText}
                              </p>
                            )}
                            {briefData.BackCapText && (
                              <p className="text-sm text-blue-600">
                                <span className="font-medium">Back:</span> {briefData.BackCapText}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bow Design */}
                    {briefData.BowDesign && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {briefData.BowDesign?.toLowerCase().includes('yes') ? (
                            <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          ) : briefData.BowDesign?.toLowerCase().includes('no') ? (
                            <div className="w-5 h-5 rounded bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-xs">✗</span>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Bow Design</p>
                          <p className="text-sm text-gray-600 mt-1">{briefData.BowDesign}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Design Info & Additional Details */}
                <div className="space-y-6">
                  {/* Design Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Design Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {briefData.ExistingDesign && (
                        <div>
                          <Label className="text-gray-600">Has Existing Design?</Label>
                          <p className="font-medium mt-1">
                            {briefData.ExistingDesign?.toLowerCase().includes('yes') ? (
                              <Badge className="bg-green-100 text-green-800">Yes</Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-800">No - Need to create</Badge>
                            )}
                          </p>
                        </div>
                      )}
                      {briefData.LayoutIdeas && briefData.ExistingDesign?.toLowerCase().includes('no') && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <Label className="text-gray-700 font-medium">Layout Ideas:</Label>
                          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{briefData.LayoutIdeas}</p>
                        </div>
                      )}
                      {briefData.HullColor && (
                        <div>
                          <Label className="text-gray-600">Hull Color</Label>
                          <p className="font-medium mt-1">{briefData.HullColor}</p>
                        </div>
                      )}
                      {briefData.CabinColor && (
                        <div>
                          <Label className="text-gray-600">Cabin Color</Label>
                          <p className="font-medium mt-1">{briefData.CabinColor}</p>
                        </div>
                      )}
                      {!briefData.HullColor && !briefData.CabinColor && (briefData.Color || briefData.Colors || briefData.VinylColor) && (
                        <div>
                          <Label className="text-gray-600">Colors</Label>
                          <p className="font-medium mt-1">{briefData.Color || briefData.Colors || briefData.VinylColor}</p>
                        </div>
                      )}
                      {(briefData.Material || briefData.VinylType) && (
                        <div>
                          <Label className="text-gray-600">Material</Label>
                          <p className="font-medium mt-1">{briefData.Material || briefData.VinylType}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Project Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(briefData.Location || briefData.Marina) && (
                        <div>
                          <Label className="text-gray-600">Marina/Location</Label>
                          <p className="font-medium mt-1">{briefData.Location || briefData.Marina}</p>
                        </div>
                      )}
                      {(briefData.Deadline || briefData.DueDate || briefData.CompletionDate) && (
                        <div>
                          <Label className="text-gray-600">Deadline</Label>
                          <p className="font-medium mt-1">{briefData.Deadline || briefData.DueDate || briefData.CompletionDate}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-600">Status</Label>
                        <p className="font-medium mt-1">
                          <Badge className={statusColors[client.status] || "bg-gray-100 text-gray-800"}>
                            {client.status}
                          </Badge>
                        </p>
                      </div>
                      {client.briefLink && (
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => window.open(client.briefLink, "_blank")}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Original Brief
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Financial */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Financial</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(briefData.Budget || briefData.Price || briefData.Cost || briefData.EstimatedCost) && (
                        <div>
                          <Label className="text-gray-600">Budget (from brief)</Label>
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            {briefData.Budget || briefData.Price || briefData.Cost || briefData.EstimatedCost}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-gray-600">Estimated Cost</Label>
                        <p className="text-lg font-bold text-gray-900 mt-1">{client.cost || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Client Price</Label>
                        <p className="text-lg font-bold text-green-600 mt-1">{client.price || "-"}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Special Instructions & Additional Information - Full Width */}
              {(briefData.SpecialInstructions || briefData.Instructions || briefData.AdditionalNotes || briefData.Description || briefData.ProjectDescription || briefData.AdditionalInformation) && (
                <div className="grid grid-cols-1 gap-6">
                  {(briefData.SpecialInstructions || briefData.Instructions || briefData.AdditionalNotes || briefData.Description || briefData.ProjectDescription) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Special Instructions & Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {briefData.SpecialInstructions || briefData.Instructions || briefData.AdditionalNotes || briefData.Description || briefData.ProjectDescription}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {briefData.AdditionalInformation && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {briefData.AdditionalInformation}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : briefData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Information from Brief */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>Details from brief</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(briefData.BoatName || boatName) && (
                    <div>
                      <Label className="text-gray-600">Boat Name</Label>
                      <p className="font-medium mt-1 text-blue-600">{briefData.BoatName || boatName}</p>
                    </div>
                  )}
                  {(briefData.BoatType || briefData.Type || briefData.Model) && (
                    <div>
                      <Label className="text-gray-600">Boat Type</Label>
                      <p className="font-medium mt-1">{briefData.BoatType || briefData.Type || briefData.Model}</p>
                    </div>
                  )}
                  {(briefData.Location || briefData.Marina) && (
                    <div>
                      <Label className="text-gray-600">Location</Label>
                      <p className="font-medium mt-1">{briefData.Location || briefData.Marina}</p>
                    </div>
                  )}
                  {(briefData.Color || briefData.Colors || briefData.VinylColor) && (
                    <div>
                      <Label className="text-gray-600">Colors</Label>
                      <p className="font-medium mt-1">{briefData.Color || briefData.Colors || briefData.VinylColor}</p>
                    </div>
                  )}
                  {(briefData.Dimensions || briefData.Size) && (
                    <div>
                      <Label className="text-gray-600">Dimensions</Label>
                      <p className="font-medium mt-1">{briefData.Dimensions || briefData.Size}</p>
                    </div>
                  )}
                  {(briefData.Material || briefData.VinylType) && (
                    <div>
                      <Label className="text-gray-600">Material</Label>
                      <p className="font-medium mt-1">{briefData.Material || briefData.VinylType}</p>
                    </div>
                  )}
                  {(briefData.Deadline || briefData.DueDate || briefData.CompletionDate) && (
                    <div>
                      <Label className="text-gray-600">Deadline</Label>
                      <p className="font-medium mt-1">{briefData.Deadline || briefData.DueDate || briefData.CompletionDate}</p>
                    </div>
                  )}
                  <div className="pt-3 border-t">
                    <Label className="text-gray-600">Status</Label>
                    <p className="font-medium mt-1">
                      <Badge className={statusColors[client.status] || "bg-gray-100 text-gray-800"}>
                        {client.status}
                      </Badge>
                    </p>
                  </div>
                  {client.briefLink && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => window.open(client.briefLink, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Original Brief
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Special Instructions & Financial */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(briefData.Budget || briefData.Price || briefData.Cost || briefData.EstimatedCost) && (
                      <div>
                        <Label className="text-gray-600">Budget (from brief)</Label>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {briefData.Budget || briefData.Price || briefData.Cost || briefData.EstimatedCost}
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-600">Estimated Cost</Label>
                      <p className="text-xl font-bold text-gray-900 mt-1">{client.cost || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Client Price</Label>
                      <p className="text-xl font-bold text-green-600 mt-1">{client.price || "-"}</p>
                    </div>
                    {client.estimateLink && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => window.open(client.estimateLink, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Estimation
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {(briefData.SpecialInstructions || briefData.Instructions || briefData.AdditionalNotes || briefData.Description || briefData.ProjectDescription) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Special Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {briefData.SpecialInstructions || briefData.Instructions || briefData.AdditionalNotes || briefData.Description || briefData.ProjectDescription}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <p className="font-medium mt-1">
                      <Badge className={statusColors[client.status] || "bg-gray-100 text-gray-800"}>
                        {client.status}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Service Type</Label>
                    <p className="font-medium mt-1">{client.service}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Project Date</Label>
                    <p className="font-medium mt-1">{formatDateTime(client.date)}</p>
                  </div>
                  {client.priority && (
                    <div>
                      <Label className="text-gray-600">Priority</Label>
                      <p className="font-medium mt-1">{client.priority}</p>
                    </div>
                  )}
                  {client.briefLink && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => window.open(client.briefLink, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Brief
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-gray-600">Estimated Cost</Label>
                    <p className="text-xl font-bold text-gray-900 mt-1">{client.cost || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Client Price</Label>
                    <p className="text-xl font-bold text-green-600 mt-1">{client.price || "-"}</p>
                  </div>
                  {client.estimateLink && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => window.open(client.estimateLink, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Estimation
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{client.name}</strong> and all associated files from Google Drive.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
