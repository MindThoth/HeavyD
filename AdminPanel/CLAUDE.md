# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Heavy D Admin Dashboard - A Next.js admin dashboard for client management, pricing calculator, timesheet tracking, expense management, and employee time tracking that integrates with Google Sheets via Google Apps Script.

**Current Version:** 3.0.0

## Development Commands

### Running the Application
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production (Next.js static export)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Version Management
**IMPORTANT:** When releasing a new version, update the version number in ALL of these locations:
1. `code.gs` - Line 2 (version comment)
2. `package.json` - Line 3 (version field)
3. `app/login/page.tsx` - Line 77 (footer text)
4. `app/dashboard/layout.tsx` - Line 136 (footer text)
5. `CLAUDE.md` - Version History section (add new version entry at top)

### Environment Setup
Before running the app, create `.env.local` with:
```env
# Google Sheets Integration
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
NEXT_PUBLIC_MASTER_SHEET_ID=1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU
NEXT_PUBLIC_CALCULATOR_SHEET_ID=1_jLOhyotUzNNmfrzGpH9tRoO06LOsiCFaaRKaSWcjVU
NEXT_PUBLIC_TIMESHEET_TEMPLATE_ID=1-Eu_KkaQIHAW6uzK0npZ-gQgndmDZTj0snBhjxoFKqE
NEXT_PUBLIC_MASTER_DRIVE_FOLDER=10IyZIezSZd7w7QAcGjGUa063mryg65fe

# Authentication (Required for v2.7.0+)
AUTH_SECRET=your-auth-secret-here  # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALLOWED_EMAILS=  # Optional: Comma-separated list of allowed emails
```

See `.env.local.example` for a complete template with detailed comments.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router (React 18, TypeScript)
- **Authentication**: NextAuth.js v5 with Google OAuth provider
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: Radix UI primitives (accordion, dialog, dropdown, select, tabs, toast, etc.)
- **Form Handling**: react-hook-form with zod validation
- **Icons**: lucide-react
- **Backend**: Google Apps Script as REST API (interfaces with Google Sheets)

### Data Flow Architecture
1. **Frontend (Next.js)** → Makes API calls via `lib/api.ts`
2. **API Layer (`lib/api.ts`)** → Sends GET requests to Google Apps Script endpoint
3. **Google Apps Script** → Reads/writes data to Google Sheets
4. **Google Sheets** → Source of truth for all data (clients, expenses, calculator pricing)

This is a **frontend-only application** with no traditional backend server. All data persistence happens in Google Sheets.

### Key Architecture Patterns

#### API Integration Pattern
- All API calls go through `lib/api.ts` which provides a type-safe wrapper around the Google Apps Script endpoint
- The `api<T>()` function handles query string building, error handling, and response parsing
- Organized into domain-specific API objects: `clientsApi`, `timesheetApi`, `calculatorApi`, `expenseApi`
- Each API call includes comprehensive logging for debugging

#### Component Architecture
- Pages use client-side rendering (`"use client"` directive) for interactive features
- Dashboard layout (`app/dashboard/layout.tsx`) provides persistent sidebar navigation
- Brand color `#000050` (dark blue) is used throughout the sidebar and accent elements
- All pages follow a consistent pattern: loading state → data fetch → error handling → render

#### Data Models
The main data types are defined in `lib/api.ts`:
- **Client**: Represents a client with 20+ fields including status, service, links to Google Drive/Docs
- **TimeEntry**: Tracks time spent on client projects
- **CalculatorMaterial**: Pricing data for materials (vinyl, laminate, etc.)
- **Expense**: Business expense tracking

### Google Sheets Structure
The app expects specific sheet structures:

**Master Sheet** (Client data):
- Column A-U contain client information (date, status, priority, name, company, email, phone, language, service, cost, price, links, notes, time tracking)
- Column O (index 14): `revisionCode` - Used as the unique client access code
- Column V (index 21): `timesheetLink` - Link to client's timesheet

**Price/Calculator Sheet** (Pricing data):
- Rows 2-7: Material costs (Boat Vinyl, Vinyl Paper, Black Gloss, Laminate, Ink, etc.)
- Each material has: roll width, length, price, taxes/shipping, total sq inches, price per sq inch

**Expense Sheet**:
- Columns: Date, Vendor, Total, Category, Image Link

## Important Development Notes

### Adding New Features
1. **New API endpoints**: Add methods to `lib/api.ts` following the existing pattern (create API object, define types, use `api<T>()` helper)
2. **New pages**: Create in `app/dashboard/` and add to navigation in `app/dashboard/layout.tsx`
3. **New UI components**: Use existing Radix UI components in `components/ui/` or create new ones following the same pattern

### Google Apps Script Integration
- The Google Apps Script code is documented in `README.md` (lines 58-513)
- All actions are GET requests with an `action` parameter
- Responses follow the format: `{ success: boolean, message: string, ...data }`
- The script accesses specific Google Sheets by hardcoded IDs

### Authentication (v2.7.0+)
The app uses NextAuth.js v5 with Google OAuth for authentication:
- **Configuration**: `auth.ts` in project root defines the NextAuth configuration
- **API Route**: `/api/auth/[...nextauth]` handles OAuth callbacks
- **Middleware**: `middleware.ts` protects all `/dashboard` routes - unauthenticated users are redirected to `/login`
- **Session Management**: SessionProvider wraps the app in `components/providers.tsx`
- **Login Page**: Custom login UI at `/login` with Google sign-in button
- **Email Restriction**: Set `ALLOWED_EMAILS` environment variable (comma-separated) to restrict access to specific Google accounts
- **User Display**: Dashboard sidebar shows logged-in user's name, email, and logout button

