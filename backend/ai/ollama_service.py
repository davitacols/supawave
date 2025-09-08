import requests
import json
from django.conf import settings
from datetime import datetime, timedelta

class AIService:
    def __init__(self):
        self.provider = getattr(settings, 'AI_PROVIDER', 'claude')
        self.claude_api_key = getattr(settings, 'CLAUDE_API_KEY', '')
        self.claude_model = getattr(settings, 'CLAUDE_MODEL', 'claude-3-haiku-20240307')
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', '')
        self.openai_model = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')
        self.ollama_base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_model = getattr(settings, 'OLLAMA_MODEL', 'phi3:mini')
    
    def get_business_context(self, business):
        """Get comprehensive business data for context"""
        try:
            from inventory.models import Product, Category, Supplier
            from sales.models import Sale
            from invoices.models import Customer, Invoice
            from credit.models import CreditCustomer
            from django.db.models import Sum, Count, Avg
            from django.db.models.functions import TruncDate
            
            # Safe business name extraction
            business_name = 'Your Store'
            if hasattr(business, 'name'):
                business_name = business.name
            elif hasattr(business, 'business_name'):
                business_name = business.business_name
            
            context = {'business_name': business_name}
            print(f"DEBUG: Business object: {business}, ID: {getattr(business, 'id', 'No ID')}")
            
            # Product Analytics
            try:
                # Try different business field names
                products = None
                for field in ['business', 'business_id', 'owner']:
                    try:
                        filter_kwargs = {field: business}
                        products = Product.objects.filter(**filter_kwargs)
                        if products.exists():
                            break
                    except:
                        continue
                
                if products is None:
                    products = Product.objects.all()  # Fallback to all products
                
                product_count = products.count()
                print(f"DEBUG: Found {product_count} products")
                context.update({
                    'total_products': product_count,
                    'low_stock_items': products.filter(stock_quantity__lte=10).count(),
                    'out_of_stock': products.filter(stock_quantity=0).count(),
                })
                
                # Try categories and suppliers
                try:
                    context['categories_count'] = Category.objects.filter(business=business).count()
                except:
                    context['categories_count'] = Category.objects.count()
                
                try:
                    context['suppliers_count'] = Supplier.objects.filter(business=business).count()
                except:
                    context['suppliers_count'] = 0
                
                # Top products by actual sales volume
                from sales.models import SaleItem
                
                # Get products with their total sales quantity
                product_sales = SaleItem.objects.filter(
                    product__business=business
                ).values('product').annotate(
                    total_sold=Sum('quantity')
                ).order_by('-total_sold')[:10]
                
                context['product_details'] = []
                for sale_data in product_sales:
                    try:
                        product = Product.objects.get(id=sale_data['product'])
                        context['product_details'].append({
                            'name': product.name,
                            'category': getattr(product.category, 'name', 'Uncategorized') if product.category else 'Uncategorized',
                            'sold': sale_data['total_sold'],
                            'stock': product.stock_quantity,
                            'price': float(product.selling_price),
                            'cost': float(product.cost_price),
                            'profit_margin': float(product.selling_price) - float(product.cost_price)
                        })
                    except Product.DoesNotExist:
                        continue
                
            except Exception as e:
                print(f"DEBUG: Product error: {str(e)}")
                context.update({'total_products': 0, 'low_stock_items': 0, 'product_details': []})
            
            # Sales Analytics
            try:
                today = datetime.now().date()
                week_ago = today - timedelta(days=7)
                month_ago = today - timedelta(days=30)
                
                # Try different business field names for sales
                weekly_sales = None
                for field in ['business', 'business_id', 'owner']:
                    try:
                        filter_kwargs = {field: business, 'created_at__date__gte': week_ago}
                        weekly_sales = Sale.objects.filter(**filter_kwargs)
                        if weekly_sales.exists():
                            break
                    except:
                        continue
                
                if weekly_sales is None:
                    weekly_sales = Sale.objects.filter(created_at__date__gte=week_ago)  # Fallback
                context.update({
                    'weekly_revenue': float(weekly_sales.aggregate(total=Sum('total_amount'))['total'] or 0),
                    'weekly_sales_count': weekly_sales.count(),
                    'avg_sale_amount': float(weekly_sales.aggregate(avg=Avg('total_amount'))['avg'] or 0),
                })
                
                # Monthly stats
                monthly_sales = None
                for field in ['business', 'business_id', 'owner']:
                    try:
                        filter_kwargs = {field: business, 'created_at__date__gte': month_ago}
                        monthly_sales = Sale.objects.filter(**filter_kwargs)
                        if monthly_sales.exists():
                            break
                    except:
                        continue
                
                if monthly_sales is None:
                    monthly_sales = Sale.objects.filter(created_at__date__gte=month_ago)
                context.update({
                    'monthly_revenue': float(monthly_sales.aggregate(total=Sum('total_amount'))['total'] or 0),
                    'monthly_sales_count': monthly_sales.count(),
                })
                
                # Daily breakdown (last 7 days)
                daily_sales = weekly_sales.extra({'date': 'date(created_at)'}).values('date').annotate(
                    revenue=Sum('total_amount'), count=Count('id')
                ).order_by('-date')
                context['daily_breakdown'] = [{
                    'date': day['date'].strftime('%Y-%m-%d'),
                    'revenue': float(day['revenue']),
                    'sales': day['count']
                } for day in daily_sales]
                
                # Recent sales
                recent_sales = None
                for field in ['business', 'business_id', 'owner']:
                    try:
                        filter_kwargs = {field: business}
                        recent_sales = Sale.objects.filter(**filter_kwargs).order_by('-created_at')[:15]
                        if recent_sales.exists():
                            break
                    except:
                        continue
                
                if recent_sales is None:
                    recent_sales = Sale.objects.all().order_by('-created_at')[:15]
                context['recent_sales'] = [{
                    'id': str(sale.id)[:8],
                    'amount': float(sale.total_amount),
                    'date': sale.created_at.strftime('%Y-%m-%d %H:%M'),
                    'customer': getattr(sale, 'customer_name', 'Walk-in'),
                    'payment_method': getattr(sale, 'payment_method', 'Cash')
                } for sale in recent_sales]
                
            except Exception as e:
                print(f"DEBUG: Sales error: {str(e)}")
                context.update({'weekly_revenue': 0, 'weekly_sales_count': 0, 'recent_sales': []})
            
            # Customer Analytics
            try:
                customers = Customer.objects.filter(business=business)
                credit_customers = CreditCustomer.objects.filter(business=business)
                context.update({
                    'total_customers': customers.count(),
                    'credit_customers': credit_customers.count(),
                    'total_credit_balance': float(credit_customers.aggregate(total=Sum('current_balance'))['total'] or 0),
                })
            except Exception as e:
                context.update({'total_customers': 0, 'credit_customers': 0})
            
            # Invoice Analytics
            try:
                invoices = Invoice.objects.filter(business=business)
                context.update({
                    'total_invoices': invoices.count(),
                    'pending_invoices': invoices.filter(status='sent').count(),
                    'paid_invoices': invoices.filter(status='paid').count(),
                    'overdue_invoices': invoices.filter(status='overdue').count(),
                })
            except Exception as e:
                context.update({'total_invoices': 0, 'pending_invoices': 0})
            
            # Staff Management
            try:
                from accounts.models import User
                from stores.models import Store
                
                staff = User.objects.filter(business=business)
                context.update({
                    'total_staff': staff.count(),
                    'active_staff': staff.filter(is_active_staff=True).count(),
                    'managers': staff.filter(role='manager').count(),
                    'cashiers': staff.filter(role='cashier').count(),
                    'owners': staff.filter(role='owner').count(),
                })
                
                # Recent staff activity
                recent_staff = staff.filter(last_login__isnull=False).order_by('-last_login')[:5]
                context['staff_activity'] = [{
                    'name': f"{s.first_name} {s.last_name}",
                    'role': s.role,
                    'last_login': s.last_login.strftime('%Y-%m-%d %H:%M') if s.last_login else 'Never',
                    'active': s.is_active_staff
                } for s in recent_staff]
                
            except Exception as e:
                context.update({'total_staff': 0, 'active_staff': 0, 'staff_activity': []})
            
            # Store Management
            try:
                stores = Store.objects.filter(business=business)
                context.update({
                    'total_stores': stores.count(),
                    'active_stores': stores.filter(is_active=True).count(),
                    'main_store': stores.filter(is_main_store=True).first().name if stores.filter(is_main_store=True).exists() else 'Not set',
                })
                
                # Store details
                store_details = []
                for store in stores[:5]:  # Top 5 stores
                    store_sales = Sale.objects.filter(store=store, created_at__date__gte=week_ago)
                    store_details.append({
                        'name': store.name,
                        'manager': store.manager_name or 'No manager',
                        'active': store.is_active,
                        'weekly_sales': float(store_sales.aggregate(total=Sum('total_amount'))['total'] or 0),
                        'sales_count': store_sales.count()
                    })
                context['store_details'] = store_details
                
            except Exception as e:
                context.update({'total_stores': 1, 'active_stores': 1, 'store_details': []})
            
            # Business Performance Metrics
            try:
                # Calculate growth rates
                last_week = today - timedelta(days=14)
                prev_week_sales = Sale.objects.filter(
                    business=business, 
                    created_at__date__gte=last_week,
                    created_at__date__lt=week_ago
                ).aggregate(total=Sum('total_amount'))['total'] or 0
                
                if prev_week_sales > 0:
                    growth_rate = ((context.get('weekly_revenue', 0) - float(prev_week_sales)) / float(prev_week_sales)) * 100
                    context['weekly_growth_rate'] = round(growth_rate, 2)
                else:
                    context['weekly_growth_rate'] = 0
                    
            except Exception as e:
                context['weekly_growth_rate'] = 0
            
            return context
            
        except Exception as e:
            return {
                'business_name': 'Your Store',
                'total_products': 0,
                'weekly_revenue': 0.0,
                'recent_sales': [],
                'product_details': []
            }
    
    def chat(self, message, business):
        """Send message to AI provider with business context"""
        try:
            context = self.get_business_context(business)
            
            if self.provider == 'claude' and self.claude_api_key:
                return self.chat_with_claude(message, context)
            elif self.provider == 'openai' and self.openai_api_key:
                return self.chat_with_openai(message, context)
            else:
                return self.chat_with_ollama(message, context)
                
        except Exception as e:
            return "💡 " + self.get_mock_response(message, context)
    
    def chat_with_claude(self, message, context):
        """Chat with Claude AI"""
        try:
            # Format comprehensive business data
            product_info = ""
            for product in context.get('product_details', [])[:5]:
                margin = product.get('profit_margin', 0)
                product_info += f"\n- {product['name']} ({product.get('category', 'N/A')}): {product['sold']} sold, {product['stock']} stock, ₦{product['price']:,.0f} (margin: ₦{margin:,.0f})"
            
            sales_info = ""
            for sale in context.get('recent_sales', [])[:5]:
                sales_info += f"\n- #{sale['id']}: ₦{sale['amount']:,.0f} on {sale['date']} - {sale['customer']} ({sale.get('payment_method', 'Cash')})"
            
            daily_info = ""
            for day in context.get('daily_breakdown', [])[:3]:
                daily_info += f"\n- {day['date']}: ₦{day['revenue']:,.0f} ({day['sales']} sales)"
            
            staff_info = ""
            for staff in context.get('staff_activity', [])[:3]:
                status = "🟢" if staff['active'] else "🔴"
                staff_info += f"\n- {staff['name']} ({staff['role']}) {status} - Last login: {staff['last_login']}"
            
            store_info = ""
            for store in context.get('store_details', [])[:3]:
                status = "🟢" if store['active'] else "🔴"
                store_info += f"\n- {store['name']} {status} - Manager: {store['manager']} - Weekly: ₦{store['weekly_sales']:,.0f} ({store['sales_count']} sales)"
            
            system_prompt = f"""You are a business assistant for {context.get('business_name', 'Your Store')}, a retail store in Africa.

BUSINESS OVERVIEW:
- Products: {context.get('total_products', 0)} total, {context.get('categories_count', 0)} categories, {context.get('suppliers_count', 0)} suppliers
- Stock: {context.get('low_stock_items', 0)} low stock, {context.get('out_of_stock', 0)} out of stock
- Customers: {context.get('total_customers', 0)} total, {context.get('credit_customers', 0)} credit customers
- Credit balance: ₦{context.get('total_credit_balance', 0):,.0f}
- Invoices: {context.get('total_invoices', 0)} total, {context.get('pending_invoices', 0)} pending, {context.get('overdue_invoices', 0)} overdue

STAFF & STORES:
- Staff: {context.get('total_staff', 0)} total ({context.get('active_staff', 0)} active) - {context.get('owners', 0)} owners, {context.get('managers', 0)} managers, {context.get('cashiers', 0)} cashiers
- Stores: {context.get('total_stores', 1)} total ({context.get('active_stores', 1)} active) - Main: {context.get('main_store', 'Not set')}

SALES PERFORMANCE:
- This week: ₦{context.get('weekly_revenue', 0):,.0f} ({context.get('weekly_sales_count', 0)} sales)
- This month: ₦{context.get('monthly_revenue', 0):,.0f} ({context.get('monthly_sales_count', 0)} sales)
- Average sale: ₦{context.get('avg_sale_amount', 0):,.0f}
- Growth rate: {context.get('weekly_growth_rate', 0)}%

TOP PRODUCTS:{product_info}

RECENT SALES:{sales_info}

DAILY BREAKDOWN:{daily_info}

STAFF ACTIVITY:{staff_info}

STORE PERFORMANCE:{store_info}

Provide specific, actionable business insights using this comprehensive data. Keep responses under 200 words."""

            payload = {
                'model': self.claude_model,
                'max_tokens': 200,
                'system': system_prompt,
                'messages': [{'role': 'user', 'content': message}]
            }
            
            response = requests.post(
                'https://api.anthropic.com/v1/messages',
                headers={
                    'x-api-key': self.claude_api_key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return "🧠 " + response.json()['content'][0]['text']
            else:
                return "💡 " + self.get_mock_response(message, context)
                
        except Exception as e:
            return "💡 " + self.get_mock_response(message, context)
    
    def chat_with_openai(self, message, context):
        """Chat with OpenAI"""
        try:
            system_prompt = f"""You are a business assistant for {context.get('business_name', 'Your Store')}, a retail store. 
            
Current business data:
- Total products: {context.get('total_products', 0)}
- Low stock items: {context.get('low_stock_items', 0)}
- Weekly revenue: ₦{context.get('weekly_revenue', 0):,.2f}
- Weekly sales: {context.get('weekly_sales_count', 0)} transactions
- Top products: {', '.join(context.get('top_products', []))}

Provide helpful, concise business insights and recommendations. Keep responses under 150 words."""

            payload = {
                'model': self.openai_model,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': message}
                ],
                'max_tokens': 200
            }
            
            response = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {self.openai_api_key}',
                    'Content-Type': 'application/json'
                },
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return "🤖 " + response.json()['choices'][0]['message']['content']
            else:
                return "💡 " + self.get_mock_response(message, context)
                
        except Exception as e:
            return "💡 " + self.get_mock_response(message, context)
    
    def chat_with_ollama(self, message, context):
        """Chat with local Ollama"""
        try:
            system_prompt = f"""You are a business assistant for {context.get('business_name', 'Your Store')}, a retail store. 
            
Current business data:
- Total products: {context.get('total_products', 0)}
- Low stock items: {context.get('low_stock_items', 0)}
- Weekly revenue: ₦{context.get('weekly_revenue', 0):,.2f}
- Weekly sales: {context.get('weekly_sales_count', 0)} transactions
- Top products: {', '.join(context.get('top_products', []))}

Provide helpful, concise business insights and recommendations. Keep responses under 150 words."""

            payload = {
                'model': self.ollama_model,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': message}
                ],
                'stream': False
            }
            
            response = requests.post(
                f'{self.ollama_base_url}/api/chat',
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                return "🤖 " + response.json()['message']['content']
            else:
                return "💡 " + self.get_mock_response(message, context)
                
        except Exception as e:
            return "💡 " + self.get_mock_response(message, context)
    
    def get_mock_response(self, message, context):
        """Mock responses when Ollama is not available"""
        message_lower = message.lower()
        
        if 'sales' in message_lower or 'revenue' in message_lower:
            return f"Your weekly revenue is ₦{context['weekly_revenue']:,.2f} from {context['weekly_sales_count']} transactions. This shows good customer activity!"
        
        elif 'stock' in message_lower or 'inventory' in message_lower:
            return f"You have {context['low_stock_items']} items running low. Consider restocking your top sellers: {', '.join(context['top_products'][:2])}."
        
        elif 'products' in message_lower or 'selling' in message_lower:
            return f"Your top performing products are: {', '.join(context['top_products'])}. These generate most of your revenue."
        
        elif 'advice' in message_lower or 'recommend' in message_lower:
            return f"Focus on your {context['total_products']} products. With ₦{context['weekly_revenue']:,.2f} weekly revenue, consider expanding your top categories."
        
        else:
            return f"I can help with questions about your {context['total_products']} products, ₦{context['weekly_revenue']:,.2f} weekly revenue, or business advice. What would you like to know?"