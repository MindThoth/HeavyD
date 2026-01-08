# Google Apps Script Deployment Guide

This folder contains all Google Apps Script files that power the Heavy D backend.

## 📁 Files Overview

### website.gs
**Purpose**: Handles website form submissions and creates client folders/briefs

**Deploy to**: Standalone Web App

**Functions**:
- `doPost(e)` - Receives form data from website
- `doGet(e)` - Test endpoint
- `createClientFolderStructure()` - Creates Drive folders
- `createClientBriefDoc()` - Creates Google Doc with form responses

**Deployment Steps**:
1. Go to https://script.google.com/
2. Create new project: "HeavyD-Website-Form"
3. Copy entire contents of `website.gs`
4. Click Deploy → New deployment
5. Type: Web app
6. Execute as: Me
7. Who has access: Anyone
8. Click Deploy
9. Copy Web app URL
10. Update `NEXT_PUBLIC_GAS_ENDPOINT` in Website/.env.local

**Configuration Required**:
- Master folder ID (line 262): `Heavy D Master` folder
- Update folder structure as needed

---

### dashboard.gs
**Purpose**: Handles client dashboard and admin panel API requests

**Deploy to**: Standalone Web App

**Functions**:
- `doGet(e)` - Handles all GET requests (login, getAllClients, etc.)
- `doPost(e)` - Handles POST requests (quote acceptance, comments, etc.)
- `handleLogin()` - Client authentication
- `getAllClients()` - Admin: fetch all clients
- `getFolderImages()` - Fetch revision images from Drive
- `handleQuoteAcceptance()` - Mark quote as accepted
- `handleComment()` - Save client comments
- `getExpenses()` / `getRevenue()` - Financial data

**Deployment Steps**:
1. Create new project: "HeavyD-Dashboard-API"
2. Copy entire contents of `dashboard.gs`
3. **UPDATE CONFIG** (lines 7-15):
   ```javascript
   SPREADSHEET_ID: 'YOUR_MASTER_SPREADSHEET_ID'
   RECEIPT_ROOT_FOLDER_ID: 'YOUR_RECEIPTS_FOLDER_ID'
   ```
4. Deploy → New deployment
5. Type: Web app
6. Execute as: Me
7. Who has access: Anyone
8. Copy Web app URL
9. Update in both:
   - Dashboard/.env.local
   - AdminPanel/.env.local

**Required Sheets**:
- Master (main client data)
- Comments (client feedback)
- Quote (quote line items)
- Expenses (optional, for financial tracking)

**Column Mapping** (Master Sheet):
- A: Timestamp
- B: Status
- C-D: Reserved
- D: Name (column 3 in code)
- E: Company (column 4)
- F: Email (column 5)
- G: Phone (column 6)
- H: Language (column 7)
- I: Service (column 8)
- J: Cost (column 9)
- K: Price (column 10)
- L: Drive Folder Link (column 11)
- M: Brief Link (column 12)
- N: Spreadsheet ID (column 13)
- O: Revision Folder Link (column 14)
- P: Access Code (column 15)
- Q: Upload Folder Link (column 16)
- R: Quote PDF URL (column 17)
- S: Receipt PDF URL (column 18)

---

### revision.gs
**Purpose**: Scans for new revisions and emails clients

**Deploy to**: Bound to Master Spreadsheet

**Functions**:
- `updateRevisionLinksFromServiceFolder()` - Main function, scans all clients
- `sendRevisionEmailFromRow()` - Sends email with attachments

**Setup Steps**:
1. Open your Master Google Spreadsheet
2. Extensions → Apps Script
3. Create new script file: "Revisions"
4. Copy entire contents of `revision.gs`
5. Save
6. Add custom menu to Master sheet (optional):
   ```javascript
   function onOpen() {
     SpreadsheetApp.getUi()
       .createMenu('Heavy D')
       .addItem('🗂️ Update Revisions', 'updateRevisionLinksFromServiceFolder')
       .addToUi();
   }
   ```