#### Setting Up Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (development)
4. For production, add: `https://yourdomain.com/api/auth/callback/google`
5. Copy Client ID and Client Secret to `.env.local`
6. Generate AUTH_SECRET: `openssl rand -base64 32`

### Brand Identity
- Primary brand color: `#000050` (dark navy blue)
- Used in sidebar, active states, and accents
- Maintained consistency across all UI elements
- To change branding, search for `#000050` and update in `app/dashboard/layout.tsx` and `app/globals.css`

### Path Aliases
- `@/*` maps to project root (configured in `tsconfig.json`)
- Example: `import { cn } from "@/lib/utils"`

### Error Handling Pattern
All pages follow this error handling pattern:
```typescript
try {
  setLoading(true)
  const response = await someApi.method()
  // Process response
} catch (error) {
  console.error("Error message:", error)
  // Display error to user if needed
} finally {
  setLoading(false)
}
```

### Client Access Code
- Each client is identified by their `revisionCode` (column O in Master sheet)
- This code is used to fetch individual client data and link to their timesheet
- The code is also stored as `accessCode` in the Client type for convenience

## Common Customizations

### Updating Status Options
Status colors are defined in `app/dashboard/clients/page.tsx`. Add new statuses to the `statusColors` object.

### Changing Calculator Multiplier
Default price multiplier is set in `app/dashboard/tools/calculator/page.tsx` (`useState("4")`).

### Adding Navigation Items
Update the `navigation` array in `app/dashboard/layout.tsx` with new pages.

## Deployment Notes
- This app can be deployed to any Next.js hosting platform (Vercel, Netlify, etc.)
- Ensure all environment variables are set in the hosting platform
- The Google Apps Script must be deployed as a web app with "Who has access: Anyone"
- No server-side APIs or databases required - it's a pure frontend app

## Version History

### Version 3.0.0 (Current)
**Performance & Loading Experience Release:**

This release focuses exclusively on improving dashboard performance and perceived speed without changing any functional logic from v2.9.4.

**Caching Infrastructure:**
1. **Client-Side Cache Provider** - React Context-based caching system for reusable data
2. **Employee List Caching** - Employee list cached for 5 minutes to avoid redundant API calls
3. **Smart Cache Invalidation** - Automatic cache expiry with timestamp-based validation
4. **Tab Switching Optimization** - Returning to a tab uses cached data instead of refetching

**Loading Experience:**
1. **Skeleton Components** - Added TableSkeleton and CardSkeleton components for loading states
2. **Skeleton Loading States** - Replaced spinners with skeleton screens on employee time entries table
3. **Progressive Rendering** - Page shell renders immediately while data loads in background
4. **Visual Feedback** - Clean loading states so users never see blank white panels

**API Optimization:**
1. **Reduced Redundant Calls** - Prevented duplicate API calls on component mount
2. **Cache-First Strategy** - Check cache before making network requests
3. **Deferred Loading** - Non-critical data loads after initial render

**Technical Implementation:**
- Created `app/providers/cache-provider.tsx` with CacheContext
- Created `components/ui/skeleton.tsx` with reusable skeleton components
- Wrapped app with CacheProvider in `components/providers.tsx`
- Added caching to employee list loading with `useCache` hook
- Improved loading states across employee tab

**Safety & Compatibility:**
- Zero functional changes from v2.9.4
- All features work identically (receipts, employees, timestamps, etc.)
- No changes to Google Sheets or Drive structure
- No changes to data models or API endpoints

**Version Updates:**
- package.json: 3.0.0
- Login page footer: v3.0.0
- Dashboard sidebar footer: Version 3.0.0
- CLAUDE.md: Updated to 3.0.0

**User Experience Impact:**
- Faster tab switching (uses cached data)
- Immediate page shell rendering
- Better loading feedback with skeletons
- Smoother navigation between sections

### Version 2.9.4
**Employee Management Enhancements & Receipt Improvements:**

**Employee Tab:**
1. **Edit Employee Info** - Added ability to edit employee information including email, phone, hire date, hourly rate, and role
2. **Hourly Rate & Role** - New fields for tracking employee hourly rate and job role
3. **Delete Time Entries** - Added delete button for individual time entries with confirmation dialog
4. **Dual Deletion** - When deleting a time entry, it's removed from both employee timesheet AND client timesheet
5. **Client Code Matching** - Uses unique client code (column P) to accurately match and delete entries
6. **Formatted Timestamps** - All dates displayed in YYYY-MM-DD format, times in 12-hour AM/PM format
7. **Edit UI** - Clean inline editing interface with Save/Cancel buttons for employee information

**Receipt Tab:**
1. **Date Column** - Added date column to receipts table showing receipt creation date
2. **Amount Column** - Display receipt amount from Master sheet price column
3. **Clickable Client Names** - Client names are now clickable links to their detail page
4. **Sortable Columns** - Click column headers to sort by Date, Client, Code, Amount, or Status
5. **Default Sort** - Receipts sorted by date (newest first) by default
6. **Fixed Access Code** - Corrected to use column P instead of column O for client codes
7. **Visual Sort Indicators** - Arrow icons show current sort field and direction

**Technical Changes - Employee:**
- Added `hourlyRate` and `role` fields to `EmployeeInfo` interface
- Updated `createEmployee()` to store hourly rate and role in employee info row
- Updated `getEmployeeInfo()` to return hourly rate and role
- Updated `updateEmployeeInfo()` to handle hourly rate and role updates
- Added `deleteEmployeeTimeEntry()` function to delete from both employee and client timesheets
- Updated employee timesheet structure to include Client Code column (column F)
- Modified `addToEmployeeTimesheet()` to store client code with each entry
- Updated `getEmployeeEntries()` to return client code for entry matching
- Added `deleteEmployeeTimeEntry` action to doGet handler
- Employee timesheet format: Date | Start | End | Duration | ClientName | ClientCode | Task | Notes | Paid

