# Generated by Django 5.1.7 on 2025-03-16 03:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_mailinglistsubscriber'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='mailinglistsubscriber',
            options={'ordering': ['-subscribed_at'], 'verbose_name': 'Mailing List Subscriber', 'verbose_name_plural': 'Mailing List Subscribers'},
        ),
        migrations.AlterField(
            model_name='mailinglistsubscriber',
            name='id',
            field=models.AutoField(primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='mailinglistsubscriber',
            name='interests',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='mailinglistsubscriber',
            name='subscribed_at',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='mailinglistsubscriber',
            name='university',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