**How to Use**:
1. Upload revision images to: `[Client Folder]/[Service]/Revisions/1/`
2. Run "Update Revisions" from menu
3. Script detects new folder "1"
4. Sends email to client with images attached
5. Updates columns O and U in Master sheet

**Folder Structure Required**:
```
[Service Folder]/
├── Uploads/
├── Revisions/
│   ├── 1/          ← First revision
│   │   ├── design1.jpg
│   │   └── design2.jpg
│   ├── 2/          ← Second revision
│   │   └── design-v2.jpg
```

---

### QuoteAccepted.html
**Purpose**: Confirmation page shown after quote acceptance

**Deploy to**: Same project as dashboard.gs

**Setup**:
1. In "HeavyD-Dashboard-API" project
2. File → New → HTML file
3. Name: "QuoteAccepted"
4. Copy contents from `QuoteAccepted.html`
5. No separate deployment needed
6. Used by `handleAcceptEmail()` function

---

## 🔄 Complete Deployment Workflow

### Initial Setup
1. Deploy `website.gs` → Get URL A
2. Deploy `dashboard.gs` → Get URL B  
3. Add `revision.gs` to Master sheet
4. Update frontend .env files with URLs
5. Test each endpoint

### Making Updates

**Updating website.gs**:
```bash
1. Edit GoogleScript/website.gs
2. Copy to Apps Script editor
3. Deploy → Manage deployments
4. Click edit (pencil icon)
5. Version: New version
6. Deploy
```

**Updating dashboard.gs**:
```bash
Same process as website.gs
No need to update frontend if API unchanged
```

**Updating revision.gs**:
```bash
1. Edit GoogleScript/revision.gs
2. Open Master sheet → Extensions → Apps Script
3. Find Revisions.gs file
4. Paste new code
5. Save (Ctrl+S)
```

---

## 🧪 Testing

### Test website.gs
```bash
# In browser or Postman
POST https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "company": "Test Co",
  "service": "logo-design"
}
```

### Test dashboard.gs
```bash
# Login test
GET https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=login&email=client@example.com&accessCode=1234

# Get all clients (admin)
GET https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getAllClients
```

### Test revision.gs
```bash
1. Create test revision folder in Drive
2. Run function from Apps Script editor
3. Check execution logs
4. Verify email sent
```

---

## 🔐 Permissions

When first running scripts, Google will ask for permissions:

**Required Permissions**:
- View and manage spreadsheets
- View and manage Drive files
- Send emails as you
- Connect to external service (for web app)

**Grant permissions**:
1. Click "Review Permissions"
2. Choose your Google account
3. Click "Advanced" → "Go to [Project Name]"
4. Click "Allow"

---

## 🐛 Debugging

### View Logs
```bash
1. Open Apps Script editor
2. Click "Executions" (left sidebar)
3. View recent runs and errors
```

### Common Issues

**"Script function not found"**
- Function name typo
- Script not saved
- Wrong deployment selected

**"Authorization required"**
- Run function once in editor
- Grant permissions
- Re-deploy if needed

**"Cannot read property 'parameter' of undefined"**
- No data sent in request
- Check POST body format
- Verify Content-Type header

**"Spreadsheet not found"**
- Wrong SPREADSHEET_ID
- Script doesn't have access
- Check sharing permissions

---

## 📝 Maintenance Checklist

### Weekly
- [ ] Check execution logs for errors
- [ ] Monitor email quota (100/day limit)
- [ ] Review failed submissions

### Monthly
- [ ] Archive old clients/folders
- [ ] Clean up test data
- [ ] Review and update pricing logic

### As Needed
- [ ] Update column mappings
- [ ] Add new features
- [ ] Fix reported bugs
- [ ] Update email templates

---

## 📞 Support

**Logs Location**: 
- Apps Script Editor → Executions
- View → Logs (Ctrl+Enter while editing)

**Error Tracking**:
- Check recent executions
- Review error messages
- Test in Apps Script editor first

**Need Help?**
- Google Apps Script docs: https://developers.google.com/apps-script
- Stack Overflow: Tag `google-apps-script`