**Technical Changes - Receipts:**
- Fixed `getAllReceipts()` to use column P (index 15) instead of column O for access codes
- Added `date` and `amount` fields to `ReceiptInfo` interface
- Updated `sendReceiptToFolder()` and `checkReceiptInFolderInternal()` to use correct column
- Added date and amount extraction in `getAllReceipts()` (columns A and K)
- Implemented client-side sorting with toggleable sort direction
- Added `formatDate()` and `formatTime()` utilities for AST timezone display
- Receipts page uses Next.js Link component for navigation to client pages

**Technical Changes - Frontend:**
- Added Edit2 and Trash2 icons from lucide-react
- Added AlertDialog component for delete confirmations
- Implemented editingEmployeeInfo state and inline edit forms
- Added sortField and sortDirection state for receipt sorting
- Updated employee page with edit/delete UI and confirmation dialogs
- Added ArrowUp/ArrowDown icons for sort direction indicators
- Implemented toggleSort function for column header click handling

**Employee Timesheet Structure:**
- Row 1 (hidden): EMPLOYEE_INFO | Name | Email | Phone | HireDate | HourlyRate | Role
- Row 2: Headers (Date | Start Time | End Time | Duration | Client Name | Client Code | Task | Notes | Paid)
- Row 3+: Time entries with client code for accurate deletion matching

**User Experience:**
- Employees tab shows hourly rate and role in employee info card
- Click "Edit" button to modify employee information inline
- Delete button on each time entry with "Are you sure?" confirmation dialog
- Confirmation shows entry details before deletion
- Timestamps display in user-friendly format (YYYY-MM-DD and 12-hour time)
- Receipts table sortable by clicking any column header
- Client names clickable to navigate directly to client detail page
- Visual feedback with sort arrows showing current sort state

### Version 2.9.3
**Receipt Management with Year/Month Organization:**
1. **Receipts Tab** - New dedicated page listing all project receipts with status and folder tracking
2. **PDF-Only Receipts** - All receipts are created and stored as PDF files (not Google Docs)
3. **Conditional Folder Sending** - Receipts only sent to receipt folder when manually triggered (not auto-sent)
4. **Receipt Folder Status** - Visual indicator showing if receipt is in receipt folder
5. **Send to Folder Button** - Manual button to send receipts to organized folder structure
6. **Year/Month Organization** - Receipts organized in folders by year and month (e.g., 2025/Oct)
7. **PAID Prefix** - Receipts for "Paid" status clients get "PAID -" prefix in filename

**Technical Changes:**
- Updated `createReceipt()` in code.gs to create PDF directly instead of Google Doc
- Receipt creation now converts doc to PDF, saves to client folder, deletes original doc
- Removed automatic copy to yearly folder from `createReceipt()`
- Added `getAllReceipts()` function to fetch all receipts from Master sheet with folder status
- Added `sendReceiptToFolder()` function to copy receipt PDF to year/month organized folder
- Added `checkReceiptInFolder()` and `checkReceiptInFolderInternal()` for folder status checking
- Added `getOrCreateYearMonthFolder()` to manage year/month folder hierarchy
- Created `ReceiptInfo` interface in lib/api.ts with receipt data structure
- Created `receiptsApi` with endpoints: `getAllReceipts`, `sendReceiptToFolder`, `checkReceiptInFolder`
- Created `/dashboard/receipts` page with full receipt management UI
- Added "Receipts" navigation item to sidebar with FileText icon

**Receipt Folder Structure:**
- Parent Folder: 1ER41h357d3tru7bQ1ulf78COcQ5fojan
- Year Folder: 2025, 2024, etc. (auto-created)
- Month Folder: Jan, Feb, Mar, ..., Dec (auto-created within year)
- Files: `Receipt - [Client Name].pdf` or `PAID - Receipt - [Client Name].pdf`

**User Experience:**
- Receipts tab shows all receipts with client name, status, and folder status
- Green checkmark indicates receipt is in receipt folder
- Red X indicates receipt not yet in folder
- "Send to Folder" button appears when receipt not in folder
- Button sends receipt to current year/month folder automatically
- Receipts for Paid clients get "PAID -" prefix
- Search receipts by client name, company, or access code
- Direct link to open receipt folder in Drive
- All receipts open as PDFs (not editable docs)

### Version 2.9.2
**Employee Creation, Info Management & Display:**
1. **Add Employee Functionality** - New "Add Employee" button in Employees page to create new employee profiles
2. **Employee Info Storage** - Store employee details (name, email, phone, hire date) in hidden row of their timesheet
3. **Employee Info Display** - View employee information card in Employees tab showing all contact details
4. **Employee Name in Client Timesheets** - Client timesheet tables now display which employee did each entry with visual badge
5. **Employee Creation Dialog** - Professional form to add new employees with name, email, phone, and hire date fields

**Technical Changes:**
- Added `createEmployee()` function in code.gs to create new employee timesheets with info row
- Added `getEmployeeInfo()` function to read employee details from hidden row 1
- Added `updateEmployeeInfo()` function to update employee information
- Employee timesheets now have hidden row 1 with format: EMPLOYEE_INFO | name | email | phone | hireDate
- Updated `getEmployeeEntries()` to skip info row when reading entries
- Added employee creation API endpoint: `createEmployee`, `getEmployeeInfo`, `updateEmployeeInfo`
- Created `EmployeeInfo` interface in lib/api.ts with name, email, phone, hireDate fields
- Added "Add Employee" dialog with form inputs to Employees page
- Added employee info card display showing contact details in Employees tab
- Added Employee column to client timesheet table with blue badge styling
- Updated TimeEntry interface to include employeeName field

