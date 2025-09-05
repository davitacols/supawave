# Deploy SupaWave in 10 Minutes 🚀

## Step 1: Deploy Backend to Render (Free)

1. **Push to GitHub** (if not already done)
2. **Go to [render.com](https://render.com)** and sign up
3. **Connect GitHub repo**
4. **Select "Web Service"**
5. **Choose your supawave repo**
6. **Render will auto-detect** the `render.yaml` file
7. **Click "Create Web Service"**
8. **Wait 5-10 minutes** for deployment

✅ Your backend will be live at: `https://supawave-backend.onrender.com`

## Step 2: Deploy Frontend to Vercel (Free)

1. **Go to [vercel.com](https://vercel.com)** and sign up
2. **Import your GitHub repo**
3. **Set Framework Preset**: Create React App
4. **Add Environment Variables**:
   - `REACT_APP_API_URL`: `https://supawave-backend.onrender.com`
   - `REACT_APP_PAYSTACK_PUBLIC_KEY`: `pk_test_bd4b7f52afbcf7cf0fa68951c5b7c7dfafbf377d`
5. **Click Deploy**

✅ Your frontend will be live at: `https://supawave.vercel.app`

## Step 3: Update CORS Settings

Update your backend's CORS settings to allow your Vercel domain:
- Add your Vercel URL to `CORS_ALLOWED_ORIGINS` in settings.py

## That's It! 🎉

Your SupaWave is now live with:
- ✅ **Backend**: Render (Free 750 hours/month)
- ✅ **Frontend**: Vercel (Unlimited free)
- ✅ **Database**: Your existing CockroachDB
- ✅ **Storage**: AWS S3
- ✅ **Payments**: Paystack

## Cost: $0/month 💰

Both Render and Vercel offer generous free tiers perfect for SupaWave!