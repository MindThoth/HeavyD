"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Plus, Save, Users, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { clientsApi, timesheetApi, employeeApi, Client, TimeEntry, Employee } from "@/lib/api"
import { useCache } from "@/app/providers/cache-provider"

export default function TimesheetPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [loadingClients, setLoadingClients] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [creatingTimesheet, setCreatingTimesheet] = useState(false)
  const [currentEntry, setCurrentEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    task: "",
    notes: ""
  })
  const { toast } = useToast()
  const cache = useCache()

  useEffect(() => {
    loadClients()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientTimeEntries()
    } else {
      setEntries([])
    }
  }, [selectedClient])

  const loadClients = async () => {
    try {
      // Check cache first
      const cachedClients = cache.get<Client[]>('clients_list')
      if (cachedClients) {
        setClients(cachedClients)
        setLoadingClients(false)
        return
      }

      setLoadingClients(true)
      const response = await clientsApi.getAllClients()
      if (response.success && response.clients) {
        setClients(response.clients)
        cache.set('clients_list', response.clients)
      }
    } catch (error: any) {
      console.error("Error loading clients:", error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setLoadingClients(false)
    }
  }

  const loadEmployees = async () => {
    try {
      // Check cache first
      const cachedEmployees = cache.get<Employee[]>('employees_list')
      if (cachedEmployees) {
        setEmployees(cachedEmployees)
        setLoadingEmployees(false)
        // Auto-select Nicholas if available
        const nicholas = cachedEmployees.find(e => e.name === "Nicholas Lachance")
        if (nicholas) {
          setSelectedEmployee(nicholas.name)
        }
        return
      }

      setLoadingEmployees(true)
      const response = await employeeApi.getAllEmployees()
      if (response.success && response.employees) {
        setEmployees(response.employees)
        cache.set('employees_list', response.employees)
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

  const loadClientTimeEntries = async () => {
    if (!selectedClient) return

    try {
      setLoadingEntries(true)
      const response = await timesheetApi.getTimeEntries(selectedClient)
      if (response.success) {
        setEntries(response.entries || [])
      }
    } catch (error: any) {
      console.error("Error loading time entries:", error)
      // Don't show error toast for no timesheet - we'll handle this with create button
    } finally {
      setLoadingEntries(false)
    }
  }

  const getSelectedClient = () => {
    return clients.find(c => c.accessCode === selectedClient)
  }

  const getSelectedClientName = () => {
    const client = getSelectedClient()
    return client ? `${client.name} (${client.company || 'No Company'})` : "No client selected"
  }

  const hasTimesheet = () => {
    const client = getSelectedClient()
    return client && client.timesheetLink
  }

  const createTimesheetForClient = async () => {
    const client = getSelectedClient()
    if (!client) return

    try {
      setCreatingTimesheet(true)
      const response = await timesheetApi.createTimesheet(selectedClient, client.name)

      if (response.success) {
        toast({
          title: "Success",
          description: "Timesheet created successfully"
        })

        // Reload clients to get updated timesheet link
        await loadClients()

        // Force reload by clearing and re-selecting the client
        const currentCode = selectedClient
        setSelectedClient("")
        setTimeout(() => {
          setSelectedClient(currentCode)
        }, 100)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create timesheet",
        variant: "destructive"
      })
    } finally {
      setCreatingTimesheet(false)
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

  const addEntry = async () => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client first",
        variant: "destructive"
      })
      return
    }

    if (!hasTimesheet()) {
      toast({
        title: "Error",
        description: "Please create a timesheet for this client first",
        variant: "destructive"
      })
      return
    }

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
      setLoadingEntries(true)

      // Add entry to client's timesheet (and employee's timesheet if employee is selected)
      await timesheetApi.addTimeEntry(selectedClient, {
        date: currentEntry.date,
        startTime: currentEntry.startTime,
        endTime: currentEntry.endTime,
        task: currentEntry.task,
        notes: currentEntry.notes,
        duration,
        employeeName: selectedEmployee || undefined
      })

      // Reload entries to show the new one
      await loadClientTimeEntries()

      // Clear form
      setCurrentEntry({
        date: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        task: "",
        notes: ""
      })

      toast({
        title: "Success",
        description: "Time entry added successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add time entry",
        variant: "destructive"
      })
    } finally {
      setLoadingEntries(false)
    }
  }

  const getTotalHours = () => {
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0)
    return (totalMinutes / 60).toFixed(2)
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
    if (!timeStr) return '-'

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
      const parts = timeStr.split(':')
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, '0')
        const minutes = parts[1].padStart(2, '0')
        return `${hours}:${minutes}`
      }
    }

    return timeStr
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Timesheet Tracker</h1>
        <p className="text-gray-600 mt-2">Track time spent on client projects</p>
      </div>

      {/* Client Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Select Client
          </CardTitle>
          <CardDescription>Choose which client you're tracking time for</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingClients ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000050]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.accessCode} value={client.accessCode}>
                      {client.name} {client.company ? `- ${client.company}` : ''} ({client.accessCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      Currently tracking time for: <span className="font-medium">{getSelectedClientName()}</span>
                    </p>
                  </div>

                  {!hasTimesheet() && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                      <p className="text-sm text-yellow-900">
                        This client doesn't have a timesheet yet. Create one to start tracking time.
                      </p>
                      <Button
                        onClick={createTimesheetForClient}
                        disabled={creatingTimesheet}
                        className="w-full bg-[#000050] hover:bg-blue-800"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {creatingTimesheet ? "Creating..." : "Create Timesheet"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Select Employee
          </CardTitle>
          <CardDescription>Choose who is doing the work (your time will be tracked)</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000050]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.name} value={employee.name}>
                      {employee.name}
                    </SelectItem>
                  ))}
                  {/* Allow manual entry if no employees exist yet */}
                  {employees.length === 0 && (
                    <SelectItem value="Nicholas Lachance">
                      Nicholas Lachance
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {selectedEmployee && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    Tracking time for: <span className="font-medium">{selectedEmployee}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Entry Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add Time Entry</CardTitle>
            <CardDescription>
              {!selectedClient
                ? "Select a client to start tracking time"
                : !hasTimesheet()
                ? "Create a timesheet first"
                : "Record your work hours"}
            </CardDescription>
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
                  disabled={!selectedClient || !hasTimesheet()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={currentEntry.startTime}
                  onChange={(e) => setCurrentEntry({...currentEntry, startTime: e.target.value})}
                  disabled={!selectedClient || !hasTimesheet()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={currentEntry.endTime}
                  onChange={(e) => setCurrentEntry({...currentEntry, endTime: e.target.value})}
                  disabled={!selectedClient || !hasTimesheet()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Input
                id="task"
                placeholder="e.g., Design work, Installation, Consultation"
                value={currentEntry.task}
                onChange={(e) => setCurrentEntry({...currentEntry, task: e.target.value})}
                disabled={!selectedClient || !hasTimesheet()}
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
                disabled={!selectedClient || !hasTimesheet()}
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

            <Button
              onClick={addEntry}
              disabled={!selectedClient || !hasTimesheet() || loadingEntries}
              className="w-full bg-[#000050] hover:bg-blue-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loadingEntries ? "Adding..." : "Add Entry"}
            </Button>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {selectedClient ? getSelectedClientName() : "No client selected"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEntries ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000050]"></div>
              </div>
            ) : (
              <>
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{getTotalHours()}</p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>

                <div className="pt-4 border-t">
                  <Badge variant="outline" className="w-full justify-center">
                    {entries.length} time {entries.length === 1 ? "entry" : "entries"}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      {entries.length > 0 && (
        <Card>
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
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDateTime(entry.date)}</td>
                      <td className="px-4 py-3 text-sm">
                        {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatDuration(entry.duration)}
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
  )
}
