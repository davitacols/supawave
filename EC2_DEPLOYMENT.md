# AWS EC2 Deployment Guide

## 🚀 **Deploy SupaWave to AWS EC2 (Free Tier)**

### **Step 1: Launch EC2 Instance**

1. **Go to AWS Console** → EC2
2. **Launch Instance**:
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: t2.micro (Free tier)
   - **Key Pair**: Create new or use existing
   - **Security Group**: Allow HTTP (80), HTTPS (443), SSH (22)
3. **Launch Instance**

### **Step 2: Connect to Instance**

```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Or use EC2 Instance Connect in AWS Console
```

### **Step 3: Install SupaWave**

```bash
# Download and run installation script
curl -O https://raw.githubusercontent.com/yourusername/supawave/main/backend/deploy/install.sh
chmod +x install.sh
./install.sh
```

### **Step 4: Configure Environment**

```bash
# Edit environment variables
nano /var/www/supawave/backend/.env
```

**Add your settings:**
```bash
SECRET_KEY=your-super-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://david:7o3JR0Lm_NvMbnCn3sI6Dg@devconn-2409.jxf.gcp-us-west2.cockroachlabs.cloud:26257/supawave?sslmode=verify-full

# Your existing credentials
PAYSTACK_SECRET_KEY=sk_test_9a70a63f5c3d1b7b12f6c3165b1e2206ca1810a4
PAYSTACK_PUBLIC_KEY=pk_test_bd4b7f52afbcf7cf0fa68951c5b7c7dfafbf377d
AWS_ACCESS_KEY_ID=AKIAUHPTTS4ANMYEME73
AWS_SECRET_ACCESS_KEY=NxJ4e8vFdcTEkFfwQkXPi/zn1SSHegK2rCh1rFaV
CLAUDE_API_KEY=your_claude_api_key_here

# Frontend URL (update after deployment)
FRONTEND_URL=https://your-frontend.vercel.app
```

### **Step 5: Setup Services**

```bash
# Run setup script
cd /var/www/supawave/backend/deploy
chmod +x setup.sh
./setup.sh
```

### **Step 6: Update Security Group**

1. **Go to EC2 Console** → Security Groups
2. **Edit inbound rules**:
   - **HTTP (80)**: 0.0.0.0/0
   - **HTTPS (443)**: 0.0.0.0/0
   - **SSH (22)**: Your IP only

### **Step 7: Get Your URLs**

- **API**: `http://your-ec2-public-ip/api/`
- **Admin**: `http://your-ec2-public-ip/admin/`
- **Health**: `http://your-ec2-public-ip/`

### **Step 8: Update Frontend**

Update your frontend environment variables:
```bash
REACT_APP_API_URL=http://your-ec2-public-ip/api
```

Then redeploy frontend:
```bash
cd frontend
vercel --prod --yes
```

## 🔧 **Management Commands**

### **Check Status**
```bash
sudo systemctl status gunicorn
sudo systemctl status nginx
```

### **View Logs**
```bash
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/error.log
```

### **Restart Services**
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### **Update Code**
```bash
cd /var/www/supawave
git pull origin main
source venv/bin/activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py collectstatic --noinput
sudo systemctl restart gunicorn
```

## 🌐 **Add Custom Domain (Optional)**

### **1. Point Domain to EC2**
- Add A record: `yourdomain.com` → `your-ec2-ip`

### **2. Update Nginx Config**
```bash
sudo nano /etc/nginx/sites-available/supawave
# Change server_name to your domain
sudo systemctl restart nginx
```

### **3. Add SSL Certificate**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 💰 **Cost Estimate**
- **EC2 t2.micro**: Free for 12 months
- **Data Transfer**: 15GB free/month
- **After free tier**: ~$8-10/month

## 🚀 **Your Live SupaWave Platform**
- **Backend**: `http://your-ec2-ip/api/`
- **Frontend**: `https://your-frontend.vercel.app`
- **Database**: Your existing CockroachDB
- **Files**: Your existing AWS S3

Perfect for production use! 🎉