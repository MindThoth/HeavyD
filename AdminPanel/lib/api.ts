// Use same-origin proxy so script response is always readable (no CORS/env issues)
const GAS_BASE = "/api/gas"

// API helper for Google Apps Script integration (GET requests)
export async function api<T = any>(action: string, params: Record<string, any> = {}) {
  // Filter out null/undefined values
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null)
  )

  try {
    console.log("[API] Calling:", action, filteredParams)

    const tryFetch = (withAdmin: boolean) => {
      const queryParams = withAdmin ? { api: 'admin', action, ...filteredParams } : { action, ...filteredParams }
      const qp = new URLSearchParams(queryParams)
      return fetch(`${GAS_BASE}?${qp.toString()}`, { cache: "no-store", method: "GET" })
    }

    let response = await tryFetch(true)

    console.log("[API] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API] Error response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    let responseText = await response.text()
    console.log("[API] Response (first 200 chars):", responseText.substring(0, 200))

    let json: any
    try {
      json = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[API] JSON parse error:", parseError)
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
    }

    // If script returned "Unknown action" for a dashboard action, retry without api=admin (hits dashboard handler)
    const unknownAction = json && json.error && String(json.error).startsWith("Unknown action:")
    const dashboardActions = ["getAllClients", "getClientData"]
    const isDashboardAction = dashboardActions.includes(action)
    if (unknownAction && isDashboardAction) {
      console.log("[API] Retrying without api=admin (dashboard route)")
      response = await tryFetch(false)
      if (response.ok) responseText = await response.text()
      try { json = JSON.parse(responseText) } catch (_) {}
    }

    if (!json || typeof json !== "object") {
      throw new Error(`Invalid response structure: ${responseText.substring(0, 100)}`)
    }

    if (json.success === undefined) {
      throw new Error(`Response missing success field: ${responseText.substring(0, 100)}`)
    }

    if (!json.success) {
      console.error("[API] API returned error:", json.message)
      throw new Error(json.message || "API error without message")
    }

    console.log("[API] Success:", json.message || "OK")
    return json as T
  } catch (error) {
    console.error("[API] Error:", error)
    throw error
  }
}

// API helper for POST requests (via same-origin proxy)
export async function apiPost<T = any>(mode: string, data: Record<string, any> = {}) {
  try {
    console.log("[API POST] Calling:", mode, data)

    const response = await fetch(GAS_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api: 'admin', mode, ...data }),
    })

    console.log("[API POST] Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[API POST] Error response:", errorText)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log("[API POST] Response:", responseText.substring(0, 200))

    let json
    try {
      json = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[API POST] JSON parse error:", parseError)
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
    }

    console.log("[API POST] Success")
    return json as T
  } catch (error) {
    console.error("[API POST] Error:", error)
    throw error
  }
}

// Type definitions
export interface Client {
  date: string          // Column A
  status: string        // Column B
  priority: string      // Column C
  name: string          // Column D
  company: string       // Column E
  email: string         // Column F
  phone: string         // Column G
  language: string      // Column H
  service: string       // Column I
  cost: string          // Column J
  price: string         // Column K
  driveLink: string     // Column L
  briefLink: string     // Column M
  estimateLink: string  // Column N
  revisionLink: string  // Column O (revision link URL)
  revisionCode: string  // Column P (client code like "6501")
  uploadLink: string    // Column Q
  quoteLink: string     // Column R
  receiptLink: string   // Column S
  notes: string         // Column T
  timeAmount: string    // Column U (manual time entry or legacy)
  timesheetLink: string // Column W (timesheet URL) - Column V auto-calculates hours
  boatName?: string     // Column X - Boat name (from Master sheet)
  accessCode: string    // Column P (same as revisionCode)
}

export interface TimeEntry {
  date: string
  startTime: string
  endTime: string
  task: string
  notes: string
  duration: number
  employeeName?: string
}

export interface Employee {
  name: string
  sheetId: string
  sheetUrl: string
}

