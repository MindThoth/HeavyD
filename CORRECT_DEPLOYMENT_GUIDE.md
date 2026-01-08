# ✅ Correct Google Apps Script Deployment

## 🚨 Problem with Current Deployment

You deployed ALL .gs files to ONE project. This causes conflicts because:
- `website.gs` has `doPost()` and `doGet()`
- `dashboard.gs` ALSO has `doPost()` and `doGet()`
- Only one will work, the other is ignored!

## ✅ Correct Approach: 3 Separate Deployments

You need **3 separate Google Script projects**:

---

## 📝 Deployment 1: Website Form Handler

**Purpose**: Receives form submissions from website

### Steps:
1. Go to https://script.google.com/
2. Click **New Project**
3. Name it: **"HeavyD-Website-Form"**
4. Delete default code
5. Copy **ONLY** the contents of `GoogleScript/website.gs`
6. Paste into editor
7. **Update Line 28**: Change spreadsheet ID to yours:
   ```javascript
   const spreadsheet = SpreadsheetApp.openById("YOUR_MASTER_SPREADSHEET_ID");
   ```
8. **Update Line 304**: Verify your Drive folder name:
   ```javascript
   const masterFolderName = "Heavy D Master";
   ```
9. Save (Ctrl+S)
10. Deploy → New deployment
    - Type: **Web app**
    - Execute as: **Me**
    - Who has access: **Anyone**
11. Copy the deployment URL

**Use this URL in**: `Website/.env.local`
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

---

## 📝 Deployment 2: Dashboard & Admin API

**Purpose**: Handles dashboard and admin panel requests

### Steps:
1. Create **NEW project**: **"HeavyD-Dashboard-API"**
2. Copy **ONLY** the contents of `GoogleScript/dashboard.gs`
3. **Update CONFIG** (lines 7-15):
   ```javascript
   const CONFIG = {
     CLIENTS_SHEET: 'Master',
     COMMENTS_SHEET: 'Comments',
     QUOTE_SHEET: 'Quote',
     NOTIFICATION_EMAIL: 'info@heavydetailing.com',
     BUSINESS_NAME: 'Heavy D Print & Design',
     SPREADSHEET_ID: 'YOUR_MASTER_SPREADSHEET_ID_HERE',
     RECEIPT_ROOT_FOLDER_ID: 'YOUR_RECEIPTS_FOLDER_ID_HERE'
   };
   ```
4. Save
5. Deploy → New deployment
    - Type: **Web app**
    - Execute as: **Me**
    - Who has access: **Anyone**
6. Copy the deployment URL

**Use this URL in**:
- `Dashboard/.env.local`
- `AdminPanel/.env.local`
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

---

## 📝 Deployment 3: Spreadsheet Functions (Bound Scripts)

**Purpose**: Functions that run inside your Master spreadsheet

### Steps:
1. Open your **Master Google Spreadsheet**
2. Extensions → Apps Script
3. You'll see existing bound scripts
4. Create **new file** (+ icon): **"AdminPanel"**
5. Copy contents of `GoogleScript/adminpanel.gs`
6. Paste
7. Create **new file**: **"Revisions"**
8. Copy contents of `GoogleScript/revision.gs`
9. Paste
10. **Add menu function** at the top of any file:
    ```javascript
    function onOpen() {
      SpreadsheetApp.getUi()
        .createMenu('Heavy D')
        .addItem('🧮 Generate Estimation', 'triggerEstimation')
        .addItem('✅ Approve First Estimate', 'approveThisEstimate')
        .addItem('📋 Approve All Estimates', 'approveAllEstimates')
        .addItem('📤 Send Quote to Client', 'sendQuoteToClient')
        .addItem('🎉 Client Approved', 'clientApprovedQuote')
        .addItem('🗂️ Update Revisions', 'updateRevisionLinksFromServiceFolder')
        .addItem('🧾 Send Receipt', 'sendReceiptToClient')
        .addItem('💵 Paid Selected Row', 'markActiveRowAsPaid')
        .addSeparator()
        .addItem('🙈 Hide Paid Rows', 'hidePaidRows')
        .addItem('👀 Show Paid Rows', 'showPaidRows')
        .addToUi();
    }
    ```
