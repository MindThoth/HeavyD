# 🚀 GitHub Setup & Local Testing Guide

## ✅ Step 1: Push to GitHub

### Option A: Create New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `HeavyD` (or your preferred name)
3. Description: "Heavy D Print & Design - Website, Admin Panel, Dashboard, and Google Apps Script"
4. Choose: **Private** (recommended) or **Public**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Option B: Use Existing Repository

If you already have a GitHub repository, skip to "Add Remote" below.

---

### Add Remote and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/HeavyD.git

# Push to GitHub
git push -u origin master
```

**Or if you're using SSH:**
```bash
git remote add origin git@github.com:YOUR_USERNAME/HeavyD.git
git push -u origin master
```

**Note:** Replace `YOUR_USERNAME` with your actual GitHub username.

---

## 🧪 Step 2: Local Testing

### Prerequisites

Make sure you have:
- ✅ Node.js installed (v18 or higher)
- ✅ npm or pnpm installed
- ✅ Your Google Apps Script deployment URL

---

## 📝 Step 3: Set Up Environment Variables

### For Website Testing

1. Navigate to Website folder:
   ```bash
   cd Website
   ```

2. Create `.env.local` file (if it doesn't exist):
   ```bash
   # Windows PowerShell
   New-Item -Path .env.local -ItemType File
   
   # Or create manually
   ```

3. Add your Google Apps Script URL:
   ```env
   NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
   
   **Replace `YOUR_DEPLOYMENT_ID` with your actual deployment ID:**
   ```
   AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g
   ```

### For Dashboard Testing

1. Navigate to Dashboard folder:
   ```bash
   cd Dashboard
   ```

2. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```

### For AdminPanel Testing

1. Navigate to AdminPanel folder:
   ```bash
   cd AdminPanel
   ```

2. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_GAS_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-generate-a-random-string
   ```

---

## 🏃 Step 4: Install Dependencies & Run

### Test Website

```bash
cd Website
npm install
# or: pnpm install

npm run dev
# or: pnpm dev
```

Open: http://localhost:3000

**Test:**
- ✅ Page loads
- ✅ Form submission works
- ✅ Check Google Apps Script logs for form data

---

### Test Dashboard

```bash
cd Dashboard
npm install
# or: pnpm install

npm run dev
# or: pnpm dev
```

Open: http://localhost:3001 (or next available port)

**Test:**
- ✅ Login page loads
- ✅ Try logging in with a client email
- ✅ Check if client data loads

---

### Test AdminPanel

```bash
cd AdminPanel
npm install

npm run dev
```

Open: http://localhost:3002 (or next available port)

**Test:**
- ✅ Login page loads
- ✅ Admin authentication works
- ✅ Dashboard loads

---

## 🧪 Step 5: Test Google Apps Script Router

### Test Health Endpoint

Open in browser:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Heavy D API is running",
  "timestamp": "2026-01-07T..."
}
```

### Test Form Submission (from Website)

1. Fill out the form on your local website
2. Submit
3. Check Google Apps Script logs:
   - Go to Google Apps Script
   - Click "Executions" (clock icon)
   - Look for POST request logs
   - Should see: `=== POST REQUEST ===` and `Action: form-submission`

### Test Dashboard Login

1. Go to local dashboard
2. Try to login with a client email
3. Check Google Apps Script logs:
   - Should see: `=== GET REQUEST ===` and `Action: login`

---

## 🐛 Troubleshooting

### Issue: "Module not found"

**Fix:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Environment variable not found"

**Fix:**
- Make sure `.env.local` is in the correct folder (Website/, Dashboard/, AdminPanel/)
- Restart the dev server after creating `.env.local`
- Check that variable name starts with `NEXT_PUBLIC_` for client-side variables

### Issue: "CORS error" when testing

**Fix:**
- This is normal for Google Apps Script
- The script should handle CORS automatically
- If errors persist, check Google Apps Script deployment settings:
  - Execute as: **Me**
  - Who has access: **Anyone**

### Issue: "Port already in use"

**Fix:**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Issue: Form submission not working

**Check:**
1. Google Apps Script deployment URL is correct in `.env.local`
2. Google Apps Script is deployed (not just saved)
3. Check browser console for errors
4. Check Google Apps Script execution logs

---

## 📋 Testing Checklist

### Website
- [ ] Page loads without errors
- [ ] Form fields are visible
- [ ] Form submission works
- [ ] Success message appears
- [ ] Data appears in Google Sheet
- [ ] Client folder created in Google Drive
- [ ] Email notifications sent

### Dashboard
- [ ] Login page loads
- [ ] Can login with client email
- [ ] Client data displays correctly
- [ ] Comments section works
- [ ] File upload works (if implemented)
- [ ] Quote acceptance works

### AdminPanel
- [ ] Login page loads
- [ ] Admin authentication works
- [ ] Client list displays
- [ ] Can edit client data
- [ ] All admin features work

### Google Apps Script
- [ ] Health endpoint works
- [ ] Form submissions route correctly
- [ ] Dashboard requests route correctly
- [ ] Logs show routing messages
- [ ] No errors in execution logs

---

## 🚀 After Local Testing Passes

### Deploy to Vercel

1. **Website:**
   - Connect GitHub repo to Vercel
   - Set root directory: `Website`
   - Add environment variable: `NEXT_PUBLIC_GAS_ENDPOINT`
   - Deploy

2. **Dashboard:**
   - Create new Vercel project
   - Set root directory: `Dashboard`
   - Add environment variable: `NEXT_PUBLIC_GAS_ENDPOINT`
   - Deploy

3. **AdminPanel:**
   - Create new Vercel project
   - Set root directory: `AdminPanel`
   - Add environment variables:
     - `NEXT_PUBLIC_GAS_ENDPOINT`
     - `NEXTAUTH_URL` (your Vercel URL)
     - `NEXTAUTH_SECRET` (generate a random string)
   - Deploy

---

## 📝 Quick Commands Reference

```bash
# Navigate to project
cd Website
cd Dashboard
cd AdminPanel

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Check git status
git status

# Add changes
git add .

# Commit
git commit -m "Your message"

# Push to GitHub
git push origin master
```

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Test locally (Website, Dashboard, AdminPanel)
3. ✅ Verify Google Apps Script routing works
4. ✅ Deploy to Vercel
5. ✅ Update Vercel environment variables
6. ✅ Test production deployments

---

**Need help?** Check the logs in:
- Browser console (F12)
- Terminal (dev server output)
- Google Apps Script execution logs

