# 🚀 Quick Start Guide

## ✅ What's Been Done

1. ✅ **Git initialized** - Your code is committed locally
2. ✅ **Environment variables created** - All 3 projects have `.env.local` files with your deployment ID
3. ✅ **Router pattern implemented** - `main.gs` routes requests to organized files

---

## 📤 Step 1: Push to GitHub

### Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `HeavyD`
3. Choose: **Private** (recommended)
4. **DO NOT** check "Initialize with README"
5. Click **"Create repository"**

### Push Your Code

After creating the repo, run these commands:

```powershell
# Add GitHub as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/HeavyD.git

# Push to GitHub
git push -u origin master
```

**If you get authentication errors**, you may need to:
- Use a Personal Access Token instead of password
- Or set up SSH keys

---

## 🧪 Step 2: Test Locally

### Test Website (Port 3000)

```powershell
cd Website
npm install
npm run dev
```

**Open:** http://localhost:3000

**Test:**
- ✅ Page loads
- ✅ Fill out form and submit
- ✅ Check Google Apps Script logs to see if form was received

---

### Test Dashboard (Port 3001)

```powershell
cd Dashboard
npm install
npm run dev
```

**Open:** http://localhost:3001

**Test:**
- ✅ Login page loads
- ✅ Try logging in with a client email from your Master sheet

---

### Test AdminPanel (Port 3002)

```powershell
cd AdminPanel
npm install
npm run dev
```

**Open:** http://localhost:3002

**Test:**
- ✅ Login page loads
- ✅ Admin authentication

---

## 🔍 Step 3: Verify Google Apps Script Router

### Test Health Endpoint

Open in browser:
```
https://script.google.com/macros/s/AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g/exec?action=health
```

**Expected:**
```json
{
  "status": "ok",
  "message": "Heavy D API is running",
  "timestamp": "..."
}
```

### Check Logs

1. Go to Google Apps Script
2. Click **"Executions"** (clock icon)
3. When you submit a form or login, you should see:
   - `=== POST REQUEST ===` or `=== GET REQUEST ===`
   - `Action: form-submission` or `Action: login`
   - Routing messages

---

## 🐛 Common Issues

### "Module not found"
```powershell
# Delete and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### "Port already in use"
```powershell
# Find and kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Form not submitting
- Check browser console (F12) for errors
- Verify `.env.local` file exists in Website folder
- Check Google Apps Script is deployed (not just saved)
- Look at Google Apps Script execution logs

---

## 📋 Testing Checklist

### Website
- [ ] Page loads
- [ ] Form submission works
- [ ] Data appears in Google Sheet
- [ ] Client folder created in Drive
- [ ] Email notifications sent

### Dashboard
- [ ] Login works
- [ ] Client data displays
- [ ] Comments work
- [ ] Quote acceptance works

### Google Apps Script
- [ ] Health endpoint works
- [ ] Form submissions route correctly
- [ ] Dashboard requests route correctly
- [ ] Logs show routing messages

---

## 🚀 After Testing: Deploy to Vercel

Once everything works locally:

1. **Connect GitHub to Vercel**
   - Go to vercel.com
   - Import your GitHub repository
   - For each app (Website, Dashboard, AdminPanel):
     - Create separate Vercel project
     - Set root directory to the app folder
     - Add environment variables from `.env.local`
     - Deploy

2. **Update Environment Variables in Vercel**
   - Use your production URLs for `NEXTAUTH_URL`
   - Generate a secure `NEXTAUTH_SECRET`

---

## 📝 Your Deployment ID

```
AKfycbxidAdAasl0tFNMk2ILW_44gXAxVVTYPyzfwRBum9XTuZ9wOC5_BjcRKCALJf0IKD2h-g
```

This is already configured in all `.env.local` files!

---

## 🆘 Need Help?

- Check `GITHUB_AND_TESTING_GUIDE.md` for detailed instructions
- Check browser console (F12) for frontend errors
- Check Google Apps Script execution logs for backend errors
- Check terminal output for dev server errors

---

**Ready to test?** Start with the Website:
```powershell
cd Website
npm install
npm run dev
```

Then open http://localhost:3000 and test the form! 🎉

