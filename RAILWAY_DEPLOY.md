# Railway Deployment Guide

## Quick Deploy to Railway

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### 2. Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `supawave` repository
4. Railway will auto-detect Django and deploy

### 3. Environment Variables
Add these in Railway dashboard → Variables:

```
SECRET_KEY=django-insecure-your-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://david:7o3JR0Lm_NvMbnCn3sI6Dg@devconn-2409.jxf.gcp-us-west2.cockroachlabs.cloud:26257/supawave?sslmode=verify-full
FRONTEND_URL=https://your-frontend.vercel.app

# Your existing credentials
PAYSTACK_SECRET_KEY=sk_test_9a70a63f5c3d1b7b12f6c3165b1e2206ca1810a4
PAYSTACK_PUBLIC_KEY=pk_test_bd4b7f52afbcf7cf0fa68951c5b7c7dfafbf377d
AWS_ACCESS_KEY_ID=AKIAUHPTTS4ANMYEME73
AWS_SECRET_ACCESS_KEY=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
AWS_STORAGE_BUCKET_NAME=supawave-products
CLAUDE_API_KEY=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
```

### 4. Deploy Frontend to Vercel
```bash
cd frontend
vercel --prod
```
Set environment variable:
```
REACT_APP_API_URL=https://your-app.railway.app
```

## Alternative Free Platforms

### 1. **Fly.io** (Recommended)
- 3 apps free
- Global deployment
- Good performance

### 2. **Koyeb**
- 1 app free
- Easy deployment
- Good for Django

### 3. **Cyclic**
- Unlimited apps
- Serverless
- Good for small apps

### 4. **PythonAnywhere**
- Free tier available
- Python-focused
- Easy Django deployment

## Quick Fly.io Setup
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
fly deploy
```

Your Railway deployment will be live at: `https://your-app.railway.app`