# Quick Reference Guide - Heavy D

## 🚀 Quick Commands

### Local Development
```bash
# Website
cd Website && npm run dev          # http://localhost:3000

# Dashboard
cd Dashboard && pnpm dev           # http://localhost:3000

# AdminPanel
cd AdminPanel && npm run dev       # http://localhost:3000
```

### Deploy
```bash
# Frontend (auto via GitHub push)
git add .
git commit -m "Your message"
git push

# Backend (manual)
1. Edit GoogleScript/*.gs
2. Copy to Apps Script editor
3. Deploy → New version
```

---

## 📁 File Locations

### Google Apps Script Files
- `GoogleScript/website.gs` → Website form handler
- `GoogleScript/dashboard.gs` → API backend
- `GoogleScript/revision.gs` → Revision automation
- `GoogleScript/QuoteAccepted.html` → Confirmation page

### Configuration Files
- `Website/.env.local` → Website API endpoint
- `Dashboard/.env.local` → Dashboard API endpoint
- `AdminPanel/.env.local` → Admin API + auth secrets

### Documentation
- `README.md` → Project overview
- `DEPLOYMENT.md` → Full deployment guide
- `GoogleScript/README.md` → Script deployment details
- `PROJECT_STRUCTURE.md` → Architecture overview
- `QUICK_REFERENCE.md` → This file

---

## 🔗 Important URLs

### Production Sites
```
Website:   https://www.heavydetailing.com
Dashboard: https://clients.heavydetailing.com
Admin:     https://admin.heavydetailing.com
```

### Development
```
All three: http://localhost:3000 (run separately)
```

### Google Apps Script
```
Editor:    https://script.google.com/
Sheets:    https://sheets.google.com/
Drive:     https://drive.google.com/
```

---

## 🔑 Environment Variables Quick Reference

### Website
```env
NEXT_PUBLIC_GAS_ENDPOINT=<website-script-url>
```

### Dashboard
```env
NEXT_PUBLIC_GAS_ENDPOINT=<dashboard-script-url>
```

### AdminPanel
```env
NEXT_PUBLIC_GAS_ENDPOINT=<dashboard-script-url>
NEXTAUTH_URL=<your-admin-url>
NEXTAUTH_SECRET=<random-secret>
```

Generate secret:
```bash
openssl rand -base64 32
```

---

## 📊 Google Sheets Column Reference

### Master Sheet Quick Lookup
```
A: Timestamp          N: Spreadsheet ID
B: Status             O: Revision Link
C: Priority           P: Access Code ⭐
D: Name               Q: Upload Link
E: Company            R: Quote PDF
F: Email ⭐           S: Receipt PDF
G: Phone              T: Notes
H: Language           U: Last Revision #
I: Service            V: Total Hours
J: Cost               W: Timesheet Link
K: Price
L: Drive Link
M: Brief Link
```

⭐ = Used for client login

---

## 🎬 Common Tasks

### Add New Client (Manual)
1. Open Master sheet
2. Add row with:
   - Name, Email, Company, Service
   - Generate 4-digit Access Code (column P)
3. Create folders manually or wait for form

### Send Quote
1. Create estimate in Google Sheets
2. Master sheet → Menu → "Approve Estimate"
3. Master sheet → Menu → "Send Quote to Client"
4. Client receives email + PDF

### Update Revisions
1. Upload images to: `[Service Folder]/Revisions/1/`
2. Master sheet → Menu → "Update Revisions"
3. Script sends email to client

### Mark as Paid
1. Master sheet → Select row
2. Menu → "Paid Selected Row"
3. Receipt copied to Receipts folder

---

## 🐛 Troubleshooting Quick Fixes

### Form Not Submitting
```
1. Check browser console (F12)
2. Verify NEXT_PUBLIC_GAS_ENDPOINT in .env.local
3. Test script URL directly in browser
4. Check Apps Script logs
```

### Dashboard Login Fails
```
1. Verify email matches Master sheet (column F)
2. Verify access code matches (column P)
3. Check dashboard.gs SPREADSHEET_ID
4. Review Apps Script execution logs
```

### Revisions Not Showing
```
1. Check folder structure: Revisions/1/, Revisions/2/, etc.
2. Verify folder names are numbers only
3. Run "Update Revisions" from menu
4. Check column O has folder link
5. Check column U has revision number
```

### Admin Panel Not Loading
```
1. Check NEXT_PUBLIC_GAS_ENDPOINT
2. Verify NEXTAUTH_SECRET is set
3. Clear browser cache
4. Check Vercel deployment logs
```

