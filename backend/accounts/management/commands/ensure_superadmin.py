from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = 'Creates a superadmin user if none exists'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(role='ADMIN').exists():
            User.objects.create_user(
                username='*9Why_2004',
                password='*9Why_2004',
                email='admin@yale.edu',
                first_name='Admin',
                last_name='User',
                role='ADMIN'
            )
            self.stdout.write(self.style.SUCCESS('Successfully created superadmin user')) 