**Employee Timesheet Structure:**
- Row 1 (hidden): EMPLOYEE_INFO | Name | Email | Phone | Hire Date
- Row 2: Headers (Date | Start Time | End Time | Duration | Client Name | Task | Notes | Paid)
- Row 3+: Time entries

**User Experience:**
- Click "Add Employee" button to create new employee with dialog form
- Employee info automatically loads when viewing employee in Employees tab
- Client timesheet tables show employee name badge for each entry
- Employee info persists across sessions in hidden Google Sheets row
- Professional employee management with full contact information tracking
- Visual distinction of employee names in client timesheets with blue badges

### Version 2.9.1
**Employee Tracking on All Timesheet Entries:**
1. **Employee Column in Client Timesheets** - Every time entry in client timesheets now includes employee name in column G
2. **Employee Selector on Client Pages** - Client detail pages now have employee dropdown when adding timesheet entries
3. **Dual Tracking from Both Pages** - Employee tracking works from both the Timesheet tool AND client detail pages
4. **Auto-Employee Column Creation** - When creating new client timesheets, Employee column (G) is automatically added if missing
5. **Consistent Employee Tracking** - All time entries (from any page) log to both client timesheet AND employee personal timesheet

**Technical Changes:**
- Updated `addTimeEntry()` in code.gs to save employee name in column G of client timesheets
- Updated `getTimeEntries()` to read employee from column G and return it with entries
- Updated `createTimesheet()` to automatically add "Employee" header to column G
- Added employee selector to client detail page (`app/dashboard/client/[id]/page.tsx`)
- Added `loadEmployees()` function to client page to fetch employee list
- Auto-selects Nicholas Lachance as default employee when available
- Updated client timesheet structure: A=Date, B=Start Time, C=End Time, D=Task, E=Notes, F=Duration, G=Employee
- Employee personal timesheets still track: Date | Start Time | End Time | Duration | Client Name | Task | Notes | Paid

**User Experience:**
- Timesheet tool page: Select client + employee → entry logged to both sheets
- Client detail page: Select employee in timesheet form → entry logged to both sheets
- Employee selector auto-loads employee list from employee folder
- Defaults to Nicholas Lachance if available
- All entries show which employee did the work in client's timesheet
- All entries also logged to employee's personal timesheet for payment tracking

### Version 2.9.0
**Employee Time Tracking Release:**
1. **Employee Timesheet Management** - Comprehensive system to track employee hours across all client projects
2. **Automatic Dual Logging** - When time is logged for a client, it's automatically added to both the client's timesheet AND the employee's personal timesheet
3. **Employee Dashboard** - New dedicated page showing all employees with their time entries, hours worked, and payment status
4. **Payment Tracking** - Mark individual time entries as paid/unpaid directly from the employee dashboard
5. **Employee Selector** - Timesheet page now includes employee selection to track who did the work
6. **Auto-Generated Sheets** - Employee timesheets are automatically created in the employee folder when first entry is logged
7. **Comprehensive Statistics** - View total hours, paid hours, and unpaid hours per employee

**Technical Changes:**
- Added `EMPLOYEE_FOLDER_ID` constant to Google Apps Script (folder: `1vOBKNQiC1ZCTLmBv1ipsVnJDeeEU3Ieh`)
- Created `getOrCreateEmployeeSheet()` function to find or create employee timesheet in employee folder
- Created `addToEmployeeTimesheet()` function to log time entries to employee sheets
- Modified `addTimeEntry()` to accept `employeeName` parameter and log to both client and employee sheets
- Created `getAllEmployees()` function to return all employee timesheet files
- Created `getEmployeeEntries()` function to get all time entries for a specific employee
- Created `markEmployeeEntryPaid()` function to update payment status of entries
- Added `Employee`, `EmployeeEntry` types to `lib/api.ts`
- Created `employeeApi` with methods: `getAllEmployees()`, `getEmployeeEntries()`, `markEmployeeEntryPaid()`
- Updated `timesheetApi.addTimeEntry()` to include optional `employeeName` parameter
- Created new page at `/dashboard/employees` with employee dashboard UI
- Added "Employees" navigation item to sidebar (between Clients and Calculator)
- Updated timesheet page with employee selector dropdown

**Employee Sheet Structure:**
- Columns: Date | Start Time | End Time | Duration (min) | Client Name | Task | Notes | Paid
- Automatically formatted with branded header (dark blue background, white text)
- Located in employee folder at: https://drive.google.com/open?id=1vOBKNQiC1ZCTLmBv1ipsVnJDeeEU3Ieh

**User Experience:**
- Timesheet page now has two selectors: client selection and employee selection
- When submitting a time entry, employee is automatically selected (defaults to Nicholas Lachance)
- Entry is logged to both the client's project timesheet and the employee's personal timesheet
- Employee dashboard shows tabbed interface with one tab per employee
- Each employee tab displays summary cards: total hours, paid hours, unpaid hours
- Full table of all time entries with ability to mark as paid via checkbox
- Clicking checkbox immediately updates payment status in Google Sheets
- Visual distinction for paid entries (green background tint)
- Direct link to open employee timesheet in Google Sheets
- Real-time updates when marking entries as paid/unpaid

**Data Flow:**
1. User selects client and employee on timesheet page
2. User logs time entry (date, start/end time, task, notes)
3. System calculates duration automatically
4. Entry is added to client's timesheet (existing functionality)
5. Entry is also added to employee's personal timesheet with client name
6. Employee can view all their entries on the Employees dashboard
7. Manager can mark entries as paid from the Employees dashboard
8. Payment status is stored in Google Sheets and persists

