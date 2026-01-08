# 🚨 Website Form Fix - URGENT ACTION REQUIRED

## What Happened?

During the cleanup, I accidentally deleted the **website form handler script** thinking it was a duplicate. The current `website.gs` file only contained **admin functions** (estimation, quotes, receipts), NOT the form submission handler.

## ✅ What I Fixed

1. **Restored the form handler**: Created proper `GoogleScript/website.gs` with `doPost()` and `doGet()` functions
2. **Separated admin functions**: Renamed old file to `GoogleScript/adminpanel.gs`
3. **Updated website**: Now uses environment variable for script URL

## 📁 Current GoogleScript Folder Structure

```
GoogleScript/
├── website.gs           ✅ NEW - Handles website form submissions
├── adminpanel.gs        ✅ RENAMED - Admin functions (estimation, quotes, receipts)
├── dashboard.gs         ✅ Same - Client dashboard & admin panel API
├── revision.gs          ✅ Same - Revision automation
└── QuoteAccepted.html   ✅ Same - Confirmation page
```

## 🚀 DEPLOYMENT STEPS (CRITICAL!)

### Step 1: Deploy website.gs (FORM HANDLER)

1. Go to https://script.google.com/
2. Create new project: **"HeavyD-Website-Form"**
3. Delete default code
4. Copy **entire contents** of `GoogleScript/website.gs`
5. Paste into editor
6. **IMPORTANT**: Line 28 - verify spreadsheet ID:
   ```javascript
   const spreadsheet = SpreadsheetApp.openById("1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU");
   ```
   ☝️ Make sure this is YOUR Master spreadsheet ID!

7. **IMPORTANT**: Line 304 - verify folder name:
   ```javascript
   const masterFolderName = "Heavy D Master";
   ```
   ☝️ Make sure this matches your Drive folder name!

8. Save (Ctrl+S)
9. Click **Deploy** → **New deployment**
10. Settings:
    - Type: **Web app**
    - Description: "Production Form Handler"
    - Execute as: **Me (your@email.com)**
    - Who has access: **Anyone**
11. Click **Deploy**
12. Grant permissions when prompted
13. **COPY THE WEB APP URL** ⭐ (looks like: `https://script.google.com/macros/s/ABC.../exec`)

### Step 2: Update Website Environment Variable

**Option A: Local Development**
```bash
cd Website
# Create .env.local file
echo "NEXT_PUBLIC_GAS_ENDPOINT=YOUR_WEB_APP_URL_HERE" > .env.local
```

**Option B: Vercel (Production)**
1. Go to your Vercel project (Website)
2. Settings → Environment Variables
3. Add new variable:
   - **Name**: `NEXT_PUBLIC_GAS_ENDPOINT`
   - **Value**: Your Web App URL from Step 1
   - **Environment**: Production, Preview, Development
4. Save
5. Redeploy your site (Vercel → Deployments → Redeploy)

### Step 3: Optional - Deploy adminpanel.gs

The `adminpanel.gs` file contains functions that run INSIDE your Google Sheet (bound script):

