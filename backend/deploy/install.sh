#!/bin/bash
# SupaWave EC2 Installation Script

echo "🚀 Installing SupaWave on EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.9 and pip
sudo apt install -y python3.9 python3.9-venv python3-pip

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Create app directory
sudo mkdir -p /var/www/supawave
sudo chown $USER:$USER /var/www/supawave

# Clone repository
cd /var/www/supawave
git clone https://github.com/yourusername/supawave.git .

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Install Gunicorn
pip install gunicorn

echo "✅ Installation complete!"
echo "Next: Configure environment variables and start services"