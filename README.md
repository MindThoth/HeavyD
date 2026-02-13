# Heavy D Print & Design - Full Stack Application

This is the complete Heavy D Print & Design web application with Admin Panel, Client Dashboard, Website, and Google Apps Script integration.

## 🔗 Google Apps Script (one deployment)

**Deployment ID:** `AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g`

**Web app URL:**  
`https://script.google.com/macros/s/AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g/exec`

Use this same URL for `NEXT_PUBLIC_GAS_ENDPOINT` in Website and AdminPanel (see each folder’s `.env.example`).

## 📁 Project Structure

```
HeavyD-master/
├── AdminPanel/          # Admin dashboard — admin.heavydetailing.com (Next.js)
├── Dashboard/           # Client dashboard — clients.heavydetailing.com (Next.js)
├── Website/             # Public website — heavydetailing.com (Next.js)
└── GoogleScript/        # Backend
    ├── main.gs          # Single doGet/doPost router (Main Heavy D deployment)
    ├── website.gs        # Form submission → sheet + Drive + email
    ├── dashboard.gs      # Client/dashboard API
    ├── adminpanel.gs     # Admin Panel: web app API + spreadsheet menu (single script)
    ├── revision.gs      # Revision updates and emails
    └── QuoteAccepted.html
```

**GitHub and domains**: One repo, multiple apps. Point domains in Vercel (or your host) to each folder: e.g. heavydetailing.com → Website, admin.heavydetailing.com → AdminPanel, clients.heavydetailing.com → Dashboard.

## 📤 Upload to GitHub

1. **Create a new repo on GitHub** (e.g. `HeavyD` or `heavyd-detailing`) — do *not* add a README or .gitignore (this project already has them).

2. **In this folder, run:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Heavy D full stack (Website, AdminPanel, Dashboard, GoogleScript)"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

3. **Secrets:** `.env` and `.env.local` are in `.gitignore` and will not be pushed. Set `NEXT_PUBLIC_GAS_ENDPOINT` (and any other env vars) in your host (e.g. Vercel) or in a local `.env.local` after cloning.

## 🚀 Deployment Overview

### Frontend Applications (Vercel)
- **Website**: Public-facing quote request form
- **Dashboard**: Client portal for viewing project status
- **AdminPanel**: Internal admin panel for managing clients

### Backend (Google Apps Script)
- Manages all data in Google Sheets
- Handles file storage in Google Drive
- Sends automated emails via Gmail
- Provides REST API endpoints for frontend apps

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Google Account with Apps Script access
- Vercel account (for deployment)
- GitHub account (for version control)

## 🔧 Setup Instructions

### 1. Google Apps Script Setup

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project for each script:

#### Website Script
- Create new project named "HeavyD-Website"
- Copy contents of `GoogleScript/website.gs`
- Deploy as Web App:
  - Execute as: Me
  - Who has access: Anyone
- Copy the deployment URL

#### Dashboard Script
- Create new project named "HeavyD-Dashboard"
- Copy contents of `GoogleScript/dashboard.gs`
- Deploy as Web App:
  - Execute as: Me
  - Who has access: Anyone
- Copy the deployment URL

#### Admin Script (combined)
- The dashboard.gs handles admin panel requests too
- Or create separate project if you want isolated permissions

#### Revision Script (standalone)
- This can be added as a function in your main Master spreadsheet
- Copy contents of `GoogleScript/revision.gs`
- Add as bound script to your Google Sheet
- Run `updateRevisionLinksFromServiceFolder()` from menu

### 2. Google Sheets Setup

Create a spreadsheet with these sheets:
- **Master**: Main client data (columns A-W)
- **Comments**: Client feedback and comments
- **Quote**: Quote items and pricing
- **Expenses**: Business expenses tracking

Update the `SPREADSHEET_ID` in `GoogleScript/dashboard.gs`:
```javascript
SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE'
```

### 3. Google Drive Setup

Create folder structure:
```
Heavy D Master/
├── Clients/
│   └── [Client Name]/
│       └── [Company Name]/
│           └── [Service Name]/
│               ├── Uploads/
│               ├── Revisions/
│               └── Brief Document
```

### 4. Frontend Setup

#### Website
```bash
cd Website
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_WEBSITE_SCRIPT_ID/exec
```

#### Dashboard
```bash
cd Dashboard
pnpm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_DASHBOARD_SCRIPT_ID/exec
```

