# Generated by Django 5.1.7 on 2025-03-17 01:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_remove_incomingemail_extracted_links'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='event',
            options={'ordering': ['-start_date']},
        ),
        migrations.RenameField(
            model_name='event',
            old_name='image',
            new_name='cover_image',
        ),
        migrations.RenameField(
            model_name='event',
            old_name='date',
            new_name='start_date',
        ),
        migrations.RenameField(
            model_name='event',
            old_name='location',
            new_name='venue',
        ),
        migrations.AddField(
            model_name='event',
            name='capacity',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='category',
            field=models.CharField(choices=[('SEMINAR', 'Seminar'), ('SOCIAL', 'Social Event'), ('WORKSHOP', 'Workshop'), ('CONFERENCE', 'Conference'), ('CULTURAL', 'Cultural Event'), ('OTHER', 'Other')], default='OTHER', max_length=20),
        ),
        migrations.AddField(
            model_name='event',
            name='current_registrations',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='event',
            name='end_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='registration_link',
            field=models.URLField(blank=True),
        ),
    ]
