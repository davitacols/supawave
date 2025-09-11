# PythonAnywhere Free Deployment

## 🆓 **Truly Free Forever**
- No credit card required
- No trial expiration
- 1 web app free
- 512MB storage

## Quick Setup

### 1. Create Account
- Go to [pythonanywhere.com](https://pythonanywhere.com)
- Sign up for **FREE** account

### 2. Upload Code
**Option A: Git Clone**
```bash
# In PythonAnywhere console
git clone https://github.com/yourusername/supawave.git
cd supawave/backend
```

**Option B: Upload Files**
- Use Files tab to upload your backend folder

### 3. Install Dependencies
```bash
# In PythonAnywhere console
cd supawave/backend
pip3.10 install --user -r requirements.txt
```

### 4. Configure Web App
1. Go to **Web** tab
2. Click "Add a new web app"
3. Choose **Manual configuration**
4. Select **Python 3.10**
5. Set these paths:
   - **Source code**: `/home/yourusername/supawave/backend`
   - **WSGI file**: `/home/yourusername/supawave/backend/wsgi.py`

### 5. Environment Variables
In **Files** tab, create `.env` file:
```bash
SECRET_KEY=your-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://david:7o3JR0Lm_NvMbnCn3sI6Dg@devconn-2409.jxf.gcp-us-west2.cockroachlabs.cloud:26257/supawave?sslmode=verify-full
FRONTEND_URL=https://your-frontend.vercel.app
PAYSTACK_SECRET_KEY=sk_test_9a70a63f5c3d1b7b12f6c3165b1e2206ca1810a4
PAYSTACK_PUBLIC_KEY=pk_test_bd4b7f52afbcf7cf0fa68951c5b7c7dfafbf377d
AWS_ACCESS_KEY_ID=AKIAUHPTTS4ANMYEME73
AWS_SECRET_ACCESS_KEY=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
AWS_STORAGE_BUCKET_NAME=supawave-products
CLAUDE_API_KEY=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
```

### 6. Run Migrations
```bash
cd supawave/backend
python manage.py migrate
python manage.py collectstatic --noinput
```

### 7. Reload Web App
- Go to **Web** tab
- Click **Reload**

Your API will be live at: `https://yourusername.pythonanywhere.com`

## Alternative: Koyeb (Also Free)

### Koyeb Setup
1. Go to [koyeb.com](https://koyeb.com)
2. Connect GitHub
3. Deploy from `supawave` repo
4. Set root directory: `backend`
5. Add environment variables
6. Deploy!

## Frontend Deployment (Always Free)

### Vercel
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Netlify
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub
3. Set build directory: `frontend/build`
4. Deploy

## Your Live URLs
- **Backend**: `https://yourusername.pythonanywhere.com`
- **Frontend**: `https://your-app.vercel.app`
- **Mobile**: Update API_URL in app config

PythonAnywhere is perfect for your Django app and will never expire!