---

## 📝 API Endpoints (dashboard.gs)

### GET Requests
```
?action=login
  &email=client@example.com
  &accessCode=1234

?action=getAllClients

?action=getFolderImages
  &folderId=abc123

?action=getExpenses

?action=getRevenue

?action=listRevisions
  &code=1234
```

### POST Requests
```javascript
// Accept quote
{
  "action": "accept",
  "email": "client@example.com",
  "accessCode": "1234"
}

// Submit comment
{
  "action": "comment",
  "name": "John Doe",
  "company": "ABC Inc",
  "email": "john@abc.com",
  "comment": "Looks great!",
  "accessCode": "1234"
}
```

---

## 🔧 Common Script Functions

### website.gs
```javascript
doPost(e)              // Receive form data
createClientFolderStructure()  // Create Drive folders
createClientBriefDoc()         // Create brief document
```

### dashboard.gs
```javascript
doGet(e)               // Handle GET requests
doPost(e)              // Handle POST requests
handleLogin()          // Authenticate client
getAllClients()        // Admin: get all clients
getFolderImages()      // Get revision images
handleQuoteAcceptance() // Accept quote
```

### revision.gs
```javascript
updateRevisionLinksFromServiceFolder()  // Main function
sendRevisionEmailFromRow()              // Send email
```

---

## 📦 Package Management

### Install Dependencies
```bash
# Website
cd Website && npm install

# Dashboard
cd Dashboard && pnpm install

# AdminPanel
cd AdminPanel && npm install
```

### Update Dependencies
```bash
npm update              # Update all
npm update package-name # Update specific
```

### Check for Issues
```bash
npm audit               # Security check
npm audit fix           # Auto-fix issues
```

---

## 🚨 Emergency Procedures

### Website Down
1. Check Vercel status: status.vercel.com
2. Check deployment logs in Vercel dashboard
3. Roll back to previous deployment if needed

### Script Errors
1. Open Apps Script editor
2. Click "Executions" to view logs
3. Find error in recent executions
4. Fix code and redeploy

### Data Loss
1. Google Sheets has version history
2. File → Version history → See version history
3. Restore previous version if needed

### Cannot Login to Dashboard
1. Verify Master sheet has correct email/code
2. Check Apps Script is deployed
3. Test script URL directly
4. Review execution logs

---

## 📞 Quick Support

### Check Logs
- **Vercel**: vercel.com → Project → Deployments → View logs
- **Apps Script**: script.google.com → Executions
- **Browser**: F12 → Console tab

### Common Log Locations
```bash
# Local development
Terminal where you ran npm run dev

# Production frontend
Vercel dashboard → Logs

# Backend
Google Apps Script → Executions

# Browser
F12 → Console
```

---

## ✅ Daily Checklist

### Morning
- [ ] Check for new quote requests
- [ ] Review any failed executions
- [ ] Check client comments

### As Needed
- [ ] Create estimates for approved quotes
- [ ] Send quotes to clients
- [ ] Upload revisions
- [ ] Update project statuses
- [ ] Generate receipts

### End of Day
- [ ] Update status for completed work
- [ ] Log time entries
- [ ] Review tomorrow's tasks

---

## 🎯 Status Flow

```
New
  ↓ (create estimate)
Estimate Ready
  ↓ (approve estimate)
Estimate Approved
  ↓ (send quote)
Quote Sent
  ↓ (client accepts)
Quote Accepted
  ↓ (start work)
In Progress
  ↓ (complete work)
Completed
  ↓ (send receipt)
Receipt Sent
  ↓ (payment received)
Paid
```

---

## 🔄 Version Control

### Before Making Changes
```bash
git pull origin main
git checkout -b feature/your-feature-name
```

### After Making Changes
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

### Create Pull Request
1. Go to GitHub
2. Create PR from your branch
3. Review changes
4. Merge to main
5. Vercel auto-deploys

---

## 💡 Pro Tips

1. **Use Menu Items**: All scripts have menu shortcuts in Master sheet
2. **Check Logs First**: 90% of issues show in execution logs
3. **Test Locally**: Always test changes locally before deploying
4. **Backup Sheets**: Export Master sheet weekly
5. **Clear Cache**: Hard refresh (Ctrl+Shift+R) fixes many issues
6. **Check Quotas**: Monitor Gmail (100/day) and Drive space
7. **Update Docs**: Keep this file updated with changes

---

## 📚 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Last Updated**: Today
**Version**: 1.0 (Clean & Organized)

