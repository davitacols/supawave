#!/bin/bash
# SupaWave EC2 Setup Script

echo "🔧 Setting up SupaWave services..."

# Copy environment file
cp /var/www/supawave/backend/.env.example /var/www/supawave/backend/.env
echo "📝 Edit /var/www/supawave/backend/.env with your settings"

# Activate virtual environment
source /var/www/supawave/venv/bin/activate

# Run migrations
cd /var/www/supawave/backend
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (interactive)
echo "Creating Django superuser..."
python manage.py createsuperuser

# Setup Gunicorn service
sudo cp /var/www/supawave/backend/deploy/gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn

# Setup Nginx
sudo cp /var/www/supawave/backend/deploy/nginx.conf /etc/nginx/sites-available/supawave
sudo ln -s /etc/nginx/sites-available/supawave /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "✅ SupaWave is now running!"
echo "🌐 Access your API at: http://your-ec2-ip/"
echo "🔧 Admin panel at: http://your-ec2-ip/admin/"