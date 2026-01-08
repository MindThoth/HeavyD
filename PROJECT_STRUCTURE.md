# Heavy D - Project Structure & Overview

## 📁 Clean Folder Structure

```
HeavyD/
│
├── AdminPanel/                 # Next.js admin dashboard
│   ├── app/                   # Next.js 13+ app directory
│   │   ├── api/auth/          # NextAuth authentication
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── clients/       # Client management
│   │   │   ├── employees/     # Employee tracking
│   │   │   ├── expenses/      # Expense tracking
│   │   │   ├── receipts/      # Receipt management
│   │   │   └── tools/         # Calculator & timesheet
│   │   ├── login/             # Login page
│   │   └── providers/         # React context providers
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API helper functions
│   │   └── utils.ts          # General utilities
│   ├── public/                # Static assets
│   ├── .env.local            # Environment variables (not in git)
│   ├── package.json
│   └── README.md
│
├── Dashboard/                 # Next.js client portal
│   ├── app/                   # App directory
│   │   ├── dashboard/         # Main dashboard page
│   │   ├── login/             # Client login
│   │   ├── print-view/        # Print-optimized view
│   │   └── quote-accepted/    # Quote acceptance page
│   ├── components/            # UI components
│   │   ├── file-upload-zone.tsx
│   │   ├── language-switcher.tsx
│   │   ├── revision-gallery.tsx
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities
│   ├── public/                # Static assets
│   ├── .env.local            # Environment variables (not in git)
│   ├── package.json
│   └── README.md
│
├── Website/                   # Next.js public website
│   ├── app/                   # App directory
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Homepage with quote form
│   ├── components/            # UI components
│   │   ├── service-card.tsx   # Service display card
│   │   └── ui/               # shadcn/ui components
│   ├── public/                # Static assets
│   │   └── images/           # Service & work images
│   ├── .env.local            # Environment variables (not in git)
│   ├── package.json
│   └── README.md
│
├── GoogleScript/              # ⭐ All backend logic
│   ├── website.gs            # Website form handler
│   ├── dashboard.gs          # API for dashboards
│   ├── revision.gs           # Revision automation
│   ├── QuoteAccepted.html    # Quote confirmation page
│   └── README.md             # Deployment guide
│
├── README.md                  # Main project documentation
├── DEPLOYMENT.md              # Complete deployment guide
└── PROJECT_STRUCTURE.md       # This file
```

## 🎯 Component Purposes

### Website (`www.heavydetailing.com`)
**Purpose**: Public-facing marketing site with quote request form

**Features**:
- Bilingual (EN/FR)
- Service showcase
- Portfolio/work samples
- Quote request form with conditional fields
- Automatic folder & document creation

**Tech Stack**:
- Next.js 14
- Tailwind CSS
- shadcn/ui components
- Form submission to Google Apps Script

**Environment Variables**:
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/.../website.gs
```

---

### Dashboard (`clients.heavydetailing.com`)
**Purpose**: Client portal for viewing project status and files

**Features**:
- Login with email + access code
- View project details & status
- Upload files to shared folder
- View & download revisions
- Leave comments/feedback
- Print view for quotes
- Bilingual interface

**Tech Stack**:
- Next.js 14
- Tailwind CSS
- shadcn/ui components
- API calls to Google Apps Script

**Environment Variables**:
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/.../dashboard.gs
```

---

### AdminPanel (`admin.heavydetailing.com`)
**Purpose**: Internal admin interface for managing clients & projects

**Features**:
- **Clients**: View all, edit details, manage status
- **Employees**: Track work hours, manage pay status
- **Expenses**: Record business expenses
- **Receipts**: Generate and manage receipts
- **Tools**: 
  - Price calculator
  - Timesheet generator
- Secure authentication (NextAuth)

**Tech Stack**:
- Next.js 14
- NextAuth.js (authentication)
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod validation
- API calls to Google Apps Script

