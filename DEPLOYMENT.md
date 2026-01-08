# Complete Deployment Guide - Heavy D Print & Design

This guide walks you through deploying all components of the Heavy D application from scratch.

## 📋 Prerequisites Checklist

- [ ] Google Account with Apps Script enabled
- [ ] GitHub account
- [ ] Vercel account (free tier is fine)
- [ ] Node.js 18+ installed
- [ ] npm/pnpm installed
- [ ] Git installed

---

## Part 1: Google Backend Setup (Do This First!)

### Step 1: Create Google Sheets

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: "Heavy D Master"
3. Create these sheets (tabs):
   - **Master** - Main client data
   - **Comments** - Client feedback
   - **Quote** - Quote items
   - **Expenses** - (Optional) Expense tracking

4. Setup Master sheet headers (Row 1):
   ```
   A: Timestamp
   B: Status
   C: Priority
   D: Name
   E: Company
   F: Email
   G: Phone
   H: Language
   I: Service
   J: Cost
   K: Price
   L: Drive Link
   M: Brief Link
   N: Spreadsheet ID
   O: Revision Link
   P: Access Code
   Q: Upload Link
   R: Quote PDF
   S: Receipt PDF
   T: Notes
   U: Last Revision #
   V: Total Hours
   W: Timesheet Link
   ```

5. Copy the Spreadsheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[THIS_IS_THE_SPREADSHEET_ID]/edit
   ```

### Step 2: Create Google Drive Folders

1. Go to [Google Drive](https://drive.google.com)
2. Create folder structure:
   ```
   Heavy D Master/
   ├── Clients/
   └── Receipts/
       ├── 2024/
       └── 2025/
   ```

3. Get folder IDs (right-click folder → Get link):
   - Heavy D Master: Save this
   - Receipts: Save this

### Step 3: Deploy website.gs

1. Go to https://script.google.com/
2. Click "New Project"
3. Name it: "HeavyD-Website-Form"
4. Delete default code
5. Copy entire contents of `GoogleScript/website.gs`
6. Paste into editor
7. **IMPORTANT**: Update line 279 (in `createClientFolderStructure` function):
   ```javascript
   const masterFolderName = "Heavy D Master"; // Your folder name
   ```
8. Save (Ctrl+S)
9. Click "Deploy" → "New deployment"
10. Settings:
    - Type: Web app
    - Description: "Production"
    - Execute as: **Me (your@email.com)**
    - Who has access: **Anyone**
11. Click "Deploy"
12. Click "Authorize access"
13. Choose your account
14. Click "Advanced" → "Go to HeavyD-Website-Form"
15. Click "Allow"
16. **COPY THE WEB APP URL** - Save as `WEBSITE_SCRIPT_URL`

### Step 4: Deploy dashboard.gs

1. Create new project: "HeavyD-Dashboard-API"
2. Copy entire contents of `GoogleScript/dashboard.gs`
3. **UPDATE CONFIG** (lines 7-15):
   ```javascript
   const CONFIG = {
     CLIENTS_SHEET: 'Master',
     COMMENTS_SHEET: 'Comments',
     QUOTE_SHEET: 'Quote',
     NOTIFICATION_EMAIL: 'info@heavydetailing.com', // Your email
     BUSINESS_NAME: 'Heavy D Print & Design',
     SPREADSHEET_ID: 'PASTE_YOUR_SPREADSHEET_ID_HERE',
     RECEIPT_ROOT_FOLDER_ID: 'PASTE_RECEIPTS_FOLDER_ID_HERE'
   };
   ```
4. Save
5. Deploy as Web App (same process as website.gs)
6. **COPY THE WEB APP URL** - Save as `DASHBOARD_SCRIPT_URL`

### Step 5: Setup revision.gs (Bound Script)

1. Open your "Heavy D Master" spreadsheet
2. Click Extensions → Apps Script
3. Rename "Code.gs" to "Revisions"
4. Delete default code
5. Copy entire contents of `GoogleScript/revision.gs`
6. Paste
7. Save
8. Add this code at top (to create menu):
   ```javascript
   function onOpen() {
     SpreadsheetApp.getUi()
       .createMenu('Heavy D')
       .addItem('🗂️ Update Revisions', 'updateRevisionLinksFromServiceFolder')
       .addToUi();
   }
   ```
9. Refresh your spreadsheet
10. You should see "Heavy D" menu in toolbar

### Step 6: Add QuoteAccepted.html

1. Go back to "HeavyD-Dashboard-API" project
2. Click + → HTML file
3. Name: "QuoteAccepted"
4. Copy contents from `GoogleScript/QuoteAccepted.html`
5. Save

---

## Part 2: Frontend Deployment

### Step 1: Prepare Repository

```bash
# Clone or initialize your repo
cd HeavyD

