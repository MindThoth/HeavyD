"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Briefcase, Clock, DollarSign, ExternalLink, CheckCircle2, XCircle, Plus, User, Mail, Phone, Calendar, Edit2, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { employeeApi, Employee, EmployeeEntry, EmployeeInfo } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TableSkeleton } from "@/components/ui/skeleton"
import { useCache } from "@/app/providers/cache-provider"
import { BoatLoading } from "@/components/ui/boat-loading"

type SortField = 'date' | 'time' | 'duration' | 'clientName'
type SortDirection = 'asc' | 'desc'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [entries, setEntries] = useState<EmployeeEntry[]>([])
  const [sortedEntries, setSortedEntries] = useState<EmployeeEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [updatingEntry, setUpdatingEntry] = useState<number | null>(null)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState("")
  const [newEmployeeEmail, setNewEmployeeEmail] = useState("")
  const [newEmployeePhone, setNewEmployeePhone] = useState("")
  const [newEmployeeHireDate, setNewEmployeeHireDate] = useState(new Date().toISOString().split('T')[0])
  const [newEmployeeHourlyRate, setNewEmployeeHourlyRate] = useState("")
  const [newEmployeeRole, setNewEmployeeRole] = useState("")
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)
  const [loadingEmployeeInfo, setLoadingEmployeeInfo] = useState(false)
  const [editingEmployeeInfo, setEditingEmployeeInfo] = useState(false)
  const [editedInfo, setEditedInfo] = useState<Partial<EmployeeInfo>>({})
  const [deletingEntry, setDeletingEntry] = useState<number | null>(null)
  const [entryToDelete, setEntryToDelete] = useState<EmployeeEntry | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const { toast } = useToast()
  const cache = useCache()

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeEntries()
      loadEmployeeInfo()
    } else {
      setEntries([])
      setEmployeeInfo(null)
    }
  }, [selectedEmployee])

  useEffect(() => {
    sortEntries()
  }, [entries, sortField, sortDirection])

  const loadEmployees = async () => {
    try {
      // Check cache first
      const cachedEmployees = cache.get<Employee[]>('employees_list')
      if (cachedEmployees) {
        setEmployees(cachedEmployees)
        setLoadingEmployees(false)
        if (cachedEmployees.length > 0 && !selectedEmployee) {
          setSelectedEmployee(cachedEmployees[0].name)
        }
        return
      }

      setLoadingEmployees(true)
      const response = await employeeApi.getAllEmployees()
      if (response.success && response.employees) {
        setEmployees(response.employees)
        cache.set('employees_list', response.employees)
        // Auto-select first employee
        if (response.employees.length > 0) {
          setSelectedEmployee(response.employees[0].name)
        }
      }
    } catch (error: any) {
      console.error("Error loading employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees",
        variant: "destructive"
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  const loadEmployeeEntries = async () => {
    if (!selectedEmployee) return

    try {
      // Check cache first
      const cacheKey = `employee_entries_${selectedEmployee}`
      const cachedEntries = cache.get<EmployeeEntry[]>(cacheKey)
      if (cachedEntries) {
        setEntries(cachedEntries)
        setLoadingEntries(false)
        return
      }

      setLoadingEntries(true)
      const response = await employeeApi.getEmployeeEntries(selectedEmployee)
      if (response.success) {
        setEntries(response.entries || [])
        cache.set(cacheKey, response.entries || [])
      }
    } catch (error: any) {
      console.error("Error loading employee entries:", error)
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive"
      })
    } finally {
      setLoadingEntries(false)
    }
  }

  const sortEntries = () => {
    const sorted = [...entries].sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortField) {
        case 'date':
          aVal = new Date(a.date || '').getTime()
          bVal = new Date(b.date || '').getTime()
          break
        case 'time':
          aVal = a.startTime
          bVal = b.startTime
          break
        case 'duration':
          aVal = a.duration
          bVal = b.duration
          break
        case 'clientName':
          aVal = (a.clientName || '').toLowerCase()
          bVal = (b.clientName || '').toLowerCase()
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })

    setSortedEntries(sorted)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'date' ? 'desc' : 'asc')
    }
  }

  const loadEmployeeInfo = async () => {
    if (!selectedEmployee) return

    try {
      // Check cache first
      const cacheKey = `employee_info_${selectedEmployee}`
      const cachedInfo = cache.get<EmployeeInfo>(cacheKey)
      if (cachedInfo) {
        setEmployeeInfo(cachedInfo)
        setLoadingEmployeeInfo(false)
        return
      }

      setLoadingEmployeeInfo(true)
      const response = await employeeApi.getEmployeeInfo(selectedEmployee)
      if (response.success && response.employeeInfo) {
        setEmployeeInfo(response.employeeInfo)
        cache.set(cacheKey, response.employeeInfo)
      }
    } catch (error: any) {
      console.error("Error loading employee info:", error)
      // Don't show error toast - info might not exist for older employees
    } finally {
      setLoadingEmployeeInfo(false)
    }
  }

  const togglePaidStatus = async (entry: EmployeeEntry, currentPaid: boolean) => {
    try {
      setUpdatingEntry(entry.rowIndex)
      const newPaidStatus = !currentPaid

      await employeeApi.markEmployeeEntryPaid(
        selectedEmployee,
        entry.rowIndex,
        newPaidStatus
      )

      // Update local state
      setEntries(entries.map(e =>
        e.rowIndex === entry.rowIndex
          ? { ...e, paid: newPaidStatus ? 'Yes' : 'No' }
          : e
      ))

      toast({
        title: "Success",
        description: `Entry marked as ${newPaidStatus ? 'paid' : 'unpaid'}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      })
    } finally {
      setUpdatingEntry(null)
    }
  }

  const createEmployee = async () => {
    if (!newEmployeeName.trim()) {
      toast({
        title: "Error",
        description: "Employee name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setCreatingEmployee(true)
      const response = await employeeApi.createEmployee({
        name: newEmployeeName,
        email: newEmployeeEmail,
        phone: newEmployeePhone,
        hireDate: newEmployeeHireDate,
        hourlyRate: newEmployeeHourlyRate,
        role: newEmployeeRole
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `Employee ${newEmployeeName} created successfully`
        })

        // Reset form
        setNewEmployeeName("")
        setNewEmployeeEmail("")
        setNewEmployeePhone("")
        setNewEmployeeHireDate(new Date().toISOString().split('T')[0])
        setNewEmployeeHourlyRate("")
        setNewEmployeeRole("")
        setAddEmployeeOpen(false)

        // Reload employees
        loadEmployees()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive"
      })
    } finally {
      setCreatingEmployee(false)
    }
  }

  const startEditingEmployeeInfo = () => {
    if (employeeInfo) {
      setEditedInfo({
        email: employeeInfo.email,
        phone: employeeInfo.phone,
        hireDate: employeeInfo.hireDate,
        hourlyRate: employeeInfo.hourlyRate,
        role: employeeInfo.role
      })
      setEditingEmployeeInfo(true)
    }
  }

  const saveEmployeeInfo = async () => {
    if (!selectedEmployee) return

    try {
      const response = await employeeApi.updateEmployeeInfo(selectedEmployee, editedInfo)

      if (response.success) {
        toast({
          title: "Success",
          description: "Employee information updated successfully"
        })
        setEditingEmployeeInfo(false)
        loadEmployeeInfo()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update employee info",
        variant: "destructive"
      })
    }
  }

  const deleteTimeEntry = async () => {
    if (!entryToDelete || !selectedEmployee) return

    try {
      setDeletingEntry(entryToDelete.rowIndex)
      const response = await employeeApi.deleteEmployeeTimeEntry(
        selectedEmployee,
        entryToDelete.rowIndex,
        entryToDelete.clientCode
      )

      if (response.success) {
        toast({
          title: "Success",
          description: "Time entry deleted successfully"
        })
        setEntryToDelete(null)
        loadEmployeeEntries()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time entry",
        variant: "destructive"
      })
    } finally {
      setDeletingEntry(null)
    }
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getTotalHours = (filterPaid?: boolean) => {
    let filteredEntries = entries
    if (filterPaid !== undefined) {
      filteredEntries = entries.filter(e => (e.paid === 'Yes') === filterPaid)
    }
    const totalMinutes = filteredEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    return (totalMinutes / 60).toFixed(2)
  }

  const getUnpaidTotal = () => {
    return entries.filter(e => e.paid === 'No').length
  }

  const getPaidTotal = () => {
    return entries.filter(e => e.paid === 'Yes').length
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Time Tracking</h1>
          <p className="text-gray-600 mt-2">View and manage employee hours and payment status</p>
        </div>

        <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#000050] hover:bg-blue-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Create a new employee profile and timesheet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Full Name *</Label>
                <Input
                  id="employeeName"
                  placeholder="Nicholas Lachance"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeEmail">Email</Label>
                <Input
                  id="employeeEmail"
                  type="email"
                  placeholder="employee@example.com"
                  value={newEmployeeEmail}
                  onChange={(e) => setNewEmployeeEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeePhone">Phone</Label>
                <Input
                  id="employeePhone"
                  type="tel"
                  placeholder="(123) 456-7890"
                  value={newEmployeePhone}
                  onChange={(e) => setNewEmployeePhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={newEmployeeHireDate}
                  onChange={(e) => setNewEmployeeHireDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="text"
                  placeholder="$25.00"
                  value={newEmployeeHourlyRate}
                  onChange={(e) => setNewEmployeeHourlyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  type="text"
                  placeholder="Designer, Installer, etc."
                  value={newEmployeeRole}
                  onChange={(e) => setNewEmployeeRole(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddEmployeeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#000050] hover:bg-blue-800"
                onClick={createEmployee}
                disabled={creatingEmployee}
              >
                {creatingEmployee ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee Selector Tabs */}
      {loadingEmployees ? (
        <div className="flex items-center justify-center py-12">
          <BoatLoading size="md" />
        </div>
      ) : employees.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
              <p className="text-gray-600">
                Employee timesheets will be created automatically when time entries are submitted.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={selectedEmployee} onValueChange={setSelectedEmployee} className="w-full">
            <TabsList className="w-full justify-start">
              {employees.map((employee) => (
                <TabsTrigger key={employee.name} value={employee.name} className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {employee.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {employees.map((employee) => (
              <TabsContent key={employee.name} value={employee.name} className="space-y-6 mt-6">
                {/* Employee Info */}
                {employeeInfo && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Employee Information</CardTitle>
                        <CardDescription>Contact and employment details</CardDescription>
                      </div>
                      {!editingEmployeeInfo && (
                        <Button variant="outline" size="sm" onClick={startEditingEmployeeInfo}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {editingEmployeeInfo ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={editedInfo.email || ''}
                                onChange={(e) => setEditedInfo({...editedInfo, email: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Phone</Label>
                              <Input
                                id="edit-phone"
                                type="tel"
                                value={editedInfo.phone || ''}
                                onChange={(e) => setEditedInfo({...editedInfo, phone: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-hireDate">Hire Date</Label>
                              <Input
                                id="edit-hireDate"
                                type="date"
                                value={editedInfo.hireDate || ''}
                                onChange={(e) => setEditedInfo({...editedInfo, hireDate: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-hourlyRate">Hourly Rate</Label>
                              <Input
                                id="edit-hourlyRate"
                                type="text"
                                placeholder="$25.00"
                                value={editedInfo.hourlyRate || ''}
                                onChange={(e) => setEditedInfo({...editedInfo, hourlyRate: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-role">Role</Label>
                              <Input
                                id="edit-role"
                                type="text"
                                placeholder="Designer, Installer, etc."
                                value={editedInfo.role || ''}
                                onChange={(e) => setEditedInfo({...editedInfo, role: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveEmployeeInfo} className="bg-[#000050] hover:bg-blue-800">
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setEditingEmployeeInfo(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium">{employeeInfo.name}</p>
                            </div>
                          </div>
                          {employeeInfo.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{employeeInfo.email}</p>
                              </div>
                            </div>
                          )}
                          {employeeInfo.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{employeeInfo.phone}</p>
                              </div>
                            </div>
                          )}
                          {employeeInfo.hireDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Hire Date</p>
                                <p className="font-medium">{formatDateTime(employeeInfo.hireDate)}</p>
                              </div>
                            </div>
                          )}
                          {employeeInfo.hourlyRate && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Hourly Rate</p>
                                <p className="font-medium">{employeeInfo.hourlyRate}</p>
                              </div>
                            </div>
                          )}
                          {employeeInfo.role && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Role</p>
                                <p className="font-medium">{employeeInfo.role}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Hours</CardDescription>
                      <CardTitle className="text-3xl">{getTotalHours()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        All time entries
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Paid Hours</CardDescription>
                      <CardTitle className="text-3xl text-green-600">{getTotalHours(true)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {getPaidTotal()} entries
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Unpaid Hours</CardDescription>
                      <CardTitle className="text-3xl text-orange-600">{getTotalHours(false)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-gray-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        {getUnpaidTotal()} entries
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>View Timesheet</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(employee.sheetUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Sheets
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Time Entries Table */}
                {loadingEntries ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Entries</CardTitle>
                      <CardDescription>Loading time entries...</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TableSkeleton rows={5} columns={8} />
                    </CardContent>
                  </Card>
                ) : entries.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Entries</h3>
                        <p className="text-gray-600">
                          This employee hasn't logged any time yet.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Entries</CardTitle>
                      <CardDescription>
                        All time entries for {employee.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                              <th className="px-4 py-3">
                                <button
                                  onClick={() => handleSort('date')}
                                  className="flex items-center gap-1 hover:text-gray-700"
                                >
                                  Date
                                  {sortField === 'date' && (
                                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  )}
                                  {sortField !== 'date' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </button>
                              </th>
                              <th className="px-4 py-3">
                                <button
                                  onClick={() => handleSort('time')}
                                  className="flex items-center gap-1 hover:text-gray-700"
                                >
                                  Time
                                  {sortField === 'time' && (
                                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  )}
                                  {sortField !== 'time' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </button>
                              </th>
                              <th className="px-4 py-3">
                                <button
                                  onClick={() => handleSort('duration')}
                                  className="flex items-center gap-1 hover:text-gray-700"
                                >
                                  Duration
                                  {sortField === 'duration' && (
                                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  )}
                                  {sortField !== 'duration' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </button>
                              </th>
                              <th className="px-4 py-3">
                                <button
                                  onClick={() => handleSort('clientName')}
                                  className="flex items-center gap-1 hover:text-gray-700"
                                >
                                  Client
                                  {sortField === 'clientName' && (
                                    sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  )}
                                  {sortField !== 'clientName' && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                </button>
                              </th>
                              <th className="px-4 py-3">Task</th>
                              <th className="px-4 py-3">Notes</th>
                              <th className="px-4 py-3 text-center">Paid</th>
                              <th className="px-4 py-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {sortedEntries.map((entry, index) => {
                              const isPaid = entry.paid === 'Yes'
                              return (
                                <tr key={index} className={`hover:bg-gray-50 ${isPaid ? 'bg-green-50/30' : ''}`}>
                                  <td className="px-4 py-3 text-sm">{formatDate(entry.date)}</td>
                                  <td className="px-4 py-3 text-sm">
                                    {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium">
                                    {formatDuration(entry.duration)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {entry.clientCode ? (
                                      <Link
                                        href={`/dashboard/client/${entry.clientCode}`}
                                        className="block hover:underline"
                                      >
                                        <p className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                          {entry.clientName}
                                        </p>
                                        {entry.company && (
                                          <p className="text-xs text-gray-500">{entry.company}</p>
                                        )}
                                      </Link>
                                    ) : (
                                      <div>
                                        <p className="text-sm font-medium text-gray-700">
                                          {entry.clientName}
                                        </p>
                                        {entry.company && (
                                          <p className="text-xs text-gray-500">{entry.company}</p>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm">{entry.task}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{entry.notes || "-"}</td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <Checkbox
                                        checked={isPaid}
                                        onCheckedChange={() => togglePaidStatus(entry, isPaid)}
                                        disabled={updatingEntry === entry.rowIndex}
                                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                      />
                                      {isPaid && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                          Paid
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEntryToDelete(entry)}
                                      disabled={deletingEntry === entry.rowIndex}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the time entry from both the employee's timesheet and the client's timesheet.
              This action cannot be undone.
              {entryToDelete && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md space-y-2">
                  <p className="text-sm"><strong>Date:</strong> {formatDate(entryToDelete.date)}</p>
                  <p className="text-sm"><strong>Time:</strong> {formatTime(entryToDelete.startTime)} - {formatTime(entryToDelete.endTime)}</p>
                  <p className="text-sm"><strong>Client:</strong> {entryToDelete.clientName}</p>
                  <p className="text-sm"><strong>Task:</strong> {entryToDelete.task}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTimeEntry}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
