from django.db import models
from django.conf import settings
from django.utils import timezone

class TeamMember(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    image = models.URLField()
    description = models.TextField()
    year = models.CharField(max_length=4)
    major = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.role}"

class Event(models.Model):
    EVENT_CATEGORIES = [
        ('SEMINAR', 'Seminar'),
        ('SOCIAL', 'Social Event'),
        ('WORKSHOP', 'Workshop'),
        ('CONFERENCE', 'Conference'),
        ('CULTURAL', 'Cultural Event'),
        ('OTHER', 'Other'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    venue = models.CharField(max_length=200)
    registration_link = models.URLField(blank=True)
    cover_image = models.URLField(blank=True)
    category = models.CharField(max_length=20, choices=EVENT_CATEGORIES, default='OTHER')
    capacity = models.PositiveIntegerField(null=True, blank=True)
    current_registrations = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events'
    )
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        
    def __str__(self):
        return self.title
    
    @property
    def is_full(self):
        if self.capacity is None:
            return False
        return self.current_registrations >= self.capacity
    
    @property
    def spots_left(self):
        if self.capacity is None:
            return None
        return max(0, self.capacity - self.current_registrations)
    
    @property
    def has_ended(self):
        return timezone.now() > (self.end_date or self.start_date)

class Article(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    image = models.URLField(blank=True)
    published_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ['-published_date']

    def __str__(self):
        return self.title

class MailingListSubscriber(models.Model):
    id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    university = models.CharField(max_length=100, blank=True, null=True)
    interests = models.CharField(max_length=255, blank=True, null=True)
    is_student = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = 'Mailing List Subscriber'
        verbose_name_plural = 'Mailing List Subscribers'

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class IncomingEmail(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    sender_email = models.EmailField()
    subject = models.CharField(max_length=255)
    content = models.TextField()
    html_content = models.TextField(blank=True, null=True)  # For HTML emails
    received_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    original_email_id = models.CharField(max_length=255, unique=True)  # Gmail message ID
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_emails'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Fields for attachments
    has_attachments = models.BooleanField(default=False)
    attachments = models.JSONField(default=list, blank=True)  # Store attachment metadata
    
    class Meta:
        ordering = ['-received_at']
        verbose_name = 'Incoming Email'
        verbose_name_plural = 'Incoming Emails'

    def __str__(self):
        return f"{self.subject} - {self.sender_email} ({self.status})"
