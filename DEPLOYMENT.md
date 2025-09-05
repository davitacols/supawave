# SupaWave Deployment Guide

## Free Deployment Options

### Option 1: Render (Backend) + Vercel (Frontend) - Recommended

#### Backend on Render (Free):
1. Connect GitHub repo to Render
2. Use `render.yaml` for automatic configuration
3. Free PostgreSQL database included
4. 750 hours/month free

### Option 2: PythonAnywhere (Backend) + Vercel (Frontend)

#### Backend on PythonAnywhere (Free):
1. Upload code via file manager
2. Set up virtual environment
3. Configure WSGI file
4. Free MySQL database included

### Option 3: Heroku (Backend) + Vercel (Frontend)

#### Backend on Heroku (Free tier ended, but eco dyno $7/month):
1. Connect GitHub repo
2. Add Heroku Postgres addon
3. Set environment variables
4. Deploy with Procfile

#### Frontend on Vercel:
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set environment variables:
   - `REACT_APP_API_URL`: Your Railway backend URL
   - `REACT_APP_PAYSTACK_PUBLIC_KEY`: Your Paystack public key

### Option 4: Docker Compose (VPS/Cloud)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd supawave

# 2. Copy production environment
cp .env.production .env

# 3. Update environment variables in .env

# 4. Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Manual Deployment

#### Backend:
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic
gunicorn inventory_saas.wsgi:application
```

#### Frontend:
```bash
cd frontend
npm install
npm run build
# Serve build folder with nginx/apache
```

## Environment Variables

### Required for Production:
- `SECRET_KEY`: Django secret key
- `DATABASE_URL`: CockroachDB connection string
- `PAYSTACK_SECRET_KEY`: Live Paystack secret key
- `PAYSTACK_PUBLIC_KEY`: Live Paystack public key
- `AWS_ACCESS_KEY_ID`: AWS S3 access key
- `AWS_SECRET_ACCESS_KEY`: AWS S3 secret key
- `FRONTEND_URL`: Your frontend domain

## Post-Deployment Checklist

1. ✅ Update CORS settings for your domain
2. ✅ Set up SSL certificates
3. ✅ Configure custom domain
4. ✅ Test payment integration
5. ✅ Set up monitoring/logging
6. ✅ Configure backups

## Monitoring

- Backend health: `https://your-api-domain.com/admin/`
- Frontend: Check console for errors
- Database: Monitor CockroachDB dashboard

## Support

For deployment issues, check:
1. Environment variables are set correctly
2. Database migrations ran successfully
3. Static files are served properly
4. CORS settings allow your frontend domain