**Environment Variables**:
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/.../dashboard.gs
NEXTAUTH_URL=https://admin.heavydetailing.com
NEXTAUTH_SECRET=your-secret-key
```

---

### GoogleScript (Backend)
**Purpose**: Backend API and automation using Google Apps Script

#### website.gs
- Receives form submissions from website
- Creates folder structure in Google Drive
- Generates client brief document
- Adds client to Master spreadsheet
- Sends confirmation emails
- Provides upload links

**Endpoint**: Standalone Web App

#### dashboard.gs
- Handles authentication (client login)
- Provides API for both dashboard & admin panel
- Manages client data CRUD operations
- Handles quote acceptance
- Manages comments & feedback
- Serves revision images
- Tracks expenses & revenue
- Employee management

**Endpoints**: Standalone Web App
- GET requests: `?action=login`, `?action=getAllClients`, etc.
- POST requests: JSON body with action

#### revision.gs
- Bound script (runs in spreadsheet context)
- Scans for new revision folders
- Updates Master sheet with revision links
- Sends email notifications to clients
- Attaches revision images to emails

**Trigger**: Manual (menu item) or can be time-based

---

## 🔄 Data Flow

### New Quote Request Flow
```
1. Client fills form on Website
   ↓
2. Form data → website.gs (POST)
   ↓
3. website.gs creates:
   - Google Drive folders
   - Brief document
   - Master sheet row
   - Sends emails
   ↓
4. Client receives:
   - Confirmation email
   - Upload link (if has files)
   - Access code
```

### Admin Review & Quote Flow
```
1. Admin views request in AdminPanel
   ↓
2. Admin creates estimate in Google Sheets
   ↓
3. Admin approves estimate (spreadsheet menu)
   ↓
4. Admin sends quote (spreadsheet menu)
   ↓
5. dashboard.gs generates PDF & sends email
   ↓
6. Client receives:
   - Quote PDF
   - Dashboard link
   - Accept button
```

### Client Interaction Flow
```
1. Client logs into Dashboard
   ↓
2. dashboard.gs authenticates (email + code)
   ↓
3. Client can:
   - View project status
   - Upload additional files
   - View & download revisions
   - Accept quote
   - Leave comments
   ↓
4. All interactions → dashboard.gs → Google Sheets
```

### Revision Flow
```
1. Designer uploads to Revisions/1/ folder
   ↓
2. Admin runs "Update Revisions" (spreadsheet menu)
   ↓
3. revision.gs:
   - Detects new folder
   - Updates Master sheet
   - Sends email with images
   ↓
4. Client receives:
   - Email with attachments
   - Dashboard notification
   - Link to view online
```

---

## 🗄️ Data Storage

### Google Sheets (Master Spreadsheet)
- **Master Sheet**: All client data (27 columns)
- **Comments Sheet**: Client feedback
- **Quote Sheet**: Quote line items
- **Expenses Sheet**: Business expenses

### Google Drive
```
Heavy D Master/
├── Clients/
│   └── [Client Name]/
│       └── [Company Name]/
│           └── [Service Name]/
│               ├── Brief - [Company] - [Service].doc
│               ├── Estimate Ready (or similar).xlsx
│               ├── Quote - [Client Name].pdf
│               ├── Receipt - [ID].pdf
│               ├── Uploads/
│               │   └── [client uploads here]
│               └── Revisions/
│                   ├── 1/
│                   │   └── [design files]
│                   ├── 2/
│                   └── 3/
│
└── Receipts/
    ├── 2024/
    │   ├── 01/
    │   └── 02/
    └── 2025/
        └── 01/
