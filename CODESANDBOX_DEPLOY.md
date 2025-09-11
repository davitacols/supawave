# CodeSandbox Deployment Guide

## 🚀 **Deploy to CodeSandbox (No Card Required)**

### Method 1: Direct GitHub Import
1. Go to [codesandbox.io](https://codesandbox.io)
2. Click "Create" → "Import from GitHub"
3. Enter: `https://github.com/yourusername/supawave`
4. CodeSandbox will auto-detect Python/Django
5. Your app will be live instantly!

### Method 2: Fork from URL
1. Go to: `https://codesandbox.io/s/github/yourusername/supawave`
2. Click "Fork" to create your own copy
3. Edit environment variables
4. Your app is live!

## 🔧 **Environment Variables**
In CodeSandbox, go to Server Control Panel → Environment:

```
SECRET_KEY=your-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://david:7o3JR0Lm_NvMbnCn3sI6Dg@devconn-2409.jxf.gcp-us-west2.cockroachlabs.cloud:26257/supawave?sslmode=verify-full
PORT=8000
PAYSTACK_SECRET_KEY=sk_test_9a70a63f5c3d1b7b12f6c3165b1e2206ca1810a4
AWS_ACCESS_KEY_ID=AKIAUHPTTS4ANMYEME73
AWS_SECRET_ACCESS_KEY=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
CLAUDE_API_KEY=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
```

## 🎯 **Your Live URLs**
- **Backend API**: `https://xyz123.csb.app`
- **Admin Panel**: `https://xyz123.csb.app/admin`

## 🔄 **Auto-Deploy**
- Push to GitHub → CodeSandbox auto-updates
- Real-time collaboration
- Instant preview

## 💡 **Pro Tips**
- CodeSandbox handles large projects better than Replit
- Supports your CockroachDB perfectly
- Free forever for public projects
- Great for demos and development

## 🚀 **Quick Start**
1. Push your code to GitHub
2. Go to CodeSandbox
3. Import your repo
4. Add environment variables
5. Live in 30 seconds!