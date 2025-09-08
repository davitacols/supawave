import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Avg, Sum, Count, F
from decimal import Decimal
from .models import BusinessInsight, MarketIntelligence, AICoachSession
from sales.models import Sale, SaleItem
from inventory.models import Product
from marketplace.models import MarketplaceListing
# # from .ai_service import AIService
from django.db.models import Min, Max

class BusinessCoachService:
    def __init__(self, business):
        self.business = business
        # self.ai_service = AIService()
    
    def generate_daily_insights(self):
        """Generate daily AI insights for the business"""
        insights = []
        
        # Pricing insights
        insights.extend(self._analyze_pricing())
        
        # Inventory insights
        insights.extend(self._analyze_inventory())
        
        # Market intelligence
        insights.extend(self._analyze_market_trends())
        
        # Demand forecasting
        insights.extend(self._forecast_demand())
        
        return insights
    
    def _analyze_pricing(self):
        """Analyze pricing vs market and suggest optimizations"""
        insights = []
        
        # Get products with marketplace data
        products = Product.objects.filter(business=self.business, is_active=True)
        
        for product in products[:5]:  # Limit to top 5 for performance
            market_data = MarketIntelligence.objects.filter(
                product_name__icontains=product.name.split()[0]  # Match first word
            ).first()
            
            if market_data:
                price_diff = float(product.selling_price) - float(market_data.avg_price)
                
                if price_diff > float(market_data.avg_price) * 0.15:  # 15% above market
                    insights.append(BusinessInsight(
                        business=self.business,
                        insight_type='pricing',
                        priority='high',
                        title=f'{product.name} - Price Too High',
                        message=f'Your price (₦{product.selling_price}) is {abs(price_diff):.0f} above market average (₦{market_data.avg_price}). Consider reducing to ₦{market_data.avg_price} to stay competitive.',
                        action_required=True,
                        confidence_score=0.85,
                        data_sources=['marketplace_data', 'pricing_analysis']
                    ))
                elif price_diff < -float(market_data.avg_price) * 0.10:  # 10% below market
                    potential_profit = abs(price_diff) * product.stock_quantity
                    insights.append(BusinessInsight(
                        business=self.business,
                        insight_type='opportunity',
                        priority='medium',
                        title=f'{product.name} - Pricing Opportunity',
                        message=f'You can increase price from ₦{product.selling_price} to ₦{market_data.avg_price} (market average). Potential additional profit: ₦{potential_profit:.0f}',
                        action_required=True,
                        confidence_score=0.90,
                        data_sources=['marketplace_data', 'profit_analysis']
                    ))
        
        return insights
    
    def _analyze_inventory(self):
        """Analyze inventory levels and predict stockouts"""
        insights = []
        
        # Get sales velocity for last 7 days
        week_ago = timezone.now() - timedelta(days=7)
        recent_sales = SaleItem.objects.filter(
            sale__business=self.business,
            sale__created_at__gte=week_ago
        ).values('product').annotate(
            total_sold=Sum('quantity'),
            daily_avg=Sum('quantity') / 7
        )
        
        for sale_data in recent_sales:
            try:
                product = Product.objects.get(id=sale_data['product'])
                daily_avg = sale_data['daily_avg'] or 0
                
                if daily_avg > 0:
                    days_remaining = product.stock_quantity / daily_avg
                    
                    if days_remaining <= 2:
                        insights.append(BusinessInsight(
                            business=self.business,
                            insight_type='inventory',
                            priority='urgent',
                            title=f'{product.name} - Stock Emergency',
                            message=f'Only {days_remaining:.1f} days of stock remaining! Current: {product.stock_quantity} units. Daily sales: {daily_avg:.1f} units. Reorder immediately.',
                            action_required=True,
                            confidence_score=0.95,
                            data_sources=['sales_velocity', 'current_stock']
                        ))
                    elif days_remaining <= 5:
                        reorder_qty = int(daily_avg * 14)  # 2 weeks supply
                        insights.append(BusinessInsight(
                            business=self.business,
                            insight_type='inventory',
                            priority='high',
                            title=f'{product.name} - Reorder Soon',
                            message=f'{days_remaining:.1f} days of stock left. Suggest ordering {reorder_qty} units for 2-week supply.',
                            action_required=True,
                            confidence_score=0.88,
                            data_sources=['sales_velocity', 'reorder_calculation']
                        ))
            except Product.DoesNotExist:
                continue
        
        return insights
    
    def _analyze_market_trends(self):
        """Analyze marketplace trends and competition"""
        insights = []
        
        # Check for new competitive listings
        recent_listings = MarketplaceListing.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=1),
            status='active'
        ).exclude(seller=self.business)
        
        business_products = Product.objects.filter(business=self.business, is_active=True)
        
        for listing in recent_listings[:3]:  # Limit for performance
            # Find matching products
            matching_products = business_products.filter(
                name__icontains=listing.product_name.split()[0]
            )
            
            for product in matching_products:
                price_diff = float(product.selling_price) - float(listing.unit_price)
                
                if price_diff > float(listing.unit_price) * 0.20:  # 20% more expensive
                    insights.append(BusinessInsight(
                        business=self.business,
                        insight_type='competition',
                        priority='medium',
                        title=f'New Competitor - {listing.product_name}',
                        message=f'{listing.seller_name} is selling {listing.product_name} at ₦{listing.unit_price} vs your ₦{product.selling_price}. Consider price adjustment.',
                        action_required=False,
                        confidence_score=0.75,
                        data_sources=['marketplace_listings', 'competitor_analysis']
                    ))
        
        return insights
    
    def _forecast_demand(self):
        """Forecast demand based on patterns"""
        insights = []
        
        # Analyze day-of-week patterns
        today = timezone.now().weekday()  # 0=Monday, 6=Sunday
        
        # Weekend demand surge prediction
        if today == 4:  # Friday
            insights.append(BusinessInsight(
                business=self.business,
                insight_type='demand',
                priority='medium',
                title='Weekend Demand Surge Expected',
                message='Weekend approaching. Historically, sales increase 25-40% on weekends. Ensure adequate stock of fast-moving items.',
                action_required=False,
                confidence_score=0.80,
                data_sources=['historical_patterns', 'weekend_analysis']
            ))
        
        # Month-end salary pattern
        day_of_month = timezone.now().day
        if day_of_month >= 28:
            insights.append(BusinessInsight(
                business=self.business,
                insight_type='demand',
                priority='medium',
                title='Month-End Sales Boost Expected',
                message='Salary payments typically increase customer spending in the last few days of the month. Stock up on popular items.',
                action_required=False,
                confidence_score=0.75,
                data_sources=['monthly_patterns', 'salary_cycle_analysis']
            ))
        
        return insights
    
    def ask_coach(self, query, language='en'):
        """Process natural language business questions"""
        
        # Get business context
        context = self._get_business_context()
        
        # Prepare prompt for AI
        prompt = f"""
        You are an AI business coach for African mini-supermarkets. 
        
        Business Context:
        - Business: {self.business.name}
        - Products: {context['product_count']} items
        - Daily Revenue: ₦{context['daily_revenue']}
        - Top Products: {', '.join(context['top_products'])}
        
        User Question: {query}
        
        Provide practical, actionable advice specific to small African retail businesses. 
        Keep response under 200 words. Be encouraging and specific.
        """
        
        try:
            # Simple rule-based responses for now
            response = self._generate_simple_response(query)
            
            # Save session
            session = AICoachSession.objects.create(
                business=self.business,
                query=query,
                response=response,
                language=language
            )
            
            return response
        except Exception as e:
            return "I'm having trouble right now. Please try asking your question again in a few minutes."
    
    def _generate_simple_response(self, query):
        """Generate simple rule-based responses"""
        query_lower = query.lower()
        
        if 'price' in query_lower or 'pricing' in query_lower:
            return "Check your marketplace for competitor prices. Consider pricing 5-10% below market average for fast-moving items, and at market rate for unique products."
        elif 'stock' in query_lower or 'inventory' in query_lower:
            return "Monitor your daily sales patterns. Reorder when you have 3-5 days of stock remaining. Keep 2 weeks supply of fast-moving items."
        elif 'profit' in query_lower or 'money' in query_lower:
            return "Focus on high-margin products and reduce waste. Track your daily expenses and aim for 20-30% profit margins on most items."
        elif 'customer' in query_lower:
            return "Build relationships with regular customers. Offer credit to trusted customers and consider loyalty rewards for frequent buyers."
        else:
            return "I can help with pricing, inventory, profits, and customer management. What specific area would you like advice on?"
    
    def _get_business_context(self):
        """Get current business context for AI"""
        today = timezone.now().date()
        
        # Daily revenue
        daily_sales = Sale.objects.filter(
            business=self.business,
            created_at__date=today
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Product count
        product_count = Product.objects.filter(
            business=self.business,
            is_active=True
        ).count()
        
        # Top selling products (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        top_products = SaleItem.objects.filter(
            sale__business=self.business,
            sale__created_at__gte=week_ago
        ).values('product__name').annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:3]
        
        return {
            'daily_revenue': daily_sales,
            'product_count': product_count,
            'top_products': [item['product__name'] for item in top_products]
        }
    
    def update_market_intelligence(self):
        """Update market intelligence from marketplace data"""
        
        # Aggregate marketplace pricing data
        listings = MarketplaceListing.objects.filter(
            status='active',
            created_at__gte=timezone.now() - timedelta(days=30)
        ).values('product_name').annotate(
            avg_price=Avg('unit_price'),
            min_price=Min('unit_price'),
            max_price=Max('unit_price'),
            count=Count('id')
        ).filter(count__gte=3)  # At least 3 listings for reliability
        
        for listing_data in listings:
            MarketIntelligence.objects.update_or_create(
                product_name=listing_data['product_name'],
                region='Nigeria',
                defaults={
                    'avg_price': listing_data['avg_price'],
                    'min_price': listing_data['min_price'],
                    'max_price': listing_data['max_price'],
                    'sample_size': listing_data['count'],
                }
            )