# If not already a git repo:
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/heavyd.git
git push -u origin main
```

### Step 2: Setup Environment Variables

Create these files (DON'T commit them):

**Website/.env.local**:
```env
NEXT_PUBLIC_GAS_ENDPOINT=PASTE_YOUR_WEBSITE_SCRIPT_URL_HERE
```

**Dashboard/.env.local**:
```env
NEXT_PUBLIC_GAS_ENDPOINT=PASTE_YOUR_DASHBOARD_SCRIPT_URL_HERE
```

**AdminPanel/.env.local**:
```env
NEXT_PUBLIC_GAS_ENDPOINT=PASTE_YOUR_DASHBOARD_SCRIPT_URL_HERE
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secret_with_openssl
```

Generate NextAuth secret:
```bash
openssl rand -base64 32
```

### Step 3: Test Locally

```bash
# Test Website
cd Website
npm install
npm run dev
# Open http://localhost:3000

# Test Dashboard
cd ../Dashboard
pnpm install
pnpm dev
# Open http://localhost:3000

# Test AdminPanel
cd ../AdminPanel
npm install
npm run dev
# Open http://localhost:3000
```

### Step 4: Deploy to Vercel

#### Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. You'll deploy 3 separate projects

#### Deploy Website

1. Select your repo
2. Project settings:
   - **Name**: heavyd-website (or your preference)
   - **Root Directory**: `Website`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: (leave default)
3. Environment Variables:
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_GAS_ENDPOINT` = `YOUR_WEBSITE_SCRIPT_URL`
4. Click "Deploy"
5. Wait for deployment to complete
6. Copy the production URL (e.g., `heavyd-website.vercel.app`)

#### Deploy Dashboard

1. Go back to Vercel dashboard
2. Click "Add New" → "Project"
3. Same repo, but change:
   - **Name**: heavyd-dashboard
   - **Root Directory**: `Dashboard`
4. Environment Variables:
   - `NEXT_PUBLIC_GAS_ENDPOINT` = `YOUR_DASHBOARD_SCRIPT_URL`
5. Deploy
6. Copy production URL

#### Deploy AdminPanel

1. New project again
2. Settings:
   - **Name**: heavyd-admin
   - **Root Directory**: `AdminPanel`
3. Environment Variables:
   - `NEXT_PUBLIC_GAS_ENDPOINT` = `YOUR_DASHBOARD_SCRIPT_URL`
   - `NEXTAUTH_URL` = `https://YOUR-ADMIN-DOMAIN.vercel.app`
   - `NEXTAUTH_SECRET` = `Your generated secret`
4. Deploy
5. Copy production URL

---

## Part 3: Setup Custom Domains (Optional)

### In Vercel

1. Go to each project
2. Settings → Domains
3. Add custom domain:
   - Website: `www.heavydetailing.com`
   - Dashboard: `clients.heavydetailing.com`
   - Admin: `admin.heavydetailing.com`

### In Domain Registrar

Add these DNS records:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: CNAME
Name: clients
Value: cname.vercel-dns.com

Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

Wait 5-10 minutes for DNS propagation.

### Update Environment Variables

After custom domains are working, update:

**AdminPanel Environment Variables** in Vercel:
```
NEXTAUTH_URL=https://admin.heavydetailing.com
```

---

## Part 4: Final Configuration

### Update Redirect URLs

