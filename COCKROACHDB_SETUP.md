# CockroachDB Integration Guide

## 🚀 Quick Setup

### 1. Create CockroachDB Cluster
```bash
# Option A: CockroachDB Serverless (Free)
# Visit: https://cockroachlabs.cloud/
# Create account and new cluster

# Option B: Local CockroachDB
cockroach start-single-node --insecure --listen-addr=localhost:26257
```

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your CockroachDB credentials:

DB_NAME=your-cluster-name
DB_USER=your-username  
DB_PASSWORD=your-password
DB_HOST=your-cluster-host
DB_PORT=26257
```

### 4. Run Setup Script
```bash
python setup_cockroachdb.py
```

### 5. Start Application
```bash
python manage.py runserver
```

## 🔧 Manual Setup

### 1. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Create Superuser
```bash
python manage.py createsuperuser
```

### 3. Load Sample Data (Optional)
```bash
python manage.py loaddata sample_data.json
```

## 📊 CockroachDB Benefits

- **Distributed SQL** - Global scale and consistency
- **Cloud Native** - Built for modern applications  
- **PostgreSQL Compatible** - Easy migration
- **Free Tier** - 5GB storage, 250M RUs/month
- **Auto Scaling** - Handles traffic spikes
- **Multi-Region** - Low latency worldwide

## 🌍 Production Deployment

### Railway Deployment
```bash
# Set environment variables in Railway:
DB_NAME=your-production-db
DB_USER=your-production-user
DB_PASSWORD=your-production-password
DB_HOST=your-production-host
DB_PORT=26257
```

### Vercel Frontend
```bash
# Set environment variable:
REACT_APP_API_URL=https://your-railway-app.railway.app
```

## 🔍 Troubleshooting

### Connection Issues
- Verify cluster is running
- Check firewall settings
- Confirm SSL certificate

### Migration Errors
- Ensure user has proper permissions
- Check database exists
- Verify connection string

### Performance
- Use connection pooling
- Optimize queries with indexes
- Monitor with CockroachDB Console