export interface EmployeeEntry {
  date: string
  startTime: string
  endTime: string
  duration: number
  clientName: string
  clientCode: string
  company: string
  task: string
  notes: string
  paid: string
  rowIndex: number
}

export interface CalculatorMaterial {
  name: string
  rollWidth: number
  rollLength: number
  rollPrice: number
  taxesShipping: number
  totalSqInches: number
  pricePerSqIn: number
}

export interface CalculatorService {
  name: string
  heightSize: number
  widthSize: number
  totalSqInches: number
  materialCost: number
  printingLabour: number
  installTime: number
  installLabourCost: number
  totalCost: number
  totalPriceMultiplier: number
  roundUp: number
  profit: number
}

export interface ServicePrice {
  name: string
  costPerSqIn: number
  pricePerSqIn: number
}

export interface CalculationResult {
  materials: CalculatorMaterial[]
  services?: ServicePrice[]
  boatLettering?: CalculatorService[]
  stickers?: CalculatorService[]
  logoDesign?: CalculatorService[]
  installation?: {
    location: string
    kmFromGE: number
    allerRetour: number
    gasPrice: number
    roundUp: number
  }[]
}

// API methods
export const clientsApi = {
  // Get all clients from Master sheet
  getAllClients: () =>
    api<{ success: boolean; message: string; clients: Client[] }>("getAllClients"),

  // Get single client by access code
  getClient: (code: string) =>
    api<{ success: boolean; message: string; client: Client }>("getClient", { code }),

  // Update client status
  updateClientStatus: (accessCode: string, status: string) =>
    api<{ success: boolean; message: string }>("updateClientStatus", { accessCode, status }),

  // Update client notes
  updateClientNotes: (accessCode: string, notes: string) =>
    api<{ success: boolean; message: string }>("updateClientNotes", { accessCode, notes }),

  // Add new client (uses POST)
  addClient: (clientData: Record<string, any>) =>
    apiPost<{ success: boolean; message: string; accessCode: number; driveLink: string; briefUrl: string; uploadLink: string }>("add_client", clientData),

  // Delete client (deletes row from sheet and folder from Drive)
  deleteClient: (accessCode: string, driveLink: string) =>
    api<{ success: boolean; message: string }>("deleteClient", { accessCode, driveLink }),

  // Update client information
  updateClient: (accessCode: string, clientData: { name?: string; email?: string; phone?: string; company?: string; language?: string }) =>
    api<{ success: boolean; message: string }>("updateClient", { accessCode, ...clientData }),

  // Create quote from template
  createQuote: (accessCode: string) =>
    api<{ success: boolean; message: string; quoteLink?: string }>("createQuote", { accessCode }),

  // Create receipt from template
  createReceipt: (accessCode: string) =>
    api<{ success: boolean; message: string; receiptLink?: string }>("createReceipt", { accessCode }),
}

export const clientExtrasApi = {
  // Get boat name from brief document
  getBoatName: (briefId: string) =>
    api<{ success: boolean; message: string; boatName?: string }>("getBoatName", { briefId }),

  // Get full brief content
  getBriefContent: (briefId: string) =>
    api<{ success: boolean; message: string; briefData?: any }>("getBriefContent", { briefId }),
}

export const timesheetApi = {
  // Get timesheet entries for a client
  getTimeEntries: (code: string) =>
    api<{ success: boolean; message: string; entries: TimeEntry[] }>("getTimeEntries", { code }),

  // Add time entry (now with optional employee tracking)
  addTimeEntry: (code: string, entry: TimeEntry) =>
    api<{ success: boolean; message: string }>("addTimeEntry", { code, ...entry }),

  // Get total hours for client
  getTotalHours: (code: string) =>
    api<{ success: boolean; message: string; totalHours: number }>("getTotalHours", { code }),

  // Create new timesheet for client
  createTimesheet: (code: string, clientName: string) =>
    api<{ success: boolean; message: string; timesheetUrl: string }>("createTimesheet", { code, clientName }),
}

