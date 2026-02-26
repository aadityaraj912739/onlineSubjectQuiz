# Vercel Environment Variables Configuration

🚀 **Your backend is live at:** https://onlinesubjectquiz.onrender.com/

## Step 1: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Open: https://vercel.com/dashboard
   - Select your project: `online-subject-quiz`

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add These Variables:**

   | Variable Name | Value |
   |--------------|-------|
   | `REACT_APP_API_URL` | `https://onlinesubjectquiz.onrender.com/api` |
   | `REACT_APP_BACKEND_URL` | `https://onlinesubjectquiz.onrender.com` |

4. **Select Environments:**
   - ✅ Production
   - ✅ Preview  
   - ✅ Development

5. **Click "Save"** for each variable

## Step 2: Redeploy on Vercel

**Option A: From Vercel Dashboard**
1. Go to **Deployments** tab
2. Click the three dots (**⋯**) next to the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (~2-3 minutes)

**Option B: Push to GitHub (Automatic)**
```bash
cd "c:\Users\ar912\OneDrive\Desktop\PROJECT_RESUME\Online subjective Quiz"
git add .
git commit -m "Configure production environment for Vercel deployment"
git push origin main
```

Vercel will automatically detect the push and redeploy.

## Step 3: Verify Deployment

After deployment completes:

1. **Open your Vercel URL:**
   - https://online-subject-quiz.vercel.app

2. **Test Registration/Login:**
   - Try creating a new account
   - You should NOT see "localhost:5001" errors anymore
   - Check browser console (F12) - all API calls should go to `onlinesubjectquiz.onrender.com`

3. **Check Network Tab:**
   - Open DevTools (F12) → Network tab
   - Try login/register
   - Verify requests are going to: `https://onlinesubjectquiz.onrender.com/api/auth/...`

---

## Troubleshooting

### Issue: Still seeing localhost errors
**Solution:** 
- Clear browser cache (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + F5)
- Check that environment variables were saved in Vercel
- Verify deployment completed successfully

### Issue: CORS errors
**Solution:**
Backend is already configured to accept requests from your Vercel domain. If you're using a custom domain, update `backend/server.js`:

```javascript
cors({
    origin: [
        'http://localhost:3000',
        'https://online-subject-quiz.vercel.app',
        'https://your-custom-domain.com'  // Add your domain here
    ],
    credentials: true
})
```

### Issue: 500 Internal Server Error
**Solution:**
- Check Render backend logs: https://dashboard.render.com/
- Verify MongoDB connection is working
- Check if backend is sleeping (free tier spins down after inactivity)

---

## Current Configuration Summary

### Local Development (Your Computer)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5001`
- Config: Uses `.env.local` (connects to localhost backend)

### Production (Internet)
- Frontend: `https://online-subject-quiz.vercel.app`
- Backend: `https://onlinesubjectquiz.onrender.com`
- Config: Uses Vercel environment variables

---

## Next Steps

1. ✅ Backend is live and verified
2. ✅ Environment files configured
3. ⏳ Configure Vercel environment variables (Step 1 above)
4. ⏳ Push changes and redeploy (Step 2 above)
5. ⏳ Test deployment (Step 3 above)

**Ready to push changes?** Run:
```bash
git add .
git commit -m "Add production environment configuration"
git push origin main
```