1. Open your **Master Google Spreadsheet**
2. Extensions → Apps Script
3. You should already have bound scripts here
4. **EITHER**:
   - Add `adminpanel.gs` functions to existing script
   - **OR** just keep using the existing menu functions (they're already working)

**Note**: This is NOT urgent - only if you want to reorganize your spreadsheet scripts.

---

## 🧪 Testing the Fix

### Test 1: Form Submission
1. Go to your website (local or production)
2. Fill out the quote form
3. Submit
4. Check browser console (F12) - should see "Standard fetch successful"
5. Check Master sheet - new row should appear
6. Check Drive - new folder structure should be created
7. Check email - should receive confirmation

### Test 2: Verify Script is Working
1. Open your deployed script URL in browser:
   `https://script.google.com/macros/s/YOUR_ID/exec`
2. You should see:
   ```json
   {
     "result": "success",
     "message": "Google Apps Script is working! Use POST method to submit form data."
   }
   ```

### Test 3: Check Logs
1. Go to Apps Script editor
2. Click **Executions** (left sidebar)
3. Submit a test form
4. Check for successful execution

---

## 🔍 How the Form Flow Works

```
1. Client fills form on Website
   ↓
2. Form submits to → website.gs doPost()
   ↓
3. website.gs creates:
   ✓ Folder structure in Drive: [Client]/[Company]/[Service]/
   ✓ Subfolders: Uploads/ and Revisions/
   ✓ Brief document with form data
   ✓ Row in Master sheet with all info
   ✓ Access code (4-digit random number)
   ↓
4. Emails sent:
   ✓ Admin: notification with all details
   ✓ Client: welcome email with upload link
   ↓
5. Returns success with:
   ✓ Upload link
   ✓ Execution ID
```

---

## 🐛 Troubleshooting

### Form still not working?

**Check 1: Script URL**
```javascript
// In Website/app/page.tsx line 442-443
// Make sure it's using environment variable or correct hardcoded URL
const scriptURL = process.env.NEXT_PUBLIC_GAS_ENDPOINT || "..."
```

**Check 2: Environment Variable**
```bash
# Print environment variables (local)
cd Website
npm run dev
# Check console output - should show loaded .env.local
```

**Check 3: Vercel Environment**
```bash
# In Vercel dashboard:
Settings → Environment Variables
# Make sure NEXT_PUBLIC_GAS_ENDPOINT is set
# Redeploy if you just added it
```

**Check 4: CORS Errors**
```
// If you see CORS errors in browser console:
1. Make sure script is deployed as "Anyone" can access
2. Check createCORSResponse() function is present in website.gs
3. Try accessing script URL directly in browser
```

**Check 5: Script Permissions**
```
1. Open Apps Script editor
2. Run any function manually (e.g., doGet)
3. Grant permissions when prompted
4. Re-test form submission
```

### Form submits but nothing happens?

**Check Apps Script Logs:**
1. Apps Script editor → Executions
2. Find recent execution
3. Check for errors
4. Common issues:
   - Wrong spreadsheet ID
   - Drive folder doesn't exist
   - Permission issues

**Common Errors & Fixes:**

| Error | Fix |
|-------|-----|
| "Cannot find folder 'Heavy D Master'" | Create folder in Drive or update line 304 in script |
| "Cannot find spreadsheet" | Update spreadsheet ID on line 28 |
| "Permission denied" | Run script manually once to grant permissions |
| "Duplicate submission" | Normal - script prevents duplicates within 5 minutes |

---

## 📋 Quick Reference

### File Purposes

| File | Purpose | Deploy To |
|------|---------|-----------|
| `website.gs` | Website form handler | Standalone Web App |
| `adminpanel.gs` | Admin functions (optional) | Bound to Master sheet |
| `dashboard.gs` | Dashboard/Admin API | Standalone Web App |
| `revision.gs` | Revision automation | Bound to Master sheet |

### Environment Variables

| App | Variable | Value |
|-----|----------|-------|
| Website | `NEXT_PUBLIC_GAS_ENDPOINT` | website.gs deployment URL |
| Dashboard | `NEXT_PUBLIC_GAS_ENDPOINT` | dashboard.gs deployment URL |
| AdminPanel | `NEXT_PUBLIC_GAS_ENDPOINT` | dashboard.gs deployment URL |

### Deployment URLs

```
Website Form Handler:  https://script.google.com/macros/s/.../exec (website.gs)
Dashboard API:         https://script.google.com/macros/s/.../exec (dashboard.gs)
```

---

## ✅ Success Checklist

After deploying, verify:

- [ ] Script deployed successfully
- [ ] Environment variable set (local or Vercel)
- [ ] Form submits without errors
- [ ] New row appears in Master sheet
- [ ] Folders created in Drive
- [ ] Brief document created
- [ ] Admin email received
- [ ] Client email received (if email provided)

---

## 🆘 Still Having Issues?

1. **Check Execution Logs**: Apps Script → Executions
2. **Check Browser Console**: F12 → Console tab
3. **Check Vercel Logs**: Vercel Dashboard → Logs
4. **Test Script Directly**: Open script URL in browser
5. **Verify Permissions**: Run script function manually in editor

---

## 📞 Quick Support Commands

```bash
# Test locally
cd Website && npm run dev

# Check if .env.local exists
cd Website && ls -la .env.local

# Rebuild and deploy
cd Website && npm run build

# Check Vercel environment
# Go to: https://vercel.com → Your Project → Settings → Environment Variables
```

---

**Priority**: 🔥 HIGH - Form submissions are currently broken
**Time to Fix**: 10-15 minutes following this guide
**Risk**: None - This only adds missing functionality

---

Last Updated: Now
Created: Today (after discovering the issue)