### Version 2.8.0
**Mobile-Responsive Navigation Release:**
1. **Hamburger Menu** - Added collapsible navigation menu for mobile devices with smooth slide-in animation
2. **Mobile Header** - Fixed top header on mobile showing app logo and menu toggle button
3. **Responsive Sidebar** - Sidebar slides in from left on mobile, always visible on desktop (lg+ screens)
4. **Touch-Friendly** - Large tap targets and optimized spacing for mobile interaction
5. **Overlay Close** - Clicking outside the mobile menu or on navigation links automatically closes it
6. **Adaptive Padding** - Main content adjusts padding based on screen size (p-4 on mobile, p-8 on desktop)
7. **Seamless UX** - Menu icon changes to X when open, smooth transitions throughout

**Technical Changes:**
- Added `Menu` and `X` icons from lucide-react for hamburger button
- Implemented `mobileMenuOpen` state with toggle functionality
- Added responsive classes using Tailwind's `lg:` breakpoint (1024px+)
- Created mobile header bar (visible only below lg breakpoint) with fixed positioning
- Added semi-transparent overlay (`bg-black bg-opacity-50`) that appears behind mobile menu
- Sidebar uses `translate-x` transform for smooth slide animation
- Navigation links call `closeMobileMenu()` on click for better UX
- Updated padding: mobile uses `p-4`, tablet `sm:p-6`, desktop `lg:p-8`
- Added `pt-16` to main content on mobile to account for fixed header

**User Experience:**
- Mobile users see a clean top bar with hamburger menu
- Tapping hamburger slides in the full navigation sidebar
- Tapping outside or on a link closes the menu automatically
- Desktop users see no changes - sidebar always visible
- All content properly spaced and readable on all screen sizes

### Version 2.7.0
**Security Release - Complete Authentication System:**
1. **Google OAuth Authentication** - Integrated NextAuth.js v5 with Google OAuth provider for secure login
2. **Route Protection** - All dashboard routes protected by middleware - unauthorized users redirected to login
3. **Email Access Control** - Optional whitelist of allowed email addresses via `ALLOWED_EMAILS` environment variable
4. **Session Management** - Persistent sessions with automatic redirect handling
5. **User Profile Display** - Sidebar shows logged-in user's name, email, and sign-out button
6. **Custom Login Page** - Professional login UI matching the Heavy D brand identity
7. **Complete Security** - No unauthorized access to any dashboard functionality or data

**Technical Changes:**
- Installed `next-auth@beta` (NextAuth.js v5) with Google OAuth provider
- Created `auth.ts` configuration file with Google provider and email restriction logic
- Added `/api/auth/[...nextauth]` API route for OAuth callbacks
- Created `middleware.ts` to protect all `/dashboard` routes and handle redirects
- Created `components/providers.tsx` with SessionProvider wrapper for the app
- Built custom login page at `/login` with Google sign-in button and error handling
- Updated dashboard layout with user session display and logout functionality
- Added authentication environment variables to `.env.local.example`

**Setup Requirements:**
- Google Cloud Console OAuth 2.0 credentials (Client ID & Secret)
- `AUTH_SECRET` environment variable (generate with `openssl rand -base64 32`)
- Optional: `ALLOWED_EMAILS` to restrict access to specific Google accounts
- Authorized redirect URIs configured in Google Cloud Console

**User Experience:**
- Root path `/` redirects to login if not authenticated, dashboard if authenticated
- Login page shows Heavy D branding with Google sign-in button
- Unauthorized email addresses see "Access denied" error message
- Dashboard sidebar displays user profile with name, email, and sign-out button
- Clicking sign-out logs user out and redirects to login page
- All routes require authentication - no data accessible without login

### Version 2.6.9
**Client List Improvements - Hide Paid Clients & Status Sorting:**
1. **Hide Paid Clients by Default** - Paid clients are now hidden from the clients list to reduce clutter
2. **Show Paid Clients Checkbox** - Added checkbox in filters to toggle visibility of paid clients when needed
3. **Automatic Status Sorting** - Clients are now automatically sorted by status in workflow order:
   - New → Estimate Ready → Estimate Approved → Quote Sent → Quote Accepted → Not Started → In Progress → Designed → Printed → Completed → Receipt Sent → Paid
4. **Cleaner Client View** - Active projects appear at top, completed/paid projects can be shown when needed

**Technical Changes:**
- Added `showPaidClients` state (default: false) to control paid client visibility
- Added `statusOrder` array defining the workflow order of statuses
- Modified `filterClients()` to filter out paid clients when checkbox unchecked
- Implemented automatic status-based sorting (always applied before any user-selected sorting)
- Added Checkbox component import and UI in filters section
- Updated useEffect dependencies to include `showPaidClients`

**UI Changes:**
- Added "Show paid clients" checkbox below the search/filter row
- Clients list now shows active projects first, sorted by status workflow
- Paid clients hidden by default to keep list focused on active work

### Version 2.6.8
**Yearly Receipt Organization and Paid Status Tracking:**
1. **Automatic Yearly Organization** - Receipts are automatically exported as PDFs to yearly folders (2025, 2026, etc.) when created
2. **PDF Export** - Receipts saved in yearly folders as read-only PDFs (cannot be edited)
3. **Auto-Create Year Folders** - System creates new year folders automatically if they don't exist
4. **Paid Status Tracking** - When client status changes to "Paid", receipt PDF in yearly folder is renamed to "PAID - Receipt - [Client Name].pdf"
5. **Status Differentiation** - Easy visual distinction between paid receipts (prefixed with "PAID") and unpaid receipts (status "Receipt Sent")
6. **Unit Price Calculation** - Quote/receipt now shows unit price by dividing total price by quantity from estimate sheet

