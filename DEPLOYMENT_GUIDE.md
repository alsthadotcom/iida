# 🚀 Deploying IDA Marketplace to Vercel

This guide will help you deploy your IDA Marketplace application to Vercel using Git.

## Prerequisites

- ✅ Git repository (already set up at: https://github.com/Aabhushan-1/ida.git)
- ✅ Vercel account (sign up at https://vercel.com if you don't have one)
- ✅ Environment variables from `.env.local`

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

Make sure all your latest changes are pushed to GitHub:

```bash
# Check status
git status

# Add any new files
git add .

# Commit changes
git commit -m "Add Vercel configuration for deployment"

# Push to GitHub
git push origin main
```

### 2. Connect to Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **"Add New Project"** or **"Import Project"**
3. Click **"Import Git Repository"**
4. Select **GitHub** as your Git provider
5. Authorize Vercel to access your GitHub account if prompted
6. Find and select the **`Aabhushan-1/ida`** repository

### 3. Configure Your Project

Vercel will automatically detect that this is a Vite project. Verify these settings:

- **Framework Preset**: Vite
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Add Environment Variables

⚠️ **IMPORTANT**: You need to add your environment variables to Vercel.

Click on **"Environment Variables"** and add the following:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GEMINI_API_KEY=<your-gemini-api-key>
```

**Where to find these values:**
- Copy them from your local `.env.local` file
- For Supabase: Go to your Supabase project → Settings → API
- For Gemini: Your Google AI Studio API key

**Important Notes:**
- Add these variables for **Production**, **Preview**, and **Development** environments
- Make sure the variable names match exactly (including the `VITE_` prefix)

### 5. Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually takes 1-2 minutes)
3. Once deployed, you'll get a live URL like: `https://ida-xxx.vercel.app`

### 6. Configure Supabase Redirect URLs

After deployment, you need to update your Supabase authentication settings:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
4. Add to **Redirect URLs**:
   - `https://your-app.vercel.app/**`
   - `http://localhost:5173/**` (for local development)

## Automatic Deployments

Once connected, Vercel will automatically:
- ✅ Deploy every push to the `main` branch
- ✅ Create preview deployments for pull requests
- ✅ Provide deployment status in GitHub

## Custom Domain (Optional)

To add a custom domain:
1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Make sure `package.json` has all required dependencies

### Environment Variables Not Working
- Verify variable names have the `VITE_` prefix
- Redeploy after adding/updating environment variables
- Check that variables are set for the correct environment

### Authentication Issues
- Verify Supabase redirect URLs include your Vercel domain
- Check that Supabase keys are correctly set in Vercel

### 404 Errors on Page Refresh
- The `vercel.json` file should handle this with SPA rewrites
- If issues persist, check that the rewrite rules are correct

## Useful Commands

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy from command line
vercel

# Deploy to production
vercel --prod
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Auth with Vercel](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

**Need Help?** Check the Vercel deployment logs for detailed error messages.
