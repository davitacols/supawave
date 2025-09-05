from django.db import migrations, models
from django.core.validators import MinValueValidator
import uuid

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0005_add_missing_fields'),
    ]

    operations = [
        # Drop existing tables and recreate with UUID
        migrations.RunSQL(
            "DROP TABLE IF EXISTS inventory_product CASCADE;",
            reverse_sql="SELECT 1;"
        ),
        migrations.RunSQL(
            "DROP TABLE IF EXISTS inventory_category CASCADE;",
            reverse_sql="SELECT 1;"
        ),
        migrations.RunSQL(
            "DROP TABLE IF EXISTS inventory_supplier CASCADE;",
            reverse_sql="SELECT 1;"
        ),
        
        # Recreate tables with proper structure
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('business', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='categories', to='accounts.business')),
            ],
            options={
                'verbose_name_plural': 'Categories',
            },
        ),
        migrations.CreateModel(
            name='Supplier',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('contact', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('business', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='suppliers', to='accounts.business')),
            ],
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('sku', models.CharField(blank=True, max_length=50)),
                ('barcode', models.CharField(blank=True, max_length=13)),
                ('cost_price', models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(0)])),
                ('selling_price', models.DecimalField(decimal_places=2, max_digits=10, validators=[MinValueValidator(0)])),
                ('stock_quantity', models.PositiveIntegerField(default=0)),
                ('low_stock_threshold', models.PositiveIntegerField(default=10)),
                ('reorder_point', models.PositiveIntegerField(default=5)),
                ('max_stock', models.PositiveIntegerField(default=100)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('business', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='products', to='accounts.business')),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, to='inventory.category')),
                ('supplier', models.ForeignKey(blank=True, null=True, on_delete=models.deletion.SET_NULL, to='inventory.supplier')),
            ],
        ),
    ]