from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates default admin user'

    def handle(self, *args, **kwargs):
        # Delete all existing users
        User.objects.all().delete()
        
        # Create the admin user
        admin = User.objects.create_user(
            username='murad',
            email='m.abdukholikov@yale.edu',
            password='4242',
            first_name='Khosilmurod',
            last_name='Abdukholikov',
            graduating_year='2027',
            major='Computer Science',
            title='Tech Chair',
            is_main=True,
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created admin user: {admin.get_full_name()}')) 