In `GoogleScript/dashboard.gs`, find and update these URLs:
```javascript
// Line ~443 (in sendQuoteToClient function)
const acceptUrl = `https://script.google.com/macros/s/YOUR_DASHBOARD_SCRIPT_ID/exec?action=acceptEmail&email=${encodeURIComponent(clientEmail)}&accessCode=${encodeURIComponent(accessCode)}`;
const dashboardUrl = `https://clients.heavydetailing.com/?email=${encodeURIComponent(clientEmail)}&code=${encodeURIComponent(accessCode)}`;

// Line ~547 (in handleQuoteAcceptanceViaGet function)
const redirectUrl = `https://clients.heavydetailing.com/quote-accepted?email=${encodeURIComponent(email)}&accessCode=${encodeURIComponent(accessCode)}`;

// Line ~81 (in sendRevisionEmailFromRow function)
const dashboardUrl = `https://clients.heavydetailing.com/?email=${encodeURIComponent(email)}&code=${encodeURIComponent(accessCode)}`;
```

Re-deploy dashboard.gs script.

---

## Part 5: Testing Everything

### Test 1: Website Form Submission

1. Go to your website: `https://www.heavydetailing.com`
2. Fill out quote form
3. Submit
4. Check:
   - [ ] New row appears in Master sheet
   - [ ] Folder created in Drive
   - [ ] Brief document created
   - [ ] Email sent to your address

### Test 2: Admin Panel

1. Go to: `https://admin.heavydetailing.com`
2. Login (setup auth first if not done)
3. Check:
   - [ ] Can see all clients
   - [ ] Can view client details
   - [ ] Can update status

### Test 3: Client Dashboard

1. Get email and access code from Master sheet
2. Go to: `https://clients.heavydetailing.com/login`
3. Login with email and code
4. Check:
   - [ ] Dashboard loads
   - [ ] Shows correct client info
   - [ ] Can view uploads
   - [ ] Can leave comments

### Test 4: Revisions

1. Create folder: `[Client Service Folder]/Revisions/1/`
2. Upload test image
3. In Master sheet: Heavy D menu → Update Revisions
4. Check:
   - [ ] Script runs without errors
   - [ ] Email sent to client
   - [ ] Column O updated with folder link
   - [ ] Column U shows revision number

---

## 🎉 You're Done!

### Next Steps

1. **Setup Monitoring**: Check Vercel analytics and Apps Script execution logs
2. **Backup**: Export your Google Sheets regularly
3. **Documentation**: Share access codes with team
4. **Training**: Train team on admin panel

### URLs Summary

Save these for your records:
```
Website: https://www.heavydetailing.com
Dashboard: https://clients.heavydetailing.com
Admin: https://admin.heavydetailing.com

Google Sheet: [Your spreadsheet URL]
Website Script: [Your website script URL]
Dashboard Script: [Your dashboard script URL]
```

---

## 🔄 Making Updates

### Update Google Scripts
1. Edit file in `GoogleScript/` folder
2. Copy to Apps Script editor
3. Deploy → Manage deployments
4. Edit deployment → New version
5. Deploy

### Update Frontend
1. Make changes
2. Commit to GitHub:
   ```bash
   git add .
   git commit -m "Your update message"
   git push
   ```
3. Vercel auto-deploys!

---

## 🆘 Troubleshooting

### "Script function not found"
- Check function name in Apps Script
- Make sure script is saved
- Redeploy if needed

### Form submissions not working
- Verify script URL in Website/.env.local
- Check Apps Script execution logs
- Test script URL directly in browser

### Authentication errors
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Regenerate secret if needed

### Can't see clients in dashboard
- Verify spreadsheet ID in dashboard.gs
- Check script has permissions
- Test login with real access code

---

## 📞 Need Help?

1. Check Apps Script logs: script.google.com → Executions
2. Check Vercel logs: vercel.com → Your Project → Deployments
3. Check browser console (F12)
4. Review this guide again

**Email**: info@heavydetailing.com

---

## 🔐 Security Reminders

- ✅ Never commit .env.local files
- ✅ Keep script URLs private
- ✅ Use strong NEXTAUTH_SECRET
- ✅ Review Apps Script permissions
- ✅ Setup admin panel authentication
- ✅ Regularly review access logs