#### AdminPanel
```bash
cd AdminPanel
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_DASHBOARD_SCRIPT_ID/exec
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here
```

Generate NextAuth secret:
```bash
openssl rand -base64 32
```

### 5. Deploy to Vercel

#### Option A: Via GitHub (Recommended)
1. Push your code to GitHub (each folder separately or monorepo)
2. Connect Vercel to your GitHub repository
3. Deploy each app separately:
   - Website: `/Website`
   - Dashboard: `/Dashboard`
   - AdminPanel: `/AdminPanel`
4. Add environment variables in Vercel dashboard

#### Option B: Via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Website
cd Website
vercel --prod

# Deploy Dashboard
cd ../Dashboard
vercel --prod

# Deploy AdminPanel
cd ../AdminPanel
vercel --prod
```

## 🔄 Workflow

### Client Quote Request Flow
1. Client submits form on **Website**
2. `website.gs` receives data via POST
3. Creates folder structure in Google Drive
4. Creates brief document
5. Adds row to Master sheet
6. Sends confirmation email with upload link

### Admin Review & Quote Flow
1. Admin reviews request in **AdminPanel**
2. Manually create estimate using Google Sheets
3. Run "Approve Estimate" from menu in Master sheet
4. Run "Send Quote to Client" from menu
5. `dashboard.gs` handles quote acceptance

### Client Dashboard Flow
1. Client receives email with access code
2. Logs into **Dashboard** with email + code
3. Views project status, uploads files, leaves comments
4. Receives revision notifications
5. Views and downloads final files

### Revision Management Flow
1. Designer uploads revisions to Drive (in numbered folders)
2. Run "Update Revisions" from Master sheet menu
3. `revision.gs` detects new folders
4. Sends email to client with dashboard link
5. Client views revisions in **Dashboard**

## 📊 Google Sheets Column Reference

### Master Sheet (A-W)
- A: Timestamp
- B: Status (New, Estimate Ready, Quote Sent, Quote Accepted, In Progress, Completed, Paid)
- C: Priority
- D: Client Name
- E: Company Name
- F: Email
- G: Phone
- H: Language (fr/en)
- I: Service Type
- J: Cost (calculated from Estimation)
- K: Price (calculated from Estimation)
- L: Drive Folder Link
- M: Brief Document Link
- N: Spreadsheet ID (Estimation file)
- O: Revision Folder Link
- P: Access Code (4-digit number)
- Q: Upload Folder Link
- R: Quote PDF Link
- S: Receipt PDF Link
- T: Notes
- U: Last Revision Number
- V: Total Hours (auto-calculated)
- W: Timesheet Link

## 🔐 Security Notes

- Never commit `.env.local` files
- Keep Google Apps Script deployment IDs private
- Use environment variables for all sensitive data
- NextAuth secret should be strong and unique
- Admin panel should have authentication (NextAuth configured)

## 🐛 Troubleshooting

### Form submissions not working
- Check Google Apps Script deployment URL
- Verify CORS is enabled in Apps Script (it is by default)
- Check browser console for errors
- Test the script URL directly in browser

### Dashboard not loading data
- Verify NEXT_PUBLIC_GAS_ENDPOINT is correct
- Check spreadsheet ID in dashboard.gs
- Ensure Apps Script has permissions to read sheets

### Emails not sending
- Verify Gmail quotas (100 emails/day for free accounts)
- Check email address in CONFIG
- Review Apps Script logs for errors

## 📝 Development

### Run locally
```bash
# Website
cd Website && npm run dev

# Dashboard  
cd Dashboard && pnpm dev

# AdminPanel
cd AdminPanel && npm run dev
```

### Build for production
```bash
npm run build
```

## 🔄 Updates & Maintenance

### Updating Google Scripts
1. Edit files in `GoogleScript/` folder
2. Copy updated content to Apps Script editor
3. Deploy new version
4. No changes needed in frontend if API stays same

### Updating Frontend
1. Make changes to code
2. Commit to GitHub
3. Vercel auto-deploys (if connected)
4. Or use `vercel --prod` to manually deploy

## 📞 Support

For issues or questions:
- Email: info@heavydetailing.com
- Review Apps Script logs in Google Apps Script dashboard
- Check Vercel deployment logs
- Review browser console for frontend errors

## 📄 License

Proprietary - Heavy D Print & Design