11. Save
12. Refresh your spreadsheet
13. You'll see **"Heavy D"** menu in toolbar

**Note**: These are NOT deployed as Web Apps! They run inside the spreadsheet.

---

## 📊 Deployment Summary

| What | Project Name | Contains | Deploy As | Used By |
|------|-------------|----------|-----------|---------|
| **Form Handler** | HeavyD-Website-Form | `website.gs` | Web App | Website |
| **API Backend** | HeavyD-Dashboard-API | `dashboard.gs` | Web App | Dashboard + AdminPanel |
| **Spreadsheet Functions** | Bound to Master Sheet | `adminpanel.gs` + `revision.gs` | Bound Script | Master Sheet Menu |

---

## 🧪 Testing Each Deployment

### Test 1: Website Form Handler
```bash
# Open in browser:
https://script.google.com/macros/s/YOUR_WEBSITE_SCRIPT_ID/exec

# Should see:
{
  "result": "success",
  "message": "Google Apps Script is working! Use POST method to submit form data."
}
```

### Test 2: Dashboard API
```bash
# Open in browser:
https://script.google.com/macros/s/YOUR_DASHBOARD_SCRIPT_ID/exec?action=getAllClients

# Should see list of clients (or error if no authentication)
```

### Test 3: Spreadsheet Functions
1. Open Master spreadsheet
2. Look for **"Heavy D"** menu in toolbar
3. Click any menu item
4. Should execute without errors

---

## 🔧 What to Do Now

### Step 1: Delete Your Current Deployment
Since you put everything in one project, you need to start fresh:

1. Go to your deployed project (the one with all files)
2. Deploy → Manage deployments
3. Archive the current deployment
4. Or just leave it and create new separate projects

### Step 2: Create 3 Separate Deployments
Follow the instructions above for each deployment.

### Step 3: Update Environment Variables

**Website** (.env.local):
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/WEBSITE_SCRIPT_ID/exec
```

**Dashboard** (.env.local):
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/DASHBOARD_SCRIPT_ID/exec
```

**AdminPanel** (.env.local):
```env
NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/DASHBOARD_SCRIPT_ID/exec
NEXTAUTH_URL=https://your-admin-url.com
NEXTAUTH_SECRET=your-secret-here
```

### Step 4: Update in Vercel (if deployed)
1. Go to each Vercel project
2. Settings → Environment Variables
3. Update `NEXT_PUBLIC_GAS_ENDPOINT`
4. Redeploy each app

---

## 🎯 Why Separate Deployments?

1. **Different Functions**: Each script serves a different purpose
2. **Different Endpoints**: Website needs one URL, Dashboard needs another
3. **No Conflicts**: Each can have its own `doPost()` without interference
4. **Better Security**: Can control permissions separately
5. **Easier Debugging**: Logs are separate for each function
6. **Better Organization**: Clear separation of concerns

---

## 📋 Quick Checklist

After correct deployment:

- [ ] Website script deployed separately (has doPost for forms)
- [ ] Dashboard script deployed separately (has doPost for API)
- [ ] Spreadsheet scripts added as bound scripts
- [ ] Website .env.local updated with website script URL
- [ ] Dashboard .env.local updated with dashboard script URL
- [ ] AdminPanel .env.local updated with dashboard script URL
- [ ] Vercel environment variables updated (if using Vercel)
- [ ] Form submission tested successfully
- [ ] Dashboard login tested successfully
- [ ] Spreadsheet menu functions tested

---

## 🆘 Still Confused?

Think of it like this:

**Website Form** → needs its own POST endpoint → `website.gs` deployed alone
**Dashboard/Admin** → needs its own GET/POST endpoint → `dashboard.gs` deployed alone
**Spreadsheet Menu** → runs inside sheet → `adminpanel.gs` + `revision.gs` as bound scripts

All three work together but are deployed separately!

---

**Your Current Deployment ID**: 
```
AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g
```
☝️ This won't work correctly because all scripts are mixed together.

**What You Need**: 
- 3 separate projects with separate deployment IDs
- Each doing one specific job
- Working together as a system

---

Need help with any step? Let me know!

