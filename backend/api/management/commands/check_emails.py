from django.core.management.base import BaseCommand
from api.services.gmail_service import check_new_emails

class Command(BaseCommand):
    help = 'Check for new emails from board members and store them for approval'

    def handle(self, *args, **options):
        try:
            self.stdout.write('Checking for new emails...')
            check_new_emails()
            self.stdout.write(self.style.SUCCESS('Successfully checked for new emails'))
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error checking emails: {str(e)}')
            ) 