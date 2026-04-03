# BrihanMumbai Fix - Deployment Guide

Complete step-by-step guide to deploy the BrihanMumbai Fix civic-tech application.

---

## Prerequisites

- GitHub account (for code hosting)
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Google AI Studio account (free)
- Groq account (free)
- Render account (free tier for backend)
- Vercel account (free tier for frontend)

---

## STEP 1: Set Up MongoDB Atlas

### 1.1 Create a Free Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project (e.g., "BrihanMumbai")
4. Click **"Build a Database"**
5. Select **FREE** shared cluster (M0)
6. Choose your cloud provider and region (closest to your users)
7. Click **"Create Cluster"**

### 1.2 Create Database User

1. In the left sidebar, click **"Database Access"**
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `brihanmumbai_admin` (or your choice)
5. Password: Generate a secure password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### 1.3 Whitelist IP Addresses

1. In the left sidebar, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - Required for Render.com compatibility
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go back to **"Database"** in sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Driver: **Python**, Version: **3.12 or later**
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `brihanmumbai_fix`

**Example:**
```
mongodb+srv://brihanmumbai_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/brihanmumbai_fix?retryWrites=true&w=majority
```

✅ Save this connection string for later

---

## STEP 2: Set Up Cloudinary

### 2.1 Create Free Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

### 2.2 Get API Credentials

1. Log in to Cloudinary Dashboard
2. You'll see your credentials on the main dashboard:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Copy all three values

✅ Save these credentials for later

---

## STEP 3: Get AI API Keys

### 3.1 Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"** in the left sidebar
4. Click **"Create API key in new project"**
5. Copy your API key

✅ Save this key for later

### 3.2 Groq API Key

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up or log in
3. Navigate to **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name (e.g., "BrihanMumbai Production")
6. Copy the API key (you won't see it again!)

✅ Save this key for later

---

## STEP 4: Deploy Backend to Render

### 4.1 Push Code to GitHub

```bash
cd brihanmumbai-fix
git init
git add .
git commit -m "Initial commit - BrihanMumbai Fix"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/brihanmumbai-fix.git
git push -u origin main
```

### 4.2 Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your `brihanmumbai-fix` repository
5. Configure the service:

**Settings:**
- **Name:** `brihanmumbai-fix-backend`
- **Region:** Choose closest to your users
- **Root Directory:** `backend`
- **Environment:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`
- **Instance Type:** `Free`

6. Click **"Create Web Service"**

### 4.3 Set Environment Variables

In the Render dashboard for your service:

1. Go to **"Environment"** tab
2. Add the following environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A random secure string (min 32 characters) |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GROQ_API_KEY` | Your Groq API key |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `FRONTEND_URL` | `https://your-frontend-url.vercel.app` (update after Step 5) |

**To generate a secure JWT_SECRET:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

3. Click **"Save Changes"**
4. Render will automatically deploy your backend

### 4.4 Get Backend URL

1. Once deployed, copy your backend URL from Render
2. Format: `https://brihanmumbai-fix-backend.onrender.com`

✅ Save this URL for frontend configuration

---

## STEP 5: Deploy Frontend to Vercel

### 5.1 Configure Environment Variable

1. Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

2. Edit `.env`:
```env
VITE_API_URL=https://brihanmumbai-fix-backend.onrender.com
```
(Replace with your actual Render backend URL from Step 4.4)

### 5.2 Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? `brihanmumbai-fix`
- In which directory is your code located? `./`
- Want to modify settings? **N**

**Option B: Using Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: Your Render backend URL
6. Click **"Deploy"**

### 5.3 Update Backend CORS

1. Go back to Render dashboard
2. Update the `FRONTEND_URL` environment variable:
   - Value: Your Vercel frontend URL (e.g., `https://brihanmumbai-fix.vercel.app`)
3. Save changes (Render will redeploy automatically)

---

## STEP 6: Verify Deployment

### 6.1 Test the Application

1. Visit your Vercel frontend URL
2. Register a new account
3. Upload a test image of a civic issue
4. Verify AI analysis works
5. Submit a complaint
6. Check the dashboard

### 6.2 Monitor Logs

**Backend (Render):**
- Go to your Render service dashboard
- Click **"Logs"** tab to see real-time server logs

**Frontend (Vercel):**
- Go to your Vercel project dashboard
- Click **"Deployments"** → Select deployment → **"Functions"** tab

---

## Troubleshooting

### Backend Issues

**500 Error on startup:**
- Check Render logs for Python errors
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct

**MongoDB connection fails:**
- Verify IP whitelist includes `0.0.0.0/0`
- Check MongoDB username/password in connection string
- Ensure database name is correct in URI

**AI features not working:**
- Verify Gemini and Groq API keys are valid
- Check API quota/limits in respective dashboards

### Frontend Issues

**404 on refresh:**
- Verify `vercel.json` exists with rewrites configuration

**API calls fail (CORS errors):**
- Verify `FRONTEND_URL` in Render matches your Vercel URL
- Check browser console for exact error
- Ensure backend URL in frontend .env is correct

**Images not uploading:**
- Verify Cloudinary credentials in Render environment
- Check Cloudinary dashboard for upload activity

---

## Free Tier Limits

### MongoDB Atlas (Free Tier)
- 512 MB storage
- Shared RAM
- No backups
- Good for ~100-1000 users

### Render (Free Tier)
- 750 hours/month
- Spins down after 15 minutes of inactivity
- **First request after spin-down takes ~30 seconds**
- 512 MB RAM

### Vercel (Free Tier)
- Unlimited deployments
- 100 GB bandwidth/month
- No cold starts (always fast)

### Cloudinary (Free Tier)
- 25 GB storage
- 25 GB bandwidth/month
- Good for ~5000 images

---

## Production Optimization (Optional)

### 1. Keep Backend Alive (Prevent Cold Starts)

Use a cron job service like [cron-job.org](https://cron-job.org):
- Schedule: Every 10 minutes
- URL: `https://your-backend.onrender.com/api/ward-info?ward=A-Ward`

### 2. Custom Domain (Vercel)

1. Go to Vercel project settings
2. **"Domains"** tab
3. Add your custom domain
4. Follow DNS setup instructions

### 3. Enable HTTPS (Free)

Both Render and Vercel provide free SSL certificates automatically.

### 4. MongoDB Indexes

Indexes are automatically created on app startup via `setup_database_indexes()`.

---

## Support

For issues:
1. Check application logs (Render for backend, browser console for frontend)
2. Verify all environment variables
3. Test API endpoints directly using tools like Postman
4. Check MongoDB Atlas metrics

---

## Summary Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with password
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Cloudinary account created
- [ ] Gemini API key obtained
- [ ] Groq API key obtained
- [ ] Backend deployed to Render
- [ ] All environment variables set in Render
- [ ] Frontend deployed to Vercel
- [ ] VITE_API_URL set in Vercel
- [ ] FRONTEND_URL updated in Render
- [ ] Test registration works
- [ ] Test image upload works
- [ ] Test AI analysis works
- [ ] Test complaint submission works
- [ ] Test dashboard loads

**🎉 Congratulations! Your civic-tech app is live!**
