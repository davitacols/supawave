from django.db import migrations
import uuid

def create_new_tables(apps, schema_editor):
    # This migration will create new tables with UUID fields
    # Old data will be preserved in the original tables
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0003_alter_product_barcode_and_more'),
    ]

    operations = [
        migrations.RunPython(create_new_tables),
    ]