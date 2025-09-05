from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0002_sale_customer_phone'),
        ('inventory', '0006_convert_to_uuid'),
    ]

    operations = [
        # Drop and recreate sales tables to work with UUID products
        migrations.RunSQL(
            "DROP TABLE IF EXISTS sales_saleitem CASCADE;",
            reverse_sql="SELECT 1;"
        ),
        migrations.RunSQL(
            "DROP TABLE IF EXISTS sales_sale CASCADE;",
            reverse_sql="SELECT 1;"
        ),
        
        # Recreate with proper UUID foreign key
        migrations.RunSQL("""
            CREATE TABLE sales_sale (
                id BIGSERIAL PRIMARY KEY,
                total_amount DECIMAL(10,2) NOT NULL,
                customer_phone VARCHAR(20) DEFAULT '',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                business_id BIGINT REFERENCES accounts_business(id) ON DELETE CASCADE
            );
        """),
        
        migrations.RunSQL("""
            CREATE TABLE sales_saleitem (
                id BIGSERIAL PRIMARY KEY,
                quantity INTEGER NOT NULL,
                unit_price DECIMAL(10,2) NOT NULL,
                total_price DECIMAL(10,2) NOT NULL,
                sale_id BIGINT REFERENCES sales_sale(id) ON DELETE CASCADE,
                product_id UUID REFERENCES inventory_product(id) ON DELETE CASCADE
            );
        """),
    ]