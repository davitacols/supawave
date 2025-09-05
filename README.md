# SupaWave Inventory Management

A Micro SaaS MVP for inventory management designed for mini-supermarkets in Africa.

## Features

- **Multi-tenant Authentication**: JWT-based auth with business isolation
- **Business Onboarding**: Register store with 14-day free trial
- **Inventory Management**: Add/edit/delete products with low stock alerts
- **Sales Module**: Simple POS system with auto-stock updates
- **Dashboard**: Analytics with daily revenue and top-selling products
- **Mobile-friendly**: Responsive design optimized for mobile devices

## Tech Stack

- **Backend**: Django REST Framework, PostgreSQL
- **Frontend**: React, Tailwind CSS, Recharts
- **Authentication**: JWT tokens
- **Deployment**: Docker, Railway/Render ready

## Quick Start

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd supawave
```

2. Start with Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

### Manual Setup

#### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser (optional):
```bash
python manage.py createsuperuser
```

7. Start development server:
```bash
python manage.py runserver
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new business
- `POST /api/auth/login/` - Login
- `GET /api/auth/business/` - Get business info

### Inventory
- `GET /api/inventory/products/` - List products
- `POST /api/inventory/products/` - Create product
- `PUT /api/inventory/products/{id}/` - Update product
- `DELETE /api/inventory/products/{id}/` - Delete product
- `GET /api/inventory/products/low-stock/` - Get low stock products
- `GET /api/inventory/categories/` - List categories
- `GET /api/inventory/suppliers/` - List suppliers

### Sales
- `GET /api/sales/` - List sales
- `POST /api/sales/` - Create sale
- `GET /api/sales/analytics/` - Get sales analytics

## Deployment

### Railway (Backend)

1. Connect your GitHub repository to Railway
2. Set environment variables:
   - `SECRET_KEY`
   - `DEBUG=False`
   - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
3. Deploy automatically on push

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set environment variable: `REACT_APP_API_URL`
4. Deploy automatically on push

### Database Options

- **Development**: PostgreSQL with Docker
- **Production**: 
  - CockroachDB (free tier)
  - Supabase (free tier)
  - Railway PostgreSQL

## Pricing Model

- **Free Trial**: 14 days
- **Subscription**: ₦5,000–₦20,000/month
- **Payment**: Stripe/Paystack integration (placeholder ready)

## Mobile Optimization

The application is designed mobile-first with:
- Responsive design using Tailwind CSS
- Touch-friendly interface
- Bottom navigation for mobile
- Optimized forms and tables

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Submit pull request

## License

MIT License