**Technical Changes:**
- Added `YEARLY_RECEIPTS_FOLDER_ID` constant set to folder: 1ER41h357d3tru7bQ1ulf78COcQ5fojan
- Created `getOrCreateYearlyFolder(year)` - Gets existing year folder or creates new one
- Created `copyReceiptToYearlyFolder(receiptFileId, clientName, companyName, year)` - Exports receipt as PDF to yearly folder using DocumentApp.getAs('application/pdf')
- Created `updateReceiptTitleToPaid(receiptLink, clientName, companyName, year)` - Renames PDF file to include "PAID" prefix
- Modified `createReceipt()` to automatically export PDF to yearly folder after creation
- Modified `updateClientStatus()` to detect "Paid" status and trigger receipt PDF rename
- Updated estimate data extraction to calculate unit price (total ÷ quantity) instead of multiplying

**Receipt Workflow:**
1. Receipt created → Google Doc saved in client folder + PDF exported to yearly folder (e.g., "2025/Receipt - Client Name.pdf")
2. Status "Receipt Sent" → PDF shows as "Receipt - [Client Name].pdf" in yearly folder
3. Status changed to "Paid" → PDF renamed to "PAID - Receipt - [Client Name].pdf" in yearly folder

### Version 2.6.7
**Quote and Receipt Generation Bug Fix:**
1. **Fixed TypeError** - Resolved "Cannot read properties of undefined (reading 'toFixed')" error in quote/receipt generation
2. **Proper Default Values** - Initialize estimateData with default structure (items: [], subtotal: 0, tax: 0, total: 0) to prevent crashes when estimate data is unavailable
3. **Button State Detection** - Verified buttons properly detect existing quote/receipt URLs from columns R and S
4. **Dynamic Button States** - Buttons correctly switch between "Create Quote/Receipt" and "Open Quote/Receipt" based on URL presence in Master sheet

**Technical Changes:**
- Changed `let estimateData = {}` to `let estimateData = { items: [], subtotal: 0, tax: 0, total: 0 }` in both `createQuote()` and `createReceipt()` functions
- Ensures all financial calculations (subtotal.toFixed(2), tax.toFixed(2), total.toFixed(2)) have valid numeric values
- Verified Client interface includes quoteLink (Column R) and receiptLink (Column S) fields
- Confirmed frontend buttons properly read these fields from API response and update UI accordingly

### Version 2.6.6
**Enhanced Quote and Receipt Generation with Estimate Data:**
1. **Estimate Sheet Integration** - System now reads directly from Google Sheets estimate documents (not Google Docs)
2. **Item Extraction** - Automatically extracts items from estimate sheet columns A (description), B (quantity), D (price)
3. **Dynamic Item Placeholders** - Supports up to 20 items with {{qty_1}}, {{desc_1}}, {{price_1}}, {{amount_1}}, etc.
4. **Automatic Calculations** - Calculates subtotal, Quebec taxes (TPS 5% + TVQ 9.975%), and total from estimate data
5. **Receipt ID Generation** - Automatically generates receipt IDs in format "R-[AccessCode]-[Year]"
6. **Email Filtering** - Skips adding email if it's info@heavydetailing.com
7. **Enhanced Placeholders** - Added {{client_name}}, {{client_email}}, {{receipt_id}}, {{issue_date}}, {{service_name}}
8. **Sheet Link Updates** - Quote link saved to column R, Receipt link saved to column S in Master sheet

**Technical Changes:**
- Completely rewrote `extractEstimateData()` to work with Google Sheets instead of Google Docs
- Updated `extractDocId()` to handle spreadsheet URLs (/spreadsheets/d/...)
- Enhanced placeholder replacement in both `createQuote()` and `createReceipt()`:
  - Loops through items and replaces qty/desc/price/amount for each item (up to 20)
  - Clears unused item placeholders to avoid template artifacts
  - Formats currency values with $ symbol and 2 decimal places
  - Conditional email replacement (skips info@heavydetailing.com)
- Added receipt ID generation using access code and year
- Quebec tax calculation: TPS (5%) + TVQ (9.975%) = 14.975% total

**Placeholder Changes:**
- **New placeholders**: {{client_name}}, {{client_email}}, {{receipt_id}}, {{issue_date}}, {{service_name}}
- **Item placeholders**: {{qty_1}} through {{qty_20}}, {{desc_1}} through {{desc_20}}, {{price_1}} through {{price_20}}, {{amount_1}} through {{amount_20}}
- **Financial**: {{subtotal}}, {{tax}}, {{total}} (all formatted with $ and 2 decimals)
- **Legacy support**: Kept {{ClientName}}, {{Email}}, {{Service}}, etc. for backward compatibility

**User Experience:**
- More accurate financial data pulled directly from estimate sheets
- Itemized breakdown in quotes/receipts matches the estimate
- Proper tax calculations for Quebec (TPS+TVQ)
- Professional receipt numbering system
- Clean documents without placeholder artifacts

### Version 2.6.5
**Quote and Receipt Generation Feature:**
1. **Create Quote Button** - Added button to client detail page to generate quotes from templates
2. **Create Receipt Button** - Added button to client detail page to generate receipts from templates
3. **Language Detection** - Automatically detects client language (English or French) and uses appropriate template
4. **Template Placeholders** - Replaces tags like {{ClientName}}, {{Company}}, {{Price}}, etc. with actual client data
5. **Estimate Integration** - Extracts data from client's estimate document to populate quote/receipt
6. **Button State Management** - Shows "Create Quote/Receipt" button when document doesn't exist, "Open Quote/Receipt" when it does