```

---

## 🔐 Security Model

### Public (No Auth Required)
- Website homepage & form
- Quote acceptance link (email-based)

### Client Auth (Email + Access Code)
- Dashboard login
- View own project only
- Upload to own folder
- Leave comments

### Admin Auth (NextAuth)
- AdminPanel full access
- View all clients
- Manage all data
- Run scripts

### Google Apps Script
- Runs as service account
- Has access to sheets & drive
- Handles permissions
- No direct DB access needed

---

## 🚀 Deployment Targets

### Vercel (Frontend)
- **Website**: Auto-deploy from `main` branch, `/Website` folder
- **Dashboard**: Auto-deploy from `main` branch, `/Dashboard` folder  
- **AdminPanel**: Auto-deploy from `main` branch, `/AdminPanel` folder

### Google Apps Script (Backend)
- **website.gs**: Manual deploy to standalone Web App
- **dashboard.gs**: Manual deploy to standalone Web App
- **revision.gs**: Bound to Master spreadsheet

---

## 📊 Key Metrics

### Performance
- Website: Lighthouse 95+ score
- Dashboard: < 2s load time
- AdminPanel: < 3s load time
- Apps Script: < 5s response time

### Scale
- Google Sheets: 10,000 rows limit (per sheet)
- Apps Script: 6 min/execution limit
- Gmail: 100 emails/day (free)
- Drive: 15 GB free storage

---

## 🔧 Technology Stack

### Frontend Framework
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Component library

### Backend
- **Google Apps Script**: JavaScript runtime
- **Google Sheets**: Database
- **Google Drive**: File storage
- **Gmail API**: Email sending

### Deployment
- **Vercel**: Frontend hosting
- **Google Cloud**: Apps Script hosting
- **GitHub**: Version control

### Authentication
- **NextAuth.js**: Admin authentication
- **Custom**: Client email + code auth

---

## 📝 Configuration Files

### Environment Variables (.env.local)
```env
# Website
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/.../exec

# Dashboard  
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/.../exec

# AdminPanel
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/.../exec
NEXTAUTH_URL=https://admin.heavydetailing.com
NEXTAUTH_SECRET=random-secret-here
```

### Google Apps Script Config
```javascript
// In dashboard.gs
const CONFIG = {
  SPREADSHEET_ID: 'your-sheet-id',
  RECEIPT_ROOT_FOLDER_ID: 'your-folder-id',
  NOTIFICATION_EMAIL: 'info@heavydetailing.com'
};
```

---

## 🎯 Development Workflow

### Local Development
```bash
# Work on Website
cd Website && npm run dev

# Work on Dashboard
cd Dashboard && pnpm dev

# Work on AdminPanel
cd AdminPanel && npm run dev
```

### Making Changes
```bash
# 1. Make changes locally
# 2. Test locally
# 3. Commit to GitHub
git add .
git commit -m "Description"
git push

# 4. Vercel auto-deploys!
# 5. For Google Scripts: manually copy to editor & redeploy
```

### Testing
```bash
# Run all tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Build check
npm run build
```

---

## 📞 Support & Maintenance

### Regular Tasks
- **Daily**: Monitor execution logs
- **Weekly**: Review new clients
- **Monthly**: Backup sheets, archive old data
- **Quarterly**: Review & update pricing

### Troubleshooting
1. Check Vercel deployment logs
2. Check Apps Script execution logs
3. Check browser console
4. Review recent changes in GitHub

### Updates
- **Frontend**: Push to GitHub → auto-deploy
- **Backend**: Copy to editor → redeploy
- **Content**: Update in Google Sheets

---

## ✅ Post-Cleanup Summary

**Deleted**:
- ❌ `AdminPanel/code.gs` (duplicate)
- ❌ `AdminPanel/Form/code.gs` (duplicate)
- ❌ `AdminPanel/Form/` folder (empty)
- ❌ `Dashboard/Code.gs` (duplicate)
- ❌ `Website/scripts/` folder (all 6 old versions)
- ❌ `AdminPanel/Update.2.9.4.prompt.txt` (old notes)
- ❌ `AdminPanel/GOOGLE_APPS_SCRIPT_SETUP.md` (old docs)
- ❌ `AdminPanel/SETUP_GUIDE.md` (old docs)
- ❌ `AdminPanel/QUICKSTART.md` (old docs)
- ❌ `AdminPanel/CLAUDE.md` (old notes)
- ❌ `AdminPanel/www.admin.heavyd.com` (unnecessary)
- ❌ `AdminPanel/test-boat-loading.html` (test file)

**Renamed**:
- ✅ `GoogleScript/code.gs` → `website.gs` (clarity)

**Created**:
- ✅ `README.md` (main documentation)
- ✅ `DEPLOYMENT.md` (step-by-step deployment)
- ✅ `GoogleScript/README.md` (script-specific guide)
- ✅ `PROJECT_STRUCTURE.md` (this file)

**Result**: Clean, organized, well-documented project! 🎉

