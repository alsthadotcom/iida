# 🎯 Quick Deployment Checklist

## ✅ Pre-Deployment (DONE)
- [x] Git repository created
- [x] Code pushed to GitHub
- [x] Vercel configuration added
- [x] `.gitignore` configured to exclude `.env.local`

## 📋 Next Steps - Deploy to Vercel

### 1️⃣ Go to Vercel
Visit: https://vercel.com

### 2️⃣ Import Your Repository
- Click "Add New Project"
- Select "Import Git Repository"
- Choose: **Aabhushan-1/ida**

### 3️⃣ Configure Build Settings
Vercel will auto-detect these (verify they're correct):
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4️⃣ Add Environment Variables ⚠️ CRITICAL
You MUST add these from your `.env.local` file:

```
VITE_SUPABASE_URL=<your-value>
VITE_SUPABASE_ANON_KEY=<your-value>
VITE_GEMINI_API_KEY=<your-value>
```

**How to add:**
- In Vercel project settings, find "Environment Variables"
- Add each variable for all environments (Production, Preview, Development)

### 5️⃣ Deploy
Click "Deploy" and wait ~1-2 minutes

### 6️⃣ Update Supabase (After First Deployment)
Once you get your Vercel URL (e.g., `https://ida-xxx.vercel.app`):

1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add to **Site URL**: `https://your-vercel-url.vercel.app`
4. Add to **Redirect URLs**: `https://your-vercel-url.vercel.app/**`

## 🔄 Future Updates
Every time you push to GitHub, Vercel will automatically redeploy!

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## 📞 Need Help?
See `DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
