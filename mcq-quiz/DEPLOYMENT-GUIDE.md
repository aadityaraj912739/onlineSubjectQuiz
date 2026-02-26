# Deployment Guide

## Quick Fix for Current Issue

The frontend on Vercel is trying to connect to `localhost:5001` instead of your Render backend. Follow these steps:

### Step 1: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project (`online-subject-quiz`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables for **Production**, **Preview**, and **Development**:

```
REACT_APP_API_URL=https://onlinesubjectquiz.onrender.com/api
REACT_APP_BACKEND_URL=https://onlinesubjectquiz.onrender.com
```

### Step 2: Redeploy on Vercel

After adding environment variables:
1. Go to **Deployments** tab
2. Click on the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Or simply push new code to trigger a rebuild

### Step 3: Push Code Changes

The `.env.production` file has been created locally. Push these changes:

```bash
cd mcq-quiz/frontend
git add .env.production .gitignore
git commit -m "Add production environment configuration"
git push origin main
```

---

## Full Deployment Information

### Backend (Render)
- **URL**: https://onlinesubjectquiz.onrender.com
- **Repository**: GitHub (auto-deploys from main branch)
- **Environment Variables Required**:
  ```
  MONGODB_URI=<your-mongodb-connection-string>
  JWT_SECRET=<your-secret-key>
  PORT=5001
  ```

### Frontend (Vercel)
- **URL**: https://online-subject-quiz.vercel.app
- **Repository**: GitHub (auto-deploys from main branch)
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Root Directory**: `mcq-quiz/frontend`

### Environment Variables Setup

#### For Local Development
Create `mcq-quiz/frontend/.env.local`:
```
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_BACKEND_URL=http://localhost:5001
```

#### For Production (Vercel Dashboard)
```
REACT_APP_API_URL=https://onlinesubjectquiz.onrender.com/api
REACT_APP_BACKEND_URL=https://onlinesubjectquiz.onrender.com
```

---

## Troubleshooting

### Issue: "Failed to load resource: net::ERR_CONNECTION_REFUSED"
**Cause**: Frontend is trying to connect to localhost instead of production backend.
**Solution**: Follow Steps 1-2 above to configure Vercel environment variables and redeploy.

### Issue: CORS errors
**Cause**: Backend doesn't allow requests from your frontend domain.
**Solution**: Backend is already configured to accept requests from `https://online-subject-quiz.vercel.app`. If using a different domain, update `backend/server.js` CORS configuration.

### Issue: 404 errors on page refresh
**Cause**: Vercel needs to handle client-side routing.
**Solution**: A `vercel.json` should be in the frontend root with proper rewrites configuration.

---

## Monitoring

### Check Backend Status
```bash
curl https://onlinesubjectquiz.onrender.com/api
```

### Check Frontend Build
- View build logs in Vercel dashboard
- Check browser console for API errors
- Inspect Network tab for failed requests

---

## Notes

- Render free tier may spin down after inactivity (first request takes ~30 seconds)
- Vercel deployments are instant after the initial build
- Both services auto-deploy when you push to the main branch
- Always test locally before pushing to production
