# Generated manually for stocktake fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0009_purchaseorder_salesvelocity_purchaseorderitem_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='stocktakeitem',
            old_name='physical_count',
            new_name='actual_quantity',
        ),
        migrations.RenameField(
            model_name='stocktakeitem',
            old_name='system_count',
            new_name='expected_quantity',
        ),
        migrations.AddField(
            model_name='stocktake',
            name='stocktake_type',
            field=models.CharField(choices=[('manual', 'Manual Count'), ('cycle', 'Cycle Count'), ('automatic', 'Automatic Daily')], default='manual', max_length=20),
        ),
        migrations.AlterField(
            model_name='stocktake',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, to='accounts.user'),
        ),
    ]