**Technical Changes:**
- Added template constants to code.gs: QUOTE_TEMPLATE_EN_ID, QUOTE_TEMPLATE_FR_ID, RECEIPT_TEMPLATE_EN_ID, RECEIPT_TEMPLATE_FR_ID
- Implemented `createQuote()` function in code.gs that:
  - Detects client language from Master sheet (column H)
  - Copies appropriate template based on language
  - Replaces placeholders with client data from Master sheet and estimate document
  - Moves document to client's Drive folder
  - Updates Master sheet with quote link (column R)
- Implemented `createReceipt()` function with same logic for receipts (column S)
- Added helper functions: `extractFolderId()`, `extractDocId()`, `extractEstimateData()`
- Added `createQuote` and `createReceipt` actions to doGet handler
- Created API endpoints `clientsApi.createQuote()` and `clientsApi.createReceipt()` in lib/api.ts
- Added UI buttons with loading states to client detail page
- Added FileCheck and Receipt icons from lucide-react

**Placeholders Supported:**
- {{ClientName}}, {{Company}}, {{Email}}, {{Phone}}, {{Service}}, {{Cost}}, {{Price}}
- {{ProjectCode}}, {{Date}}, {{Language}}
- {{Items}}, {{Subtotal}}, {{Tax}}, {{Total}} (from estimate document)

**User Experience:**
- Buttons appear in Quick Actions section of client detail page
- "Create Quote" button appears when no quote exists
- Once created, button changes to "Open Quote" and opens document
- Same behavior for receipts
- Loading state shows "Creating..." while document is being generated
- Success toast notification when document is created
- Error messages if templates are not configured or if document already exists

**Setup Requirements:**
- User must provide template document IDs in code.gs constants
- Templates should use placeholder tags that match the supported placeholders
- Templates must be accessible by the Google Apps Script

### Version 2.6.4
**Edit Client Name Feature:**
1. **Name Editing** - Added ability to edit client name from the client detail page along with other contact information
2. **Improved UI Organization** - Changed language icon from User to Globe icon for better visual distinction

**Technical Changes:**
- Added `editedName` state variable to client detail page
- Updated Contact section to include name field in both edit and display modes
- Modified `updateClient()` in code.gs to handle name updates (column D)
- Updated `clientsApi.updateClient()` in lib/api.ts to accept name parameter
- Changed language icon from User to Globe for better visual clarity
- Imports: Added Globe icon from lucide-react

**User Experience:**
- Name field appears first in the Contact section
- All contact fields (name, email, phone, company, language) are now editable inline
- Edit/Save/Cancel buttons work for all contact information together
- Globe icon represents language preference
- User icon represents client name

### Version 2.6.3
**Client Management Enhancement Release:**
1. **Edit Client Functionality** - Added inline editing on client detail page for contact information
2. **Delete Client Functionality** - Added delete button on client detail page with confirmation dialog
3. **Drive Folder Deletion** - When deleting a client, their Google Drive folder is automatically moved to trash
4. **Confirmation Dialog** - Added "Are you sure?" dialog before deletion to prevent accidental data loss

**Technical Changes:**
- Removed edit/delete from clients list page per user request
- Added edit functionality inline on client detail page (app/dashboard/client/[id]/page.tsx)
- Added Delete Client button to client detail page header
- Implemented `deleteClient()` API endpoint in lib/api.ts
- Implemented `updateClient()` API endpoint for editing email, phone, company, language
- Created `deleteClient()` and `updateClient()` functions in code.gs
- Added AlertDialog component for delete confirmation

**User Experience:**
- Edit button in Contact section allows inline editing of client information
- Delete button shows in header with trash icon
- Confirmation dialog displays client name and warns about folder deletion
- Success/error toasts provide feedback
- Auto-redirect to clients list after successful deletion

### Version 2.6.2
**CORS Fix & Service Format Release:**
1. **Fixed CORS Issue with POST Requests** - Changed Content-Type from `application/json` to `text/plain` to avoid CORS preflight issues with Google Apps Script
2. **Fixed Service Format Validation** - Service names are now properly converted to lowercase-hyphen format (e.g., "Boat Lettering" → "boat-lettering") to match Google Sheets dropdown validation
3. **Enhanced Logging** - Added comprehensive logging to doPost() function for better debugging
4. **Improved Error Messages** - Added receivedData to error responses for better troubleshooting

**Technical Changes:**
- Updated `apiPost()` in lib/api.ts to use `Content-Type: text/plain` header
- Modified `doPost()` in code.gs to handle text/plain content type with JSON parsing
- Added `convertServiceFormat()` helper function to convert service names to sheet-compatible format
- Service names are converted only for sheet storage; folders and briefs keep user-friendly format
- Added detailed logging for POST request debugging (content-type, raw contents, parsed data)
- Improved error responses to include received data object

**Important:** This version requires redeployment of the Google Apps Script to work properly.

### Version 2.6.1
**Verification Release:**
1. **POST Request Verification** - Confirmed all POST handling is correctly implemented and connected
2. **Comprehensive Boat Lettering Fields** - Verified all 18+ boat-specific fields are properly included in form
3. **API Integration Check** - Validated connection between frontend form, API layer, and Google Apps Script

**What Was Verified:**
- `doPost()` function in code.gs properly routes 'add_client' mode to `addNewClient()` function
- `addNewClient()` creates folder structure, brief documents, and adds client to Master sheet
- `apiPost()` helper in lib/api.ts correctly sends POST requests with JSON body
- `clientsApi.addClient()` properly calls the API with mode 'add_client'
- Form page correctly collects and submits all boat lettering fields
- Error handling includes helpful deployment instructions for users

