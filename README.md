# SupaWave - Complete Business Management Platform

🚀 **The Ultimate Inventory & Business Management Solution for African SMEs**

## Quick Deploy

### Docker (Recommended)
```bash
# Clone repository
git clone https://github.com/yourusername/supawave.git
cd supawave

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Deploy with Docker
docker-compose up -d
```

### Manual Setup
```bash
# Backend
cd backend-node
npm install
npm start

# Frontend
cd frontend
npm install
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `CLAUDE_API_KEY` - Anthropic Claude API key
- `PAYSTACK_SECRET_KEY` - Paystack payment key
- `AWS_ACCESS_KEY_ID` - AWS S3 credentials

## Deployment

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy backend service

### Vercel (Frontend)
1. Connect GitHub repository
2. Set `REACT_APP_API_URL`
3. Deploy

## Features

- 📊 Real-time Dashboard
- 🛒 POS System
- 📦 Inventory Management
- 🤖 AI Business Assistant
- 💳 Payment Integration
- 📱 Mobile Responsive

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Tailwind CSS
- **AI**: Claude 3.5 Sonnet
- **Payments**: Paystack
- **Storage**: AWS S3
- **Deployment**: Docker, Railway, Vercel