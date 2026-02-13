# 🚀 Quick Start Checklist

Follow these steps to get your Heavy D Admin Dashboard running:

## ☐ Step 1: Extract & Install (5 minutes)
```bash
unzip heavy-d-admin.zip
cd heavy-d-admin-new
npm install
```

## ☐ Step 2: Set Up Google Apps Script (10 minutes)

### 2a. Create Script Project
1. Go to https://script.google.com
2. Click "New Project"
3. Copy the code from README.md → "Google Apps Script Code" section
4. Paste into the editor
5. Save as "Heavy D Admin API"

### 2b. Deploy as Web App
1. Click "Deploy" → "New deployment"
2. Select "Web app"
3. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click "Deploy"
5. **Copy the Web App URL** ← IMPORTANT!

### 2c. Authorize
1. Click "Authorize access"
2. Choose your Google account
3. Click "Advanced" → "Go to Heavy D Admin API"
4. Click "Allow"

## ☐ Step 3: Configure Environment (2 minutes)

Create `.env.local` file in project root:

```env
NEXT_PUBLIC_GAS_ENDPOINT=PASTE_YOUR_WEB_APP_URL_HERE
NEXT_PUBLIC_MASTER_SHEET_ID=1Kn315utkWQHmD5UGs24wlYaerPxjzssZ69PoNpTndGU
NEXT_PUBLIC_CALCULATOR_SHEET_ID=1_jLOhyotUzNNmfrzGpH9tRoO06LOsiCFaaRKaSWcjVU
NEXT_PUBLIC_TIMESHEET_TEMPLATE_ID=1-Eu_KkaQIHAW6uzK0npZ-gQgndmDZTj0snBhjxoFKqE
NEXT_PUBLIC_MASTER_DRIVE_FOLDER=10IyZIezSZd7w7QAcGjGUa063mryg65fe
```

Replace `PASTE_YOUR_WEB_APP_URL_HERE` with the URL from Step 2b!

## ☐ Step 4: Run! (1 minute)

```bash
npm run dev
```

Open http://localhost:3000

## ✅ Success Indicators

You'll know it's working when you see:
- ✅ Dashboard loads without errors
- ✅ Client list shows your data from Master sheet
- ✅ Calculator is interactive
- ✅ No red error messages in browser console

## 🆘 Quick Troubleshooting

### Problem: "Failed to load clients"
**Fix:** Check that your Web App URL in `.env.local` is correct

### Problem: "CORS error"
**Fix:** Make sure Apps Script deployment has "Who has access: Anyone"

### Problem: Empty client list
**Fix:** Verify your Master sheet has data in the correct columns

## 📚 Next Steps

1. ✅ **Test the features** - Add a calculation, view clients
2. 🎨 **Customize colors** - Edit the brand colors in `tailwind.config.js`
3. 🚀 **Deploy to production** - Use Vercel for free hosting
4. 📖 **Read SETUP_GUIDE.md** - For detailed information

## 🎯 Key Files to Know

- **`.env.local`** - Your configuration (create this!)
- **`README.md`** - Full documentation
- **`SETUP_GUIDE.md`** - Detailed setup instructions
- **`app/dashboard/`** - All your dashboard pages
- **`lib/api.ts`** - API connection to Google Sheets

## 💡 Pro Tips

1. **Keep your `.env.local` secret** - Don't commit it to git
2. **Test the Apps Script** - Click "Run" in Apps Script editor to test
3. **Check browser console** - Press F12 to see any errors
4. **Bookmark your dashboard** - You'll use it daily!

---

**Total Setup Time: ~20 minutes**

Need help? Check SETUP_GUIDE.md for detailed troubleshooting!
