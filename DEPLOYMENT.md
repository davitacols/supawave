# SupaWave Deployment Guide

## Render Deployment

### 1. Create Render Account
- Go to [render.com](https://render.com) and sign up
- Connect your GitHub account

### 2. Use Your CockroachDB
1. Get your CockroachDB connection string
2. Format: `cockroachdb://username:password@host:port/database?sslmode=require`
3. Copy the connection URL for environment variables

### 3. Deploy Backend
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select `supawave` repository
4. Configure:
   - **Name**: `supawave-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn inventory_saas.wsgi:application`

### 4. Environment Variables
Add these environment variables in Render dashboard:

```
SECRET_KEY=your-super-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://user:password@host:port/database
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_DOMAIN=your-backend-domain.onrender.com

# WhatsApp (Optional)
WHATSAPP_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Paystack (Optional)
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_STORAGE_BUCKET_NAME=your_bucket_name
AWS_S3_REGION_NAME=us-east-1

# Email (Optional)
FROM_EMAIL=noreply@yourdomain.com
EMAIL_PASSWORD=your_email_password
```

### 5. Deploy Frontend (Vercel/Netlify)

#### Vercel Deployment:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `frontend`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   ```
5. Deploy

#### Netlify Deployment:
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   ```
5. Deploy

### 6. Update CORS Settings
After deployment, update your backend environment variables:
```
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 7. Create Superuser
1. Go to Render dashboard → your service → Shell
2. Run: `python manage.py createsuperuser`
3. Follow prompts to create admin user

## Mobile App Deployment

### Expo EAS Build
```bash
cd mobile
npm install -g @expo/cli
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Update app.json with your API URL
# Edit app.json and set API_URL to your backend domain

# Build for both platforms
eas build --platform all

# Submit to app stores (optional)
eas submit --platform all
```

## Production Checklist

### Security
- [ ] Set `DEBUG=False`
- [ ] Use strong `SECRET_KEY`
- [ ] Configure HTTPS
- [ ] Set up proper CORS origins
- [ ] Enable security headers

### Database
- [ ] PostgreSQL database created
- [ ] Migrations applied
- [ ] Superuser created
- [ ] Database backups configured

### Environment Variables
- [ ] All required variables set
- [ ] No sensitive data in code
- [ ] Production API keys configured

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### Testing
- [ ] API endpoints working
- [ ] Frontend connecting to backend
- [ ] Mobile app connecting to API
- [ ] WhatsApp integration (if enabled)
- [ ] Payment processing (if enabled)

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Ensure database is running
   - Verify network connectivity

2. **Static Files Not Loading**
   - Run `python manage.py collectstatic`
   - Check STATIC_ROOT and STATIC_URL settings
   - Verify WhiteNoise configuration

3. **CORS Errors**
   - Add frontend domain to CORS_ALLOWED_ORIGINS
   - Check FRONTEND_URL environment variable
   - Verify protocol (http vs https)

4. **Migration Errors**
   - Run migrations manually: `python manage.py migrate`
   - Check database permissions
   - Verify database schema

### Support
- Check Render logs for backend issues
- Use browser dev tools for frontend debugging
- Check Expo logs for mobile app issues
- Review Django logs for API problems