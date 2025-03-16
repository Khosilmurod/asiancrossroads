from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        PRESIDENT = 'PRESIDENT', 'President'
        BOARD = 'BOARD', 'Board Member'

    # Backend roles
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.BOARD
    )
    
    # Profile fields
    graduating_year = models.CharField(max_length=4, blank=True)
    major = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, help_text="Position/Title in the organization")
    email = models.EmailField(unique=True)
    is_main = models.BooleanField(default=False, help_text="Whether this user should be displayed on the main page")
    
    class Meta:
        ordering = ['username']

    def __str__(self):
        return f"{self.get_full_name()} - {self.title or self.role}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