export const calculatorApi = {
  // Get calculator data (materials, services, etc.)
  getCalculatorData: () =>
    api<{ success: boolean; message: string; data: CalculationResult }>("getCalculatorData"),
  
  // Calculate price for sticker
  calculateStickerPrice: (
    service: string,
    height: number,
    width: number,
    quantity: number,
    multiplier: number
  ) =>
    api<{ 
      success: boolean
      message: string
      calculation: {
        totalSqInches: number
        materialCost: number
        printingCost: number
        totalCost: number
        suggestedPrice: number
        profit: number
      }
    }>("calculateStickerPrice", { service, height, width, quantity, multiplier }),
  
  // Calculate price for boat lettering
  calculateBoatLettering: (items: any[]) =>
    api<{ success: boolean; message: string; total: number; items: any[] }>(
      "calculateBoatLettering", 
      { items: JSON.stringify(items) }
    ),
}

export interface Expense {
  date: string
  vendor: string
  total: string
  category: string
  imageLink: string
}

export const expenseApi = {
  // Get all expenses
  getAllExpenses: () =>
    api<{ success: boolean; message: string; expenses: Expense[]; totalExpenses: number }>("getAllExpenses"),

  // Add new expense
  addExpense: (expense: Omit<Expense, 'imageLink'> & { imageLink?: string }) =>
    api<{ success: boolean; message: string }>("addExpense", expense),
}

export interface EmployeeInfo {
  name: string
  email: string
  phone: string
  hireDate: string
  hourlyRate: string
  role: string
}

export const employeeApi = {
  // Get all employees
  getAllEmployees: () =>
    api<{ success: boolean; message: string; employees: Employee[] }>("getAllEmployees"),

  // Get all time entries for an employee
  getEmployeeEntries: (employeeName: string) =>
    api<{ success: boolean; message: string; entries: EmployeeEntry[] }>("getEmployeeEntries", { employeeName }),

  // Mark an employee entry as paid/unpaid
  markEmployeeEntryPaid: (employeeName: string, entryIndex: number, paid: boolean) =>
    api<{ success: boolean; message: string }>("markEmployeeEntryPaid", {
      employeeName,
      entryIndex: entryIndex.toString(),
      paid: paid.toString()
    }),

  // Create a new employee
  createEmployee: (employeeInfo: EmployeeInfo) =>
    api<{ success: boolean; message: string }>("createEmployee", employeeInfo),

  // Get employee info
  getEmployeeInfo: (employeeName: string) =>
    api<{ success: boolean; message: string; employeeInfo: EmployeeInfo }>("getEmployeeInfo", { employeeName }),

  // Update employee info
  updateEmployeeInfo: (employeeName: string, employeeInfo: Partial<EmployeeInfo>) =>
    api<{ success: boolean; message: string }>("updateEmployeeInfo", { employeeName, ...employeeInfo }),

  // Delete employee time entry
  deleteEmployeeTimeEntry: (employeeName: string, entryRowIndex: number, clientCode: string) =>
    api<{ success: boolean; message: string }>("deleteEmployeeTimeEntry", {
      employeeName,
      entryRowIndex: entryRowIndex.toString(),
      clientCode
    }),
}

export interface ReceiptInfo {
  clientName: string
  company: string
  accessCode: string
  status: string
  receiptLink: string
  inReceiptFolder: boolean
  receiptFolderPath?: string
  date: string
  amount: string
  generatedDate?: string
  sentDate?: string
  paidDate?: string
}

export const receiptsApi = {
  // Get all receipts
  getAllReceipts: () =>
    api<{ success: boolean; message: string; receipts: ReceiptInfo[] }>("getAllReceipts"),

  // Send receipt to folder (organized by year/month)
  sendReceiptToFolder: (accessCode: string) =>
    api<{ success: boolean; message: string; folderPath: string }>("sendReceiptToFolder", { accessCode }),

  // Check if receipt is in folder
  checkReceiptInFolder: (accessCode: string) =>
    api<{ success: boolean; message: string; inFolder: boolean; folderPath?: string }>("checkReceiptInFolder", { accessCode }),
}
