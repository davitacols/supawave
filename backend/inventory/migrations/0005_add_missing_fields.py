from django.db import migrations, models
import uuid

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0004_auto_20250903_1937'),
    ]

    operations = [
        # Add missing fields to Product
        migrations.AddField(
            model_name='product',
            name='sku',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='product',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        
        # Add missing fields to Category
        migrations.AddField(
            model_name='category',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        
        # Add missing fields to Supplier
        migrations.AddField(
            model_name='supplier',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]