### Version 2.6.0
**Major Features:**
1. **Add New Client Feature** - Comprehensive form to add new clients directly from the admin panel
2. **Automated Folder Creation** - Automatically creates client folder structure in Google Drive
3. **Brief Document Generation** - Auto-generates project brief documents in Google Docs
4. **Access Code Assignment** - Generates unique access codes for client tracking

**Technical Changes:**
- Added `addNewClient()` function to code.gs for POST-based client creation
- Implemented `createClientFolders()` to handle folder hierarchy creation
- Added `createBriefDocument()` for automated brief generation
- Created `/dashboard/clients/new` page with dynamic service-based form
- Added `apiPost()` helper function to lib/api.ts for POST requests
- Updated clientsApi with `addClient()` method
- No email sending (designed for in-person client intake)

**UI/UX Improvements:**
- Clean form interface with service type selector
- Service-specific fields (e.g., boat name for Boat Lettering)
- Success screen with generated access code display
- Auto-redirect to newly created client page
- "Add New Client" button on clients list page
- Informational card explaining what happens when creating a client

### Version 2.5.0
**Major Features:**
1. **Receipt Uploader/Tracker** - Comprehensive expense management system with AI-powered receipt scanning
2. **Image Processing Tools** - Crop, grayscale conversion, and quality adjustment for receipt images
3. **OpenAI Integration** - Automatic extraction of date, vendor, total, and category from receipt images using GPT-4o Vision API
4. **Expense Management Dashboard** - View all expenses with total calculations, filterable by category
5. **Google Drive Integration** - Receipts automatically organized by year in Google Drive folders

**Technical Changes:**
- Added `doPost()` handler to code.gs for POST request support
- Implemented `uploadImageToDrive()`, `extractFromImageUrl()`, and `saveExpenseToSheet()` functions
- Created new expenses page at `/dashboard/expenses` with upload and view tabs
- Added Expenses navigation item to sidebar
- Integrated OpenAI GPT-4o Vision API for receipt data extraction
- Added manual entry fallback when AI scanning fails
- Automatic image compression and optimization before upload

**UI/UX Improvements:**
- 3-step receipt upload workflow: Upload → Edit → Confirm & Save
- Drag & drop file upload with visual feedback
- Real-time image preview and editing
- Success confirmation with automatic redirect to expense list
- Responsive table view for all expenses with receipt links

### Version 2.4.1
**Bug Fixes:**
1. **Calculator Service Pricing** - Fixed data loading from Price sheet columns I & J by properly parsing rows 2-7 and converting values to floats
2. **Timesheet Client Integration** - Improved client selection refresh after timesheet creation, ensuring the UI updates properly
3. **API Type Definitions** - Added `ServicePrice` interface to lib/api.ts and updated `CalculationResult` to include optional `services` array
4. **Console Logging** - Added debug logging to calculator for easier troubleshooting

**Technical Changes:**
- Updated `getCalculatorData()` in code.gs to only read service pricing from material rows (1-6) with proper float parsing
- Fixed timesheet client refresh by clearing and re-selecting after timesheet creation
- Added proper TypeScript interfaces for service pricing data
- Improved error handling and logging throughout calculator and timesheet components

### Version 2.4.0
**Features:**
1. **Separated Hull and Cabin Colors** - Client detail pages now display `HullColor` and `CabinColor` separately in the design information section (previously showed as generic "Colors")
2. **Calculator Price Integration** - Calculator page now loads service prices from the Price sheet (columns I & J) and displays cost and price per square inch for each service at the top of the page for verification
3. **Timesheet Client Selector** - Added client dropdown to Timesheet Tracker page allowing users to select which client they're tracking time for

**Technical Changes:**
- Updated `getBriefContent()` in code.gs to extract `HullColor` and `CabinColor` fields from briefs
- Modified `getCalculatorData()` in code.gs to read columns I (cost) and J (price) from Price sheet and return service pricing data
- Enhanced calculator page UI to display loaded service prices in a dedicated card at the top
- Added client selector to timesheet page with full client list loading and selection functionality

### Version 2.3.9
**Features:**
- Added `AdditionalInformation` field extraction from briefs
- Displayed additional information in separate card on client detail pages

### Version 2.3.8
**Features:**
- Created comprehensive boat-lettering checklist format for project briefs
- Added structured display with checkboxes for boat-specific items (Names, Numbers, Cabin Cap, Bow Design)
- Organized brief content into clear sections with visual checkmarks

### Version 2.3.7
**Features:**
- Created organized brief display format in Project Details tab
- Extracted and structured brief fields for easier reading

### Version 2.3.6
**Features:**
- Made client notes editable from client detail pages
- Added edit/save/cancel functionality for notes field (column T)

### Version 2.3.5
**Features:**
- Added status dropdown to client detail pages
- Implemented status update functionality with all 12 status options
- Color-matched status badges to user's design system

### Version 2.3.4
**Features:**
- Added boat name display under service column in clients list for boat-lettering services
- Implemented parallel fetching of boat names from Google Doc briefs

### Version 2.3.3
**Features:**
- Fixed boat name extraction to handle `https://docs.google.com/open?id=DOCUMENT_ID` URL format

### Version 2.3.2
**Features:**
- Added boat name display for boat-lettering services on client detail pages
- Implemented sortable column headers in clients table
- Added loading state for timesheet entry submission

### Version 2.3.1
**Features:**
- Fixed brief link handling (column M already contains full URLs)
- Corrected column mappings for estimate, revision, and client code fields

### Version 2.3.0
**Features:**
- Fixed client routing to use client code from column P instead of row index
- Corrected